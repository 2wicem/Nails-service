import os
from pathlib import Path
from urllib.parse import unquote, urlparse


def env_int(name, default):
    raw = os.getenv(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError:
        return default


def _postgres_options():
    sslmode = os.getenv('POSTGRES_SSLMODE', '').strip()
    if not sslmode:
        sslmode = 'prefer'
    return {'sslmode': sslmode}


def parse_database_url(url: str) -> dict | None:
    if not url:
        return None

    parsed = urlparse(url)
    if parsed.scheme not in ('postgres', 'postgresql', 'postgis'):
        return None

    name = unquote(parsed.path.lstrip('/'))
    if not name:
        return None

    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': name,
        'USER': unquote(parsed.username or ''),
        'PASSWORD': unquote(parsed.password or ''),
        'HOST': parsed.hostname or 'localhost',
        'PORT': str(parsed.port or 5432),
        'CONN_MAX_AGE': env_int('DB_CONN_MAX_AGE', 600),
        'OPTIONS': _postgres_options(),
    }


def postgres_from_env() -> dict | None:
    name = os.getenv('POSTGRES_DB', os.getenv('PGDATABASE', '')).strip()
    user = os.getenv('POSTGRES_USER', os.getenv('PGUSER', '')).strip()
    password = os.getenv('POSTGRES_PASSWORD', os.getenv('PGPASSWORD', '')).strip()
    host = os.getenv('POSTGRES_HOST', os.getenv('PGHOST', '')).strip()

    if not any((name, user, password, host)):
        return None

    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': name or 'nails_service',
        'USER': user or 'postgres',
        'PASSWORD': password,
        'HOST': host or 'localhost',
        'PORT': os.getenv('POSTGRES_PORT', os.getenv('PGPORT', '5432')),
        'CONN_MAX_AGE': env_int('DB_CONN_MAX_AGE', 600),
        'OPTIONS': _postgres_options(),
    }


def sqlite_config(base_dir: Path) -> dict:
    return {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': base_dir / 'db.sqlite3',
    }


def build_databases(*, base_dir: Path, debug: bool) -> dict:
    database_url = os.getenv('DATABASE_URL', '').strip()
    if database_url:
        parsed = parse_database_url(database_url)
        if parsed:
            return {'default': parsed}

    postgres = postgres_from_env()
    if postgres:
        return {'default': postgres}

    use_sqlite = os.getenv('USE_SQLITE', 'True' if debug else 'False').strip().lower()
    if use_sqlite in ('1', 'true', 'yes', 'on'):
        return {'default': sqlite_config(base_dir)}

    if debug:
        return {'default': sqlite_config(base_dir)}

    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured(
        'PostgreSQL is required in production. Set DATABASE_URL or POSTGRES_* in .env.'
    )
