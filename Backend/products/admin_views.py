import json

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth_utils import user_to_dict
from .models import Booking, ContactMessage, SalonContactInfo, SlotStatus, TimeSlot, UserProfile, UserRole
from .contact_views import _salon_contact_to_dict
from .views import _booking_to_dict, _forbidden, _unauthorized

User = get_user_model()


def _require_admin(request):
    if not request.user.is_authenticated:
        return _unauthorized()
    profile = getattr(request.user, 'profile', None)
    if not profile or profile.role != UserRole.ADMIN:
        return _forbidden('Admin access required.')
    return None


def _admin_user_to_dict(user):
    data = user_to_dict(user)
    data['id'] = user.id
    data['date_joined'] = user.date_joined.isoformat()
    return data


@require_http_methods(['GET'])
def stats(request):
    denied = _require_admin(request)
    if denied:
        return denied

    role_counts = (
        UserProfile.objects.values('role')
        .annotate(count=Count('id'))
        .order_by('role')
    )
    counts_by_role = {row['role']: row['count'] for row in role_counts}

    return JsonResponse(
        {
            'total_bookings': Booking.objects.count(),
            'total_messages': ContactMessage.objects.count(),
            'total_users': User.objects.count(),
            'clients': counts_by_role.get(UserRole.CLIENT, 0),
            'workers': counts_by_role.get(UserRole.WORKER, 0),
            'admins': counts_by_role.get(UserRole.ADMIN, 0),
        }
    )


@require_http_methods(['GET'])
def list_users(request):
    denied = _require_admin(request)
    if denied:
        return denied

    users = User.objects.select_related('profile').order_by('-date_joined')[:200]
    return JsonResponse({'users': [_admin_user_to_dict(user) for user in users]})


def _contact_message_to_dict(message):
    data = {
        'id': message.id,
        'name': message.name,
        'phone': message.phone,
        'email': message.email,
        'message': message.message,
        'created_at': message.created_at.isoformat(),
    }
    if message.user_id:
        data['user'] = {
            'id': message.user_id,
            'email': message.user.email,
            'name': message.user.first_name or message.user.username,
        }
    return data


@require_http_methods(['GET'])
def list_contact_messages(request):
    denied = _require_admin(request)
    if denied:
        return denied

    messages = ContactMessage.objects.select_related('user').order_by('-created_at')[:200]
    return JsonResponse({'messages': [_contact_message_to_dict(item) for item in messages]})


@require_http_methods(['GET'])
def get_salon_contact_info(request):
    denied = _require_admin(request)
    if denied:
        return denied

    return JsonResponse({'contact_info': _salon_contact_to_dict(SalonContactInfo.load())})


@csrf_exempt
@require_http_methods(['PATCH'])
def update_salon_contact_info(request):
    denied = _require_admin(request)
    if denied:
        return denied

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    info = SalonContactInfo.load()

    if 'phone_primary' in data:
        info.phone_primary = data.get('phone_primary', '').strip()
    if 'phone_secondary' in data:
        info.phone_secondary = data.get('phone_secondary', '').strip()
    if 'email' in data:
        info.email = data.get('email', '').strip()
    if 'location' in data:
        info.location = data.get('location', '').strip()
    if 'services_summary' in data:
        info.services_summary = data.get('services_summary', '').strip()
    if 'page_lead' in data:
        info.page_lead = data.get('page_lead', '').strip()

    if not info.phone_primary:
        return JsonResponse({'error': 'Primary phone is required.'}, status=400)
    if not info.email:
        return JsonResponse({'error': 'Email is required.'}, status=400)
    if not info.location:
        return JsonResponse({'error': 'Location is required.'}, status=400)

    info.save()

    return JsonResponse(
        {
            'message': 'Contact information updated.',
            'contact_info': _salon_contact_to_dict(info),
        }
    )


@csrf_exempt
@require_http_methods(['PATCH'])
def update_user_role(request, user_id):
    denied = _require_admin(request)
    if denied:
        return denied

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    role = data.get('role', '').strip().lower()
    valid_roles = {choice[0] for choice in UserRole.choices}
    if role not in valid_roles:
        return JsonResponse({'error': 'Invalid role.'}, status=400)

    target = get_object_or_404(User, pk=user_id)

    if target.id == request.user.id and role != UserRole.ADMIN:
        return JsonResponse({'error': 'You cannot remove your own admin role.'}, status=400)

    profile, _ = UserProfile.objects.get_or_create(
        user=target,
        defaults={'phone': '', 'role': UserRole.CLIENT},
    )
    profile.role = role
    profile.save()

    return JsonResponse(
        {
            'message': 'Role updated successfully.',
            'user': _admin_user_to_dict(target),
        }
    )


@csrf_exempt
@require_http_methods(['DELETE'])
def delete_booking(request, booking_id):
    denied = _require_admin(request)
    if denied:
        return denied

    booking = get_object_or_404(Booking, pk=booking_id)
    TimeSlot.objects.filter(booking=booking).update(
        status=SlotStatus.AVAILABLE,
        booking=None,
    )
    booking.delete()

    return JsonResponse({'message': 'Booking deleted successfully.'})
