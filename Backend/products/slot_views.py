import json

from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import SlotStatus, TimeSlot, UserRole
from .slot_utils import SLOT_HOURS, format_slot_label, parse_date
from .views import _booking_to_dict, _forbidden, _unauthorized
from .worker_permissions import require_approved_worker

User = get_user_model()


def _parse_date(value):
    return parse_date(value)


def _require_worker(request):
    return require_approved_worker(request)


def _slot_to_dict(slot):
    return {
        'id': slot.id,
        'date': slot.date.isoformat(),
        'start_hour': slot.start_hour,
        'end_hour': slot.start_hour + 2,
        'label': format_slot_label(slot.start_hour),
        'status': slot.status,
        'worker_id': slot.worker_id,
        'worker_name': slot.worker.first_name or slot.worker.username,
        'booking': _booking_to_dict(slot.booking) if slot.booking else None,
    }


def _virtual_slot(worker, slot_date, start_hour, status=SlotStatus.UNAVAILABLE):
    return {
        'id': None,
        'date': slot_date.isoformat(),
        'start_hour': start_hour,
        'end_hour': start_hour + 2,
        'label': format_slot_label(start_hour),
        'status': status,
        'worker_id': worker.id,
        'worker_name': worker.first_name or worker.username,
        'booking': None,
    }


def _merge_day_slots(worker, slot_date, existing_slots):
    by_hour = {slot.start_hour: slot for slot in existing_slots}
    merged = []
    for hour in SLOT_HOURS:
        if hour in by_hour:
            merged.append(_slot_to_dict(by_hour[hour]))
        else:
            merged.append(_virtual_slot(worker, slot_date, hour))
    return merged


@require_http_methods(['GET'])
def list_available_slots(request):
    slot_date = _parse_date(request.GET.get('date'))
    if not slot_date:
        return JsonResponse({'error': 'A valid date is required (YYYY-MM-DD).'}, status=400)

    if slot_date < timezone.localdate():
        return JsonResponse({'slots': []})

    slots = (
        TimeSlot.objects.filter(date=slot_date, status=SlotStatus.AVAILABLE)
        .select_related('worker')
        .order_by('start_hour', 'worker__first_name')
    )

    worker_id = request.GET.get('worker_id', '').strip()
    if worker_id:
        try:
            slots = slots.filter(worker_id=int(worker_id))
        except (TypeError, ValueError):
            return JsonResponse({'error': 'Invalid worker_id.'}, status=400)

    return JsonResponse(
        {
            'date': slot_date.isoformat(),
            'slots': [_slot_to_dict(slot) for slot in slots],
        }
    )


@require_http_methods(['GET'])
def manage_slots(request):
    worker, denied = _require_worker(request)
    if denied:
        return denied

    slot_date = _parse_date(request.GET.get('date'))
    if not slot_date:
        return JsonResponse({'error': 'A valid date is required (YYYY-MM-DD).'}, status=400)

    existing = TimeSlot.objects.filter(worker=worker, date=slot_date).select_related('booking')
    return JsonResponse(
        {
            'date': slot_date.isoformat(),
            'slots': _merge_day_slots(worker, slot_date, existing),
        }
    )


@csrf_exempt
@require_http_methods(['POST'])
def toggle_slot(request):
    worker, denied = _require_worker(request)
    if denied:
        return denied

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    slot_date = _parse_date(data.get('date'))
    start_hour = data.get('start_hour')
    status = data.get('status', '').strip().lower()

    if not slot_date or start_hour is None:
        return JsonResponse({'error': 'date and start_hour are required.'}, status=400)

    if start_hour not in SLOT_HOURS:
        return JsonResponse({'error': 'Invalid start_hour.'}, status=400)

    if status not in (SlotStatus.AVAILABLE, SlotStatus.UNAVAILABLE):
        return JsonResponse({'error': 'status must be available or unavailable.'}, status=400)

    if slot_date < timezone.localdate():
        return JsonResponse({'error': 'Cannot change slots in the past.'}, status=400)

    slot, _ = TimeSlot.objects.get_or_create(
        worker=worker,
        date=slot_date,
        start_hour=start_hour,
        defaults={'status': SlotStatus.UNAVAILABLE},
    )

    if slot.status == SlotStatus.BOOKED:
        return JsonResponse({'error': 'This slot is already booked.'}, status=400)

    slot.status = status
    slot.save(update_fields=['status'])

    return JsonResponse(
        {
            'message': 'Time slot updated.',
            'slot': _slot_to_dict(slot),
        }
    )


def book_time_slot(slot_id, booking):
    with transaction.atomic():
        slot = TimeSlot.objects.select_for_update().get(pk=slot_id)
        if slot.status != SlotStatus.AVAILABLE:
            raise ValueError('That time slot is no longer available.')
        if slot.date < timezone.localdate():
            raise ValueError('Cannot book a past time slot.')

        slot.status = SlotStatus.BOOKED
        slot.booking = booking
        slot.save(update_fields=['status', 'booking'])
        return slot
