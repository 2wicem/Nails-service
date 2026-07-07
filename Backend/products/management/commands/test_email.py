import smtplib

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Send a test email to verify Gmail SMTP settings'

    def handle(self, *args, **options):
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            self.stderr.write(
                self.style.ERROR(
                    'Add EMAIL_HOST_PASSWORD to Backend/.env first '
                    '(Gmail App Password, not your normal password).'
                )
            )
            return

        recipient = settings.BOOKING_NOTIFY_EMAIL
        try:
            send_mail(
                subject='Dopekit — test booking alert',
                message=(
                    'This is a test email from your Dopekit booking app.\n\n'
                    'If you see this, Gmail notifications are set up correctly.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
        except smtplib.SMTPAuthenticationError:
            self.stderr.write(
                self.style.ERROR(
                    'Gmail rejected the login (535 BadCredentials).\n\n'
                    'Fix:\n'
                    '  1. Use an App Password — NOT your normal Gmail password\n'
                    '  2. Enable 2-Step Verification first:\n'
                    '     https://myaccount.google.com/signinoptions/two-step-verification\n'
                    '  3. Create App Password:\n'
                    '     https://myaccount.google.com/apppasswords\n'
                    '  4. Paste the 16-character password in Backend/.env as EMAIL_HOST_PASSWORD\n'
                    '     (spaces are OK — they are stripped automatically)\n'
                    '  5. EMAIL_HOST_USER must match the Gmail account that owns the app password'
                )
            )
            return

        self.stdout.write(self.style.SUCCESS(f'Test email sent to {recipient}'))
