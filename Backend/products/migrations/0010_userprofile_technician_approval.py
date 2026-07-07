from django.db import migrations, models


def approve_existing_workers(apps, schema_editor):
    UserProfile = apps.get_model('products', 'UserProfile')
    UserProfile.objects.filter(role='worker').update(technician_approval='approved')
    UserProfile.objects.filter(role='admin').update(technician_approval='na')


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0009_booking_requested_date_preferred_worker'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='technician_approval',
            field=models.CharField(
                choices=[
                    ('na', 'Not applicable'),
                    ('pending', 'Pending approval'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                ],
                default='na',
                max_length=10,
            ),
        ),
        migrations.RunPython(approve_existing_workers, migrations.RunPython.noop),
    ]
