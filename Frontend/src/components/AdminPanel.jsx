import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLE_LABELS } from '../constants/roles'
import { useAuth } from '../context/useAuth'
import BookingsTable, { RoleBadge } from './BookingsTable'
import './css/Dashboard.css'

const STATS_URL = '/api/products/admin/stats/'
const USERS_URL = '/api/products/admin/users/'
const BOOKINGS_URL = '/api/products/bookings/list/'
const MESSAGES_URL = '/api/products/admin/messages/'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'messages', label: 'Messages' },
  { id: 'users', label: 'Users' },
]

const AdminPanel = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [deletingBookingId, setDeletingBookingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setStatus(null)

    try {
      const [statsRes, usersRes, bookingsRes, messagesRes] = await Promise.all([
        fetch(STATS_URL, { credentials: 'include' }),
        fetch(USERS_URL, { credentials: 'include' }),
        fetch(BOOKINGS_URL, { credentials: 'include' }),
        fetch(MESSAGES_URL, { credentials: 'include' }),
      ])

      const parse = async (response) => {
        const text = await response.text()
        const data = text ? JSON.parse(text) : {}
        if (!response.ok) {
          throw new Error(data.error || 'Request failed.')
        }
        return data
      }

      const [statsData, usersData, bookingsData, messagesData] = await Promise.all([
        parse(statsRes),
        parse(usersRes),
        parse(bookingsRes),
        parse(messagesRes),
      ])

      setStats(statsData)
      setUsers(usersData.users || [])
      setBookings(bookingsData.bookings || [])
      setMessages(messagesData.messages || [])
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
      const response = await fetch(`/api/products/admin/users/${userId}/role/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      const statsRes = await fetch(STATS_URL, { credentials: 'include' })
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

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Delete this booking permanently?')) {
      return
    }

    setDeletingBookingId(bookingId)
    setStatus(null)

    try {
      const response = await fetch(`/api/products/admin/bookings/${bookingId}/`, {
        method: 'DELETE',
        credentials: 'include',
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
                  <span className="dashboard-stat-value">{stats.admins}</span>
                  <span className="dashboard-stat-label">{ROLE_LABELS.admin}s</span>
                </div>
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
