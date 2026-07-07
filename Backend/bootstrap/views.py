from django.http import HttpResponse


def home(request):
    return HttpResponse(
        '<h1>Dopekit API</h1>'
        '<p>Backend is running.</p>'
        '<ul>'
        '<li><a href="/admin/">Admin dashboard</a></li>'
        '<li><a href="/products/">Products API</a></li>'
        '</ul>'
        '<p>Customer site: run the React app at <strong>http://localhost:5173</strong></p>',
        content_type='text/html',
    )
