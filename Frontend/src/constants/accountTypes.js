export const ACCOUNT_TYPES = {
  client: {
    value: 'client',
    label: 'Client',
    shortLabel: 'Book appointments',
    signupTitle: 'Create your account',
    signupSubtitle: 'Sign up to book faster and save your details for next time.',
    submitLabel: 'Sign up as client',
  },
  technician: {
    value: 'technician',
    label: 'Technician',
    shortLabel: 'Salon team',
    signupTitle: 'Join the salon team',
    signupSubtitle: 'Create a technician account to manage your schedule and client bookings.',
    submitLabel: 'Join as technician',
  },
}

export const parseSignupAccountType = (value) =>
  value === 'technician' ? 'technician' : 'client'
