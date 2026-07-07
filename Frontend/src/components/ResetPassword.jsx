import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PASSWORD_HINT, validatePassword } from '../utils/passwordRules'
import { apiFetch } from '../config/api'
import BrandLogo from './BrandLogo'
import './css/Signup.css'

const RESET_PATH = '/products/auth/reset-password/'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const linkValid = useMemo(() => Boolean(uid && token), [uid, token])

  const [form, setForm] = useState({ password: '', confirm_password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    const passwordError = validatePassword(form.password)
    if (passwordError) {
      setStatus({ type: 'error', message: passwordError })
      setLoading(false)
      return
    }

    if (form.password !== form.confirm_password) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch(RESET_PATH, {
        method: 'POST',
        body: JSON.stringify({ uid, token, ...form }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not reset password.')
      }

      setStatus({ type: 'success', message: data.message })
      setTimeout(() => navigate('/login'), 1200)
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
            <h1 className="signup-title">Choose a new password</h1>
            <p className="signup-subtitle">{PASSWORD_HINT}</p>
          </div>

          <div className="signup-card-body">
            {!linkValid ? (
              <div className="alert alert-danger">
                This reset link is invalid. Request a new one from the forgot password page.
              </div>
            ) : (
              <>
                {status && (
                  <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'}`}>
                    {status.message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="signup-form">
                  <div className="mb-3">
                    <label htmlFor="reset-password" className="form-label">
                      New password
                    </label>
                    <input
                      type="password"
                      className="form-control signup-input"
                      id="reset-password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <p className="signup-password-hint">{PASSWORD_HINT}</p>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="reset-confirm" className="form-label">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      className="form-control signup-input"
                      id="reset-confirm"
                      name="confirm_password"
                      value={form.confirm_password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100 signup-submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Update password'}
                  </button>
                </form>
              </>
            )}

            <p className="signup-footer-text text-center mb-0">
              <Link to="/forgot-password" className="signup-link">
                Request a new link
              </Link>
              {' · '}
              <Link to="/login" className="signup-link">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ResetPassword
