from django.http import JsonResponse


def forbidden(message='Permission denied.'):
    return JsonResponse({'error': message}, status=403)


def unauthorized(message='Authentication required.'):
    return JsonResponse({'error': message}, status=401)
