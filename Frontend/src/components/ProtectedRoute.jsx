/* eslint-disable react/prop-types */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const ProtectedRoute = ({ children, roles = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <section className="section-band section-band--base">
        <div className="container py-5 text-center text-muted">Loading...</div>
      </section>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
