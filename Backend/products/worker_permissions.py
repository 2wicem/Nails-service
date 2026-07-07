from .http_responses import forbidden, unauthorized
from .models import TechnicianApprovalStatus, UserRole
from .technician_utils import is_approved_technician


def require_approved_worker(request):
    if not request.user.is_authenticated:
        return None, unauthorized()

    profile = getattr(request.user, 'profile', None)
    if not profile or profile.role not in (UserRole.WORKER, UserRole.ADMIN):
        return None, forbidden('Only approved technicians can access this area.')

    if profile.role == UserRole.WORKER and not is_approved_technician(profile):
        if profile.technician_approval == TechnicianApprovalStatus.PENDING:
            return None, forbidden(
                'Your technician application is pending admin approval.'
            )
        if profile.technician_approval == TechnicianApprovalStatus.REJECTED:
            return None, forbidden('Your technician application was not approved.')
        return None, forbidden('Technician access is not enabled for this account.')

    return request.user, None
