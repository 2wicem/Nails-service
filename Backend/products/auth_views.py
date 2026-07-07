import json
import re

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .auth_utils import signup_role_from_account_type, user_to_dict
from .models import TechnicianApprovalStatus, UserProfile, UserRole
from .notifications import send_password_reset_email
from .password_utils import PASSWORD_HINT, password_strength_error
from .rate_limit import rate_limit

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


def _find_user_by_email(email):
    email = email.strip().lower()
    if not email:
        return None
    return User.objects.filter(email__iexact=email).first()


def _validate_new_password(password, user=None):
    strength_error = password_strength_error(password)
    if strength_error:
        return strength_error

    try:
        validate_password(password, user=user)
    except ValidationError as exc:
        return ' '.join(exc.messages)

    return None


def _password_reset_url(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}'


@csrf_exempt
@require_http_methods(['POST'])
@rate_limit('auth_register')
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

    if role == UserRole.WORKER and not settings.ALLOW_TECHNICIAN_SELF_SIGNUP:
        return JsonResponse(
            {
                'error': (
                    'Technician self-signup is disabled. '
                    'Ask the salon admin to create your account.'
                ),
            },
            status=403,
        )

    if not EMAIL_PATTERN.match(email):
        return JsonResponse({'error': 'Enter a valid email address.'}, status=400)

    if password != confirm_password:
        return JsonResponse({'error': 'Passwords do not match.'}, status=400)

    if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'An account with this email already exists.'}, status=400)

    password_error = _validate_new_password(
        password,
        user=User(username=email, email=email, first_name=name),
    )
    if password_error:
        return JsonResponse({'error': password_error}, status=400)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name,
    )

    if role == UserRole.WORKER:
        if settings.REQUIRE_TECHNICIAN_APPROVAL:
            UserProfile.objects.create(
                user=user,
                phone=phone,
                role=UserRole.CLIENT,
                technician_approval=TechnicianApprovalStatus.PENDING,
            )
            auth_login(request, user)
            return JsonResponse(
                {
                    'message': (
                        'Application received. An admin will review your '
                        'technician request soon.'
                    ),
                    'user': user_to_dict(user),
                },
                status=201,
            )

        profile = UserProfile.objects.create(
            user=user,
            phone=phone,
            role=UserRole.WORKER,
            technician_approval=TechnicianApprovalStatus.APPROVED,
        )
    else:
        profile = UserProfile.objects.create(
            user=user,
            phone=phone,
            role=UserRole.CLIENT,
            technician_approval=TechnicianApprovalStatus.NOT_APPLICABLE,
        )

    auth_login(request, user)

    success_message = (
        'Welcome to the team! Your technician account is ready.'
        if profile.role == UserRole.WORKER
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
@rate_limit('auth_login')
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


@csrf_exempt
@require_http_methods(['POST'])
@rate_limit('auth_forgot_password')
def forgot_password(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    email = data.get('email', '').strip().lower()
    if not email or not EMAIL_PATTERN.match(email):
        return JsonResponse({'error': 'Enter the email on your account.'}, status=400)

    user = _find_user_by_email(email)
    response = {
        'message': (
            'If an account exists for that email, we sent password reset instructions.'
        ),
    }

    if user:
        reset_url = _password_reset_url(user)
        email_sent = send_password_reset_email(user, reset_url)
        if settings.DEBUG and not email_sent:
            response['debug_reset_link'] = reset_url

    return JsonResponse(response)


@csrf_exempt
@require_http_methods(['POST'])
@rate_limit('auth_reset_password')
def reset_password(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    uid = data.get('uid', '').strip()
    token = data.get('token', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if not uid or not token or not password or not confirm_password:
        return JsonResponse({'error': 'All fields are required.'}, status=400)

    if password != confirm_password:
        return JsonResponse({'error': 'Passwords do not match.'}, status=400)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return JsonResponse({'error': 'This reset link is invalid or expired.'}, status=400)

    if not default_token_generator.check_token(user, token):
        return JsonResponse({'error': 'This reset link is invalid or expired.'}, status=400)

    password_error = _validate_new_password(password, user=user)
    if password_error:
        return JsonResponse({'error': password_error}, status=400)

    user.set_password(password)
    user.save(update_fields=['password'])

    return JsonResponse({'message': 'Password updated. You can log in now.'})


@require_http_methods(['GET'])
@ensure_csrf_cookie
def csrf_bootstrap(request):
    return JsonResponse({'ok': True})


@require_http_methods(['GET'])
def signup_config(request):
    return JsonResponse(
        {
            'allow_technician_signup': settings.ALLOW_TECHNICIAN_SELF_SIGNUP,
            'require_technician_approval': settings.REQUIRE_TECHNICIAN_APPROVAL,
            'password_hint': PASSWORD_HINT,
        }
    )


@require_http_methods(['GET'])
@ensure_csrf_cookie
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'user': None})

    return JsonResponse({'user': user_to_dict(request.user)})
