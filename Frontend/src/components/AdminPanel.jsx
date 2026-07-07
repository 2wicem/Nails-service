import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLE_LABELS } from '../constants/roles'
import { useAuth } from '../context/useAuth'
import { apiFetch } from '../config/api'
import BookingsTable, { RoleBadge } from './BookingsTable'
import './css/Dashboard.css'

const STATS_PATH = '/products/admin/stats/'
const USERS_PATH = '/products/admin/users/'
const BOOKINGS_PATH = '/products/bookings/list/'
const MESSAGES_PATH = '/products/admin/messages/'
const PENDING_TECHNICIANS_PATH = '/products/admin/technicians/pending/'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'messages', label: 'Messages' },
  { id: 'technicians', label: 'Technicians' },
  { id: 'users', label: 'Users' },
]

const AdminPanel = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [messages, setMessages] = useState([])
  const [pendingTechnicians, setPendingTechnicians] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [reviewingUserId, setReviewingUserId] = useState(null)
  const [deletingBookingId, setDeletingBookingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setStatus(null)

    try {
      const [statsRes, usersRes, bookingsRes, messagesRes, pendingRes] = await Promise.all([
        apiFetch(STATS_PATH),
        apiFetch(USERS_PATH),
        apiFetch(BOOKINGS_PATH),
        apiFetch(MESSAGES_PATH),
        apiFetch(PENDING_TECHNICIANS_PATH),
      ])

      const parse = async (response) => {
        const text = await response.text()
        const data = text ? JSON.parse(text) : {}
        if (!response.ok) {
          throw new Error(data.error || 'Request failed.')
        }
        return data
      }

      const [statsData, usersData, bookingsData, messagesData, pendingData] = await Promise.all([
        parse(statsRes),
        parse(usersRes),
        parse(bookingsRes),
        parse(messagesRes),
        parse(pendingRes),
      ])

      setStats(statsData)
      setUsers(usersData.users || [])
      setBookings(bookingsData.bookings || [])
      setMessages(messagesData.messages || [])
      setPendingTechnicians(pendingData.technicians || [])
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRoleChange = async (userId, role) => {
    setUpdatingUserId(userId)
    setStatus(null)

    try {
      const response = await apiFetch(`/products/admin/users/${userId}/role/`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not update role.')
      }

      setUsers((current) =>
        current.map((entry) => (entry.id === userId ? data.user : entry))
      )
      setStatus({ type: 'success', message: data.message })
      const statsRes = await apiFetch(STATS_PATH)
      const statsText = await statsRes.text()
      if (statsRes.ok && statsText) {
        setStats(JSON.parse(statsText))
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleTechnicianReview = async (userId, action) => {
    setReviewingUserId(userId)
    setStatus(null)

    try {
      const response = await apiFetch(`/products/admin/technicians/${userId}/${action}/`, {
        method: 'POST',
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not update application.')
      }

      setPendingTechnicians((current) => current.filter((entry) => entry.id !== userId))
      setUsers((current) => {
        const exists = current.some((entry) => entry.id === userId)
        if (!exists) {
          return [data.user, ...current]
        }
        return current.map((entry) => (entry.id === userId ? data.user : entry))
      })
      setStatus({ type: 'success', message: data.message })

      const statsRes = await apiFetch(STATS_PATH)
      const statsText = await statsRes.text()
      if (statsRes.ok && statsText) {
        setStats(JSON.parse(statsText))
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setReviewingUserId(null)
    }
  }

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Delete this booking permanently?')) {
      return
    }

    setDeletingBookingId(bookingId)
    setStatus(null)

    try {
      const response = await apiFetch(`/products/admin/bookings/${bookingId}/`, {
        method: 'DELETE',
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not delete booking.')
      }

      setBookings((current) => current.filter((booking) => booking.id !== bookingId))
      setStats((current) =>
        current ? { ...current, total_bookings: Math.max(0, current.total_bookings - 1) } : current
      )
      setStatus({ type: 'success', message: data.message })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setDeletingBookingId(null)
    }
  }

  return (
    <section className="section-band section-band--alt dashboard-page">
      <div className="container page-section">
        <div className="text-center mb-4">
          <h1>Admin panel</h1>
          <p className="text-muted mb-0">
            Manage bookings, users, and roles for Dopekit — signed in as {user?.name}.
          </p>
        </div>

        {status && (
          <div className={`alert alert-${status.type === 'error' ? 'danger' : 'success'} mb-4`}>
            {status.message}
          </div>
        )}

        <div className="dashboard-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dashboard-tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="dashboard-actions d-flex flex-wrap justify-content-center gap-2 mb-4">
          <Link to="/worker" className="btn btn-outline-secondary">
            Staff dashboard
          </Link>
          <Link to="/Services" className="btn btn-primary">
            View services
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-muted">Loading admin data...</p>
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div className="dashboard-stats mb-4">
                <div className="dashboard-stat-card">
                  <span className="dashboard-stat-value">{stats.total_bookings}</span>
                  <span className="dashboard-stat-label">Bookings</span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="dashboard-stat-value">{stats.total_messages ?? 0}</span>
                  <span className="dashboard-stat-label">Contact notes</span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="dashboard-stat-value">{stats.total_users}</span>
                  <span className="dashboard-stat-label">Users</span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="dashboard-stat-value">{stats.clients}</span>
                  <span className="dashboard-stat-label">{ROLE_LABELS.client}s</span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="dashboard-stat-value">{stats.workers}</span>
                  <span className="dashboard-stat-label">{ROLE_LABELS.worker}s</span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="dashboard-stat-value">{stats.pending_technicians ?? 0}</span>
                  <span className="dashboard-stat-label">Pending technicians</span>
                </div>
                <div className="dashboard-stat-card">
                  <span className="dashboard-stat-value">{stats.admins}</span>
                  <span className="dashboard-stat-label">{ROLE_LABELS.admin}s</span>
                </div>
              </div>
            )}

            {activeTab === 'technicians' && (
              <div className="dashboard-table-wrap table-responsive">
                {pendingTechnicians.length === 0 ? (
                  <p className="text-center text-muted dashboard-empty">
                    No pending technician applications.
                  </p>
                ) : (
                  <table className="table dashboard-table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Applied</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTechnicians.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.name}</td>
                          <td>{entry.email}</td>
                          <td>{entry.phone || '—'}</td>
                          <td>{new Date(entry.date_joined).toLocaleDateString()}</td>
                          <td className="text-nowrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-success me-2"
                              disabled={reviewingUserId === entry.id}
                              onClick={() => handleTechnicianReview(entry.id, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={reviewingUserId === entry.id}
                              onClick={() => handleTechnicianReview(entry.id, 'reject')}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <BookingsTable
                bookings={bookings}
                showDelete
                onDelete={handleDeleteBooking}
                deletingId={deletingBookingId}
              />
            )}

            {activeTab === 'messages' && (
              <div className="dashboard-table-wrap table-responsive">
                {messages.length === 0 ? (
                  <p className="text-center text-muted dashboard-empty">No contact notes yet.</p>
                ) : (
                  <table className="table dashboard-table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Message</th>
                        <th>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.name || 'Anonymous'}</td>
                          <td>{entry.phone || '—'}</td>
                          <td>{entry.email || entry.user?.email || '—'}</td>
                          <td className="dashboard-message-cell">{entry.message}</td>
                          <td>{new Date(entry.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="dashboard-table-wrap table-responsive">
                {users.length === 0 ? (
                  <p className="text-center text-muted dashboard-empty">No users yet.</p>
                ) : (
                  <table className="table dashboard-table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.name}</td>
                          <td>{entry.email}</td>
                          <td>{entry.phone || '—'}</td>
                          <td>
                            {entry.id === user?.id ? (
                              <RoleBadge role={entry.role} />
                            ) : (
                              <select
                                className="form-select form-select-sm dashboard-role-select"
                                value={entry.role}
                                disabled={updatingUserId === entry.id}
                                onChange={(e) => handleRoleChange(entry.id, e.target.value)}
                              >
                                <option value="client">{ROLE_LABELS.client}</option>
                                <option value="worker">{ROLE_LABELS.worker}</option>
                                <option value="admin">{ROLE_LABELS.admin}</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {entry.technician_approval === 'pending'
                              ? 'Pending approval'
                              : entry.technician_approval === 'rejected'
                                ? 'Rejected'
                                : entry.technician_approval === 'approved' &&
                                    entry.role === 'worker'
                                  ? 'Approved'
                                  : '—'}
                          </td>
                          <td>{new Date(entry.date_joined).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        <p className="text-muted text-center mt-4 mb-0 dashboard-note">
          Promote clients to workers or admins from the Users tab.
        </p>
      </div>
    </section>
  )
}

export default AdminPanel
