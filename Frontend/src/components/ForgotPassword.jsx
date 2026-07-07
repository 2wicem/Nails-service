import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { apiFetch } from '../config/api'
import './css/Signup.css'

const FORGOT_PATH = '/products/auth/forgot-password/'

const toResetPath = (url) => {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const response = await apiFetch(FORGOT_PATH, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not send reset email.')
      }

      setStatus({
        type: 'success',
        message: data.message,
        debugLink: data.debug_reset_link,
      })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section-band section-band--alt signup-page">
      <div className="container">
        <div className="signup-card mx-auto">
          <div className="signup-card-header text-center">
            <BrandLogo size="md" />
            <h1 className="signup-title">Forgot password</h1>
            <p className="signup-subtitle">
              Enter your account email and we will send you a link to reset your password.
            </p>
          </div>

          <div className="signup-card-body">
            {status && (
              <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'}`}>
                {status.message}
                {status.debugLink && (
                  <p className="signup-debug-link mb-0 mt-2">
                    Dev link:{' '}
                    <Link to={toResetPath(status.debugLink)} className="signup-link">
                      Reset password
                    </Link>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="mb-4">
                <label htmlFor="forgot-email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control signup-input"
                  id="forgot-email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 signup-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="signup-footer-text text-center mb-0">
              Remembered it?{' '}
              <Link to="/login" className="signup-link">
                Back to log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ForgotPassword
