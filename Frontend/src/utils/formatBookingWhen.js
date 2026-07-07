export const formatBookingWhen = (booking) => {
  if (booking.slot) {
    const date = new Date(`${booking.slot.date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    return `${date} · ${booking.slot.label}`
  }

  if (booking.requested_date) {
    const date = new Date(`${booking.requested_date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const worker = booking.preferred_worker_name ? ` · ${booking.preferred_worker_name}` : ''
    return `${date} · Time to be confirmed${worker}`
  }

  return new Date(booking.created_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
