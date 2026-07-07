from .models import TechnicianApprovalStatus, UserRole


def is_approved_technician(profile) -> bool:
    if not profile:
        return False
    if profile.role == UserRole.ADMIN:
        return True
    if profile.role != UserRole.WORKER:
        return False
    return profile.technician_approval == TechnicianApprovalStatus.APPROVED


def technician_is_pending(profile) -> bool:
    return bool(
        profile
        and profile.technician_approval == TechnicianApprovalStatus.PENDING
    )


def auto_approve_technician(profile) -> None:
    profile.role = UserRole.WORKER
    profile.technician_approval = TechnicianApprovalStatus.APPROVED
    profile.save(update_fields=['role', 'technician_approval'])


def reject_technician(profile) -> None:
    profile.role = UserRole.CLIENT
    profile.technician_approval = TechnicianApprovalStatus.REJECTED
    profile.save(update_fields=['role', 'technician_approval'])
