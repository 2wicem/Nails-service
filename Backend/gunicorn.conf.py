import multiprocessing
import os

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = int(os.getenv('WEB_CONCURRENCY', max(2, multiprocessing.cpu_count() * 2 + 1)))
threads = int(os.getenv('GUNICORN_THREADS', '2'))
worker_class = os.getenv('GUNICORN_WORKER_CLASS', 'gthread')
timeout = int(os.getenv('GUNICORN_TIMEOUT', '120'))
keepalive = int(os.getenv('GUNICORN_KEEPALIVE', '5'))
max_requests = int(os.getenv('GUNICORN_MAX_REQUESTS', '1000'))
max_requests_jitter = int(os.getenv('GUNICORN_MAX_REQUESTS_JITTER', '100'))
accesslog = '-'
errorlog = '-'
capture_output = True
