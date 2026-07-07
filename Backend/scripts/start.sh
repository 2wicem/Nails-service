#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Starting Gunicorn..."
exec gunicorn bootstrap.wsgi:application --config gunicorn.conf.py
