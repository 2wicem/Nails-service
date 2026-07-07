import json
import re

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth_utils import signup_role_from_account_type, user_to_dict
from .models import UserProfile, UserRole

User = get_user_model()
EMAIL_PATTERN = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _find_user_by_login(login):
    login = login.strip().lower()
    if not login:
        return None

    user = User.objects.filter(email__iexact=login).first()
    if user:
        return user

    return User.objects.filter(username__iexact=login).first()


@csrf_exempt
@require_http_methods(['POST'])
def register(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    account_type = data.get('account_type', 'client')

    if not name or not email or not phone or not password or not confirm_password:
        return JsonResponse({'error': 'All fields are required.'}, status=400)

    role = signup_role_from_account_type(account_type)
    if role is None:
        return JsonResponse({'error': 'Invalid account type.'}, status=400)

    if not EMAIL_PATTERN.match(email):
        return JsonResponse({'error': 'Enter a valid email address.'}, status=400)

    if password != confirm_password:
        return JsonResponse({'error': 'Passwords do not match.'}, status=400)

    if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'An account with this email already exists.'}, status=400)

    try:
        validate_password(password, user=User(username=email, email=email, first_name=name))
    except ValidationError as exc:
        return JsonResponse({'error': ' '.join(exc.messages)}, status=400)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name,
    )
    UserProfile.objects.create(user=user, phone=phone, role=role)
    auth_login(request, user)

    success_message = (
        'Welcome to the team! Your technician account is ready.'
        if role == UserRole.WORKER
        else 'Account created successfully.'
    )

    return JsonResponse(
        {
            'message': success_message,
            'user': user_to_dict(user),
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(['POST'])
def login_view(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return JsonResponse({'error': 'Email and password are required.'}, status=400)

    account = _find_user_by_login(email)
    if account is None:
        return JsonResponse({'error': 'Invalid email or password.'}, status=401)

    user = authenticate(request, username=account.username, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid email or password.'}, status=401)

    auth_login(request, user)

    return JsonResponse(
        {
            'message': 'Logged in successfully.',
            'user': user_to_dict(user),
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def logout_view(request):
    auth_logout(request)
    return JsonResponse({'message': 'Logged out successfully.'})


@require_http_methods(['GET'])
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'user': None})

    return JsonResponse({'user': user_to_dict(request.user)})
