import functools

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse


def client_ip(request) -> str:
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown').strip() or 'unknown'


def rate_limit(scope: str):
    """Simple IP-based rate limiter using Django cache."""

    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapped(request, *args, **kwargs):
            limits = getattr(settings, 'RATE_LIMITS', {})
            limit, window = limits.get(scope, (60, 60))
            ip = client_ip(request)
            key = f'ratelimit:{scope}:{ip}'
            current = cache.get(key, 0)
            if current >= limit:
                return JsonResponse(
                    {
                        'error': 'Too many requests. Please wait a few minutes and try again.',
                    },
                    status=429,
                )
            cache.set(key, current + 1, timeout=window)
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator
