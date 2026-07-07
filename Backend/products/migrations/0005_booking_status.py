from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_timeslot'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('accepted', 'Accepted'),
                    ('cancelled', 'Cancelled'),
                ],
                default='accepted',
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='booking',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('accepted', 'Accepted'),
                    ('cancelled', 'Cancelled'),
                ],
                default='pending',
                max_length=10,
            ),
        ),
    ]
