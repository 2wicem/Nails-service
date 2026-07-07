/* eslint-disable react/prop-types */
import { ROLE_LABELS } from '../constants/roles'
import { venueLabel } from '../constants/serviceVenue'
import './css/Dashboard.css'

const formatDate = (value) => new Date(value).toLocaleString()

const BookingsTable = ({ bookings, showDelete = false, onDelete = null, deletingId = null }) => {
  if (bookings.length === 0) {
    return <p className="text-center text-muted dashboard-empty">No bookings yet.</p>
  }

  return (
    <div className="dashboard-table-wrap table-responsive">
      <table className="table dashboard-table table-hover mb-0">
        <thead>
          <tr>
            <th>Client</th>
            <th>Phone</th>
            <th>Service</th>
            <th>Type</th>
            <th>Location</th>
            <th>Appointment</th>
            <th>Booked</th>
            {showDelete && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.name}</td>
              <td>{booking.phone}</td>
              <td>{booking.service || '—'}</td>
              <td>
                <span className={`booking-venue-pill booking-venue-pill--${booking.venue || 'indoor'}`}>
                  {booking.venue_label || venueLabel(booking.venue)}
                </span>
              </td>
              <td>{booking.location}</td>
              <td>
                {booking.slot ? (
                  <>
                    {new Date(`${booking.slot.date}T12:00:00`).toLocaleDateString()}
                    <br />
                    <span className="dashboard-slot-label">{booking.slot.label}</span>
                    {booking.slot.worker_name && (
                      <>
                        <br />
                        <span className="text-muted">{booking.slot.worker_name}</span>
                      </>
                    )}
                  </>
                ) : booking.requested_date ? (
                  <>
                    {new Date(`${booking.requested_date}T12:00:00`).toLocaleDateString()}
                    <br />
                    <span className="dashboard-slot-label">Time TBC</span>
                    {booking.preferred_worker_name && (
                      <>
                        <br />
                        <span className="text-muted">{booking.preferred_worker_name}</span>
                      </>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td>{formatDate(booking.created_at)}</td>
              {showDelete && (
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger dashboard-delete-btn"
                    onClick={() => onDelete?.(booking.id)}
                    disabled={deletingId === booking.id}
                  >
                    {deletingId === booking.id ? 'Removing...' : 'Delete'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const RoleBadge = ({ role }) => (
  <span className={`dashboard-role-pill dashboard-role-pill--${role}`}>
    {ROLE_LABELS[role] || role}
  </span>
)

export default BookingsTable
