from django.db import migrations, models


def seed_salon_contact_info(apps, schema_editor):
    SalonContactInfo = apps.get_model('products', 'SalonContactInfo')
    SalonContactInfo.objects.get_or_create(
        pk=1,
        defaults={
            'phone_primary': '0790331108',
            'phone_secondary': '0727083181',
            'email': 'dopekit@gmail.com',
            'location': 'Wangige Mall',
            'services_summary': 'Indoor and outdoor manicure & pedicure',
            'page_lead': (
                'Have a question or want to book an appointment? '
                'Reach out — we would love to hear from you.'
            ),
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_contactmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactmessage',
            name='email',
            field=models.EmailField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='contactmessage',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.CreateModel(
            name='SalonContactInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone_primary', models.CharField(default='0790331108', max_length=20)),
                ('phone_secondary', models.CharField(blank=True, default='0727083181', max_length=20)),
                ('email', models.EmailField(default='dopekit@gmail.com', max_length=254)),
                ('location', models.CharField(default='Wangige Mall', max_length=200)),
                (
                    'services_summary',
                    models.CharField(
                        default='Indoor and outdoor manicure & pedicure',
                        max_length=300,
                    ),
                ),
                (
                    'page_lead',
                    models.TextField(
                        blank=True,
                        default=(
                            'Have a question or want to book an appointment? '
                            'Reach out — we would love to hear from you.'
                        ),
                    ),
                ),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Salon contact info',
                'verbose_name_plural': 'Salon contact info',
            },
        ),
        migrations.RunPython(seed_salon_contact_info, migrations.RunPython.noop),
    ]
