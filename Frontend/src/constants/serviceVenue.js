export const SALON_LOCATION = 'Dopekit Studio, Kikuyu Town'

export const SERVICE_VENUES = [
  {
    value: 'indoor',
    label: 'Indoor',
    hint: 'Visit us at the salon',
    icon: 'fa-solid fa-store',
  },
  {
    value: 'outdoor',
    label: 'Outdoor',
    hint: 'Mobile service at your location',
    icon: 'fa-solid fa-house-chimney',
  },
]

export const venueLabel = (venue) =>
  SERVICE_VENUES.find((item) => item.value === venue)?.label || venue

export const venueLocationLabel = (venue) =>
  venue === 'outdoor' ? 'Your address' : 'Salon location'

export const venueLocationPlaceholder = (venue) =>
  venue === 'outdoor'
    ? 'E.g. Westlands, Nairobi — building & apartment'
    : ''

export const resolveBookingLocation = (venue, clientLocation = '') =>
  venue === 'indoor' ? SALON_LOCATION : clientLocation.trim()
