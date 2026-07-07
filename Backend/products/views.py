import json
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import F, Q
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .http_responses import forbidden, unauthorized
from .models import Booking, BookingStatus, ServiceVenue, TimeSlot, UserRole
from .notifications import notify_booking_created
from .rate_limit import rate_limit
from .slot_utils import parse_date
from .worker_permissions import require_approved_worker

logger = logging.getLogger(__name__)
User = get_user_model()


def index(request):
    return HttpResponse('Hello World')


def _forbidden(message='Permission denied.'):
    return forbidden(message)


def _unauthorized(message='Authentication required.'):
    return unauthorized(message)


def _booking_to_dict(booking):
    data = {
        'id': booking.id,
        'name': booking.name,
        'phone': booking.phone,
        'location': booking.location,
        'service': booking.service,
        'venue': booking.venue,
        'venue_label': booking.get_venue_display(),
        'status': booking.status,
        'created_at': booking.created_at.isoformat(),
    }
    slot = getattr(booking, 'time_slot', None)
    if slot:
        from .slot_utils import format_slot_label

        data['slot'] = {
            'id': slot.id,
            'date': slot.date.isoformat(),
            'start_hour': slot.start_hour,
            'label': format_slot_label(slot.start_hour),
            'worker_name': slot.worker.first_name or slot.worker.username,
        }
    elif booking.requested_date:
        data['requested_date'] = booking.requested_date.isoformat()
        data['slot_pending'] = True
        if booking.preferred_worker_id:
            worker = booking.preferred_worker
            data['preferred_worker_name'] = worker.first_name or worker.username
    return data


@require_http_methods(['GET'])
def my_bookings(request):
    if not request.user.is_authenticated:
        return _unauthorized()

    profile = getattr(request.user, 'profile', None)
    filters = Q(user=request.user)
    if profile and profile.phone:
        filters |= Q(phone=profile.phone)

    bookings = (
        Booking.objects.filter(filters)
        .exclude(status=BookingStatus.CANCELLED)
        .select_related('time_slot__worker')
        .annotate(
            sort_date=F('time_slot__date'),
            sort_hour=F('time_slot__start_hour'),
        )
        .distinct()
        .order_by(
            F('sort_date').asc(nulls_last=True),
            F('sort_hour').asc(nulls_last=True),
            '-created_at',
        )[:50]
    )
    return JsonResponse({'bookings': [_booking_to_dict(b) for b in bookings]})


@require_http_methods(['GET'])
def list_bookings(request):
    if not request.user.is_authenticated:
        return _unauthorized()

    profile = getattr(request.user, 'profile', None)
    if not profile or profile.role not in (UserRole.WORKER, UserRole.ADMIN):
        return _forbidden('Only workers and admins can view all bookings.')

    if profile.role == UserRole.WORKER:
        _, denied = require_approved_worker(request)
        if denied:
            return denied

    from .worker_views import _worker_bookings_queryset

    bookings = _worker_bookings_queryset(request.user)[:100]
    return JsonResponse({'bookings': [_booking_to_dict(b) for b in bookings]})


@csrf_exempt
@require_http_methods(['POST'])
@rate_limit('booking_create')
def create_booking(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    location = data.get('location', '').strip()
    service = data.get('service', '').strip()
    venue = data.get('venue', ServiceVenue.INDOOR).strip().lower()
    slot_id = data.get('slot_id')
    requested_date_raw = data.get('requested_date', '').strip()
    preferred_worker_id = data.get('preferred_worker_id')

    if not name or not phone:
        return JsonResponse(
            {'error': 'Name and phone are required.'},
            status=400,
        )

    if venue not in (ServiceVenue.INDOOR, ServiceVenue.OUTDOOR):
        return JsonResponse(
            {'error': 'Please choose indoor or outdoor service.'},
            status=400,
        )

    if venue == ServiceVenue.INDOOR:
        location = settings.SALON_LOCATION
    elif not location:
        return JsonResponse(
            {'error': 'Please enter your address for outdoor service.'},
            status=400,
        )

    if not slot_id:
        requested_date = parse_date(requested_date_raw)
        if not requested_date:
            return JsonResponse(
                {'error': 'Please choose an appointment date.'},
                status=400,
            )
        if requested_date < timezone.localdate():
            return JsonResponse(
                {'error': 'Cannot request an appointment in the past.'},
                status=400,
            )

        preferred_worker = None
        if preferred_worker_id not in (None, '', 'null'):
            try:
                preferred_worker = User.objects.get(
                    pk=int(preferred_worker_id),
                    profile__role__in=(UserRole.WORKER, UserRole.ADMIN),
                )
            except (User.DoesNotExist, TypeError, ValueError):
                return JsonResponse({'error': 'Invalid technician selected.'}, status=400)

        booking = Booking.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=name,
            phone=phone,
            location=location,
            service=service,
            venue=venue,
            requested_date=requested_date,
            preferred_worker=preferred_worker,
        )
        success_message = (
            'Request received. We will confirm your appointment time soon.'
        )
    else:
        try:
            from .slot_views import book_time_slot

            booking = Booking.objects.create(
                user=request.user if request.user.is_authenticated else None,
                name=name,
                phone=phone,
                location=location,
                service=service,
                venue=venue,
            )
            book_time_slot(slot_id, booking)
        except TimeSlot.DoesNotExist:
            return JsonResponse({'error': 'Time slot not found.'}, status=404)
        except ValueError as exc:
            if 'booking' in locals():
                booking.delete()
            return JsonResponse({'error': str(exc)}, status=400)
        success_message = 'Booking received successfully.'

    if request.user.is_authenticated and hasattr(request.user, 'profile') and venue == ServiceVenue.OUTDOOR:
        profile = request.user.profile
        profile.default_location = location
        profile.save(update_fields=['default_location'])

    try:
        notify_booking_created(booking)
    except Exception:
        logger.exception('Notification failed for booking #%s', booking.id)

    return JsonResponse(
        {
            'message': success_message,
            'id': booking.id,
        },
        status=201,
    )
