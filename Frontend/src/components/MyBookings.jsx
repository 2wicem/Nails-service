import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClientBookingList from './ClientBookingList'
import './css/Dashboard.css'

const MY_BOOKINGS_URL = '/api/products/bookings/mine/'

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await fetch(MY_BOOKINGS_URL, { credentials: 'include' })
        const text = await response.text()
        const data = text ? JSON.parse(text) : {}

        if (!response.ok) {
          throw new Error(data.error || 'Could not load your bookings.')
        }

        setBookings(data.bookings || [])
      } catch (error) {
        setStatus({ type: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [])

  return (
    <section className="section-band section-band--base dashboard-page my-bookings-page">
      <div className="container page-section my-bookings-section">
        <div className="text-center mb-4">
          <h1>My bookings</h1>
          <p className="text-muted mb-0">Your past and upcoming appointment requests with Dopekit.</p>
        </div>

        {status && (
          <div className={`alert alert-${status.type === 'error' ? 'danger' : 'success'} mb-4`}>
            {status.message}
          </div>
        )}

        <div className="dashboard-actions d-flex flex-wrap justify-content-center gap-2 mb-4">
          <Link to="/Services" className="btn btn-primary">
            Book another service
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-muted">Loading your bookings...</p>
        ) : (
          <ClientBookingList bookings={bookings} />
        )}
      </div>
    </section>
  )
}

export default MyBookings
