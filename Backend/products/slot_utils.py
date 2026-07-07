SLOT_HOURS = [8, 10, 12, 14, 16, 18]
SLOT_DURATION_HOURS = 2


def parse_date(value):
    from datetime import date

    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def format_slot_label(start_hour):
    end_hour = start_hour + SLOT_DURATION_HOURS

    def fmt(hour):
        suffix = 'AM' if hour < 12 else 'PM'
        display = hour % 12
        if display == 0:
            display = 12
        return f'{display}:00 {suffix}'

    return f'{fmt(start_hour)} – {fmt(end_hour)}'
