from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_booking_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='venue',
            field=models.CharField(
                choices=[
                    ('indoor', 'Indoor (at salon)'),
                    ('outdoor', 'Outdoor (we come to you)'),
                ],
                default='indoor',
                max_length=10,
            ),
        ),
    ]
