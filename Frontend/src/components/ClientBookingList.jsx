/* eslint-disable react/prop-types */
import { venueLabel } from '../constants/serviceVenue'
import { formatBookingWhen } from '../utils/formatBookingWhen'
import './css/Dashboard.css'

const ClientBookingList = ({ bookings }) => {
  if (bookings.length === 0) {
    return <p className="text-center text-muted dashboard-empty">No bookings yet.</p>
  }

  return (
    <div className="client-booking-list">
      {bookings.map((booking) => (
        <article key={booking.id} className="client-booking-card">
          <div className="client-booking-card-top">
            <h3 className="client-booking-service">{booking.service || 'Service not specified'}</h3>
            <span className="client-booking-when">{formatBookingWhen(booking)}</span>
          </div>
          <p className="client-booking-location">
            <span className={`booking-venue-pill booking-venue-pill--${booking.venue || 'indoor'}`}>
              {booking.venue_label || venueLabel(booking.venue)}
            </span>
            {booking.location}
          </p>
          {booking.slot?.worker_name && (
            <p className="client-booking-worker">With {booking.slot.worker_name}</p>
          )}
          {!booking.slot?.worker_name && booking.preferred_worker_name && (
            <p className="client-booking-worker">Preferred: {booking.preferred_worker_name}</p>
          )}
          <p className="client-booking-meta">
            {booking.status === 'pending' && (
              <span className="client-booking-status client-booking-status--pending">Awaiting confirmation · </span>
            )}
            {booking.status === 'accepted' && (
              <span className="client-booking-status client-booking-status--accepted">Confirmed · </span>
            )}
            Requested {new Date(booking.created_at).toLocaleString()}
          </p>
        </article>
      ))}
    </div>
  )
}

export default ClientBookingList
