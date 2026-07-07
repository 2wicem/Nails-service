from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('products', '0008_contactmessage_contact_fields_saloncontactinfo'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='requested_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='preferred_worker',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='preferred_bookings',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
