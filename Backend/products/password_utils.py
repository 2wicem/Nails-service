import re

PASSWORD_MIN_LENGTH = 8
PASSWORD_HINT = 'At least 8 characters with letters and numbers.'


def password_strength_error(password: str) -> str | None:
    if len(password) < PASSWORD_MIN_LENGTH:
        return f'Password must be at least {PASSWORD_MIN_LENGTH} characters.'
    if not re.search(r'[A-Za-z]', password):
        return 'Password must include at least one letter.'
    if not re.search(r'\d', password):
        return 'Password must include at least one number.'
    return None
