import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from products.models import Booking, SlotStatus, TimeSlot, UserProfile, UserRole
from products.slot_utils import SLOT_HOURS

User = get_user_model()

DEMO_SERVICES = [
    'Gel manicure',
    'Acrylic full set',
    'Pedicure',
    'Nail art',
    'Removal + refill',
    'Express manicure',
]

# Existing login accounts to use as salon staff
STAFF_SETUP = [
    {'username': 'mike', 'first_name': 'Mike', 'role': UserRole.ADMIN, 'phone': '0700000001'},
    {'username': 'sue', 'first_name': 'Sue', 'role': UserRole.WORKER, 'phone': '0700000002'},
    {'username': 'grace', 'first_name': 'Grace', 'role': UserRole.WORKER, 'phone': '0700000003'},
]

# Client names for booked slots (Nyambura stays a real client account too)
DEMO_CLIENTS = [
    {'name': 'Nyambura', 'phone': '0790123456', 'location': 'Westlands, Nairobi'},
    {'name': 'Mike', 'phone': '0790331108', 'location': 'Kilimani, Nairobi'},
    {'name': 'Grace W.', 'phone': '0711223344', 'location': 'Karen, Nairobi'},
    {'name': 'Amina K.', 'phone': '0722334455', 'location': 'Lavington, Nairobi'},
]


class Command(BaseCommand):
    help = 'Seed random 2-hour worker slots using existing login accounts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days ahead to seed (default: 7)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Remove existing time slots before seeding',
        )

    def handle(self, *args, **options):
        days = options['days']
        today = timezone.localdate()

        if options['clear']:
            deleted, _ = TimeSlot.objects.all().delete()
            self.stdout.write(f'Cleared {deleted} existing time slot(s).')

        workers = self._ensure_staff()
        if not workers:
            self.stderr.write(self.style.ERROR('No worker accounts found to seed.'))
            return

        created_slots = 0
        booked_slots = 0

        for day_offset in range(days):
            slot_date = today + timedelta(days=day_offset)

            for worker in workers:
                for start_hour in SLOT_HOURS:
                    roll = random.random()

                    if roll < 0.35:
                        status = SlotStatus.AVAILABLE
                        booking = None
                    elif roll < 0.55:
                        status = SlotStatus.BOOKED
                        client = random.choice(DEMO_CLIENTS)
                        booking = Booking.objects.create(
                            name=client['name'],
                            phone=client['phone'],
                            location=client['location'],
                            service=random.choice(DEMO_SERVICES),
                        )
                        booked_slots += 1
                    else:
                        status = SlotStatus.UNAVAILABLE
                        booking = None

                    slot, created = TimeSlot.objects.update_or_create(
                        worker=worker,
                        date=slot_date,
                        start_hour=start_hour,
                        defaults={'status': status, 'booking': booking},
                    )
                    if created:
                        created_slots += 1

        worker_names = ', '.join(w.first_name or w.username for w in workers)
        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded schedule for {worker_names}: '
                f'{created_slots} new slot(s), {booked_slots} booked demo appointment(s) '
                f'over the next {days} day(s).'
            )
        )

    def _ensure_staff(self):
        workers = []

        for entry in STAFF_SETUP:
            user = User.objects.filter(username=entry['username']).first()
            if not user:
                user = User.objects.create_user(
                    username=entry['username'],
                    email=f"{entry['username']}@dopekit.local",
                    password='dopekit123',
                    first_name=entry['first_name'],
                )
                self.stdout.write(
                    self.style.WARNING(
                        f"Created staff account {entry['username']} (temp password: dopekit123)"
                    )
                )

            if entry['first_name'] and not user.first_name:
                user.first_name = entry['first_name']
                user.save(update_fields=['first_name'])

            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'phone': entry['phone'], 'role': entry['role']},
            )

            updated = False
            if profile.role != entry['role']:
                profile.role = entry['role']
                updated = True
            if not profile.phone:
                profile.phone = entry['phone']
                updated = True
            if updated:
                profile.save()

            if entry['role'] == UserRole.ADMIN:
                if not user.is_staff:
                    user.is_staff = True
                    user.save(update_fields=['is_staff'])

            workers.append(user)
            self.stdout.write(f"Using staff: {user.first_name or user.username} ({profile.role})")

        return workers
