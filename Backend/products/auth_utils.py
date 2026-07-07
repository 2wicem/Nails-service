from .models import UserRole


def user_to_dict(user):
    profile = getattr(user, 'profile', None)
    role = profile.role if profile else UserRole.CLIENT

    return {
        'id': user.id,
        'name': user.first_name or user.username,
        'email': user.email,
        'phone': profile.phone if profile else '',
        'role': role,
        'default_location': profile.default_location if profile else '',
        'is_staff': user.is_staff,
    }


def role_label(role):
    return {
        UserRole.CLIENT: 'Client',
        UserRole.WORKER: 'Technician',
        UserRole.ADMIN: 'Admin',
    }.get(role, role)


SIGNUP_ACCOUNT_TYPES = {
    'client': UserRole.CLIENT,
    'technician': UserRole.WORKER,
    'worker': UserRole.WORKER,
}


def signup_role_from_account_type(account_type):
    """Map public signup account type to a role. Admin is never allowed."""
    if not account_type:
        return UserRole.CLIENT

    normalized = account_type.strip().lower()
    if normalized == UserRole.ADMIN:
        return None

    return SIGNUP_ACCOUNT_TYPES.get(normalized, UserRole.CLIENT)
