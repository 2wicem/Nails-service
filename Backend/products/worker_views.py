import json
import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Q, Value
from django.db.models.functions import Coalesce
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Booking, BookingStatus, SlotStatus, TimeSlot, UserRole
from .slot_utils import SLOT_HOURS, format_slot_label
from .slot_views import _parse_date
from .technician_utils import is_approved_technician
from .views import _booking_to_dict, _forbidden
from .worker_permissions import require_approved_worker

User = get_user_model()
logger = logging.getLogger(__name__)


def _worker_bookings_queryset(user):
    queryset = (
        Booking.objects.exclude(status=BookingStatus.CANCELLED)
        .select_related('time_slot__worker', 'preferred_worker')
        .annotate(
            sort_date=Coalesce('time_slot__date', 'requested_date'),
            sort_hour=Coalesce('time_slot__start_hour', Value(99)),
        )
    )

    profile = getattr(user, 'profile', None)
    if profile and profile.role == UserRole.WORKER:
        queryset = queryset.filter(
            Q(time_slot__worker=user)
            | Q(time_slot__isnull=True, preferred_worker=user)
            | Q(time_slot__isnull=True, preferred_worker__isnull=True)
        )

    return queryset.order_by(
        F('sort_date').asc(nulls_last=True),
        F('sort_hour').asc(nulls_last=True),
        '-created_at',
    )


def _worker_role_label(role):
    if role == UserRole.ADMIN:
        return 'Lead stylist'
    return 'Nail technician'


@require_http_methods(['GET'])
def list_public_workers(request):
    today = timezone.localdate()
    horizon = today + timedelta(days=14)

    staff = (
        User.objects.filter(profile__role__in=(UserRole.WORKER, UserRole.ADMIN))
        .select_related('profile')
        .order_by('first_name', 'username')
    )

    workers = []
    for user in staff:
        profile = user.profile
        if profile.role == UserRole.WORKER and not is_approved_technician(profile):
            continue
        available_qs = TimeSlot.objects.filter(
            worker=user,
            date__gte=today,
            date__lte=horizon,
            status=SlotStatus.AVAILABLE,
        )
        available_count = available_qs.count()
        next_slot = available_qs.order_by('date', 'start_hour').first()

        workers.append(
            {
                'id': user.id,
                'name': user.first_name or user.username.capitalize(),
                'role': user.profile.role,
                'role_label': _worker_role_label(user.profile.role),
                'available_slots': available_count,
                'is_available': available_count > 0,
                'next_slot': (
                    {
                        'date': next_slot.date.isoformat(),
                        'label': format_slot_label(next_slot.start_hour),
                    }
                    if next_slot
                    else None
                ),
            }
        )

    workers.sort(
        key=lambda item: (
            -int(item['is_available']),
            -item['available_slots'],
            item['name'].lower(),
        )
    )

    return JsonResponse({'workers': workers})


@require_http_methods(['GET'])
def worker_bookings(request):
    worker, denied = require_approved_worker(request)
    if denied:
        return denied

    bookings = _worker_bookings_queryset(request.user)[:100]
    pending_count = sum(1 for booking in bookings if booking.status == BookingStatus.PENDING)

    return JsonResponse(
        {
            'bookings': [_booking_to_dict(booking) for booking in bookings],
            'pending_count': pending_count,
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def accept_booking(request, booking_id):
    worker, denied = require_approved_worker(request)
    if denied:
        return denied

    booking = get_object_or_404(
        Booking.objects.select_related('time_slot'),
        pk=booking_id,
    )
    slot = getattr(booking, 'time_slot', None)

    if not slot:
        return JsonResponse({'error': 'Booking has no time slot.'}, status=400)

    profile = getattr(worker, 'profile', None)
    if profile.role == UserRole.WORKER and slot.worker_id != worker.id:
        return _forbidden('You can only accept your own appointments.')

    if booking.status == BookingStatus.ACCEPTED:
        return JsonResponse({'message': 'Already accepted.', 'booking': _booking_to_dict(booking)})

    if booking.status == BookingStatus.CANCELLED:
        return JsonResponse({'error': 'This booking was cancelled.'}, status=400)

    booking.status = BookingStatus.ACCEPTED
    booking.save(update_fields=['status'])

    return JsonResponse(
        {
            'message': 'Booking accepted.',
            'booking': _booking_to_dict(booking),
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def cancel_booking_worker(request, booking_id):
    worker, denied = require_approved_worker(request)
    if denied:
        return denied

    booking = get_object_or_404(
        Booking.objects.select_related('time_slot'),
        pk=booking_id,
    )
    slot = getattr(booking, 'time_slot', None)

    if slot:
        profile = getattr(worker, 'profile', None)
        if profile.role == UserRole.WORKER and slot.worker_id != worker.id:
            return _forbidden('You can only cancel your own appointments.')

    if booking.status == BookingStatus.CANCELLED:
        return JsonResponse({'message': 'Already cancelled.', 'booking': _booking_to_dict(booking)})

    with transaction.atomic():
        booking.status = BookingStatus.CANCELLED
        booking.save(update_fields=['status'])
        if slot:
            TimeSlot.objects.filter(pk=slot.pk).update(
                status=SlotStatus.AVAILABLE,
                booking=None,
            )

    return JsonResponse(
        {
            'message': 'Booking cancelled.',
            'booking': _booking_to_dict(booking),
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def off_day(request):
    worker, denied = require_approved_worker(request)
    if denied:
        return denied

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    slot_date = _parse_date(data.get('date'))
    if not slot_date:
        return JsonResponse({'error': 'A valid date is required (YYYY-MM-DD).'}, status=400)

    if slot_date < timezone.localdate():
        return JsonResponse({'error': 'Cannot mark a past day as off.'}, status=400)

    blocked = 0
    marked_off = 0

    with transaction.atomic():
        for start_hour in SLOT_HOURS:
            slot, _ = TimeSlot.objects.get_or_create(
                worker=worker,
                date=slot_date,
                start_hour=start_hour,
                defaults={'status': SlotStatus.UNAVAILABLE},
            )

            if slot.status == SlotStatus.BOOKED and slot.booking_id:
                blocked += 1
                continue

            slot.status = SlotStatus.UNAVAILABLE
            slot.booking = None
            slot.save(update_fields=['status', 'booking'])
            marked_off += 1

    message = f'Marked {marked_off} slot(s) off for {slot_date.isoformat()}.'
    if blocked:
        message += f' {blocked} booked slot(s) kept as-is.'

    return JsonResponse(
        {
            'message': message,
            'marked_off': marked_off,
            'blocked': blocked,
        }
    )
