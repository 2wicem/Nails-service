import json
import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import ContactMessage, SalonContactInfo
from .notifications import notify_contact_message_created

logger = logging.getLogger(__name__)


def _salon_contact_to_dict(info):
    phones = [info.phone_primary]
    if info.phone_secondary:
        phones.append(info.phone_secondary)

    return {
        'phones': phones,
        'phone_primary': info.phone_primary,
        'phone_secondary': info.phone_secondary,
        'email': info.email,
        'location': info.location,
        'services_summary': info.services_summary,
        'page_lead': info.page_lead,
        'updated_at': info.updated_at.isoformat(),
    }


def _contact_message_to_dict(message):
    return {
        'id': message.id,
        'name': message.name,
        'phone': message.phone,
        'email': message.email,
        'message': message.message,
        'created_at': message.created_at.isoformat(),
        'user_id': message.user_id,
    }


@require_http_methods(['GET'])
def get_contact_info(request):
    return JsonResponse({'contact_info': _salon_contact_to_dict(SalonContactInfo.load())})


@csrf_exempt
@require_http_methods(['POST'])
def create_contact_message(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()
    message_text = data.get('message', '').strip()

    if not message_text:
        return JsonResponse({'error': 'Please enter a message.'}, status=400)

    if len(message_text) > 2000:
        return JsonResponse({'error': 'Message is too long (max 2000 characters).'}, status=400)

    if email and '@' not in email:
        return JsonResponse({'error': 'Please enter a valid email address.'}, status=400)

    contact_message = ContactMessage.objects.create(
        user=request.user if request.user.is_authenticated else None,
        name=name,
        phone=phone,
        email=email,
        message=message_text,
    )

    notification_status = notify_contact_message_created(contact_message)

    return JsonResponse(
        {
            'message': 'Your note was sent. We will get back to you soon.',
            'contact_message': _contact_message_to_dict(contact_message),
            'notifications': notification_status,
        },
        status=201,
    )
