import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { apiFetch } from '../config/api'
import BrandLogo from './BrandLogo'
import './css/Signup.css'

const SIGNUP_CONFIG_PATH = '/products/auth/signup-config/'

const Login = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [allowTechnicianSignup, setAllowTechnicianSignup] = useState(false)

  useEffect(() => {
    apiFetch(SIGNUP_CONFIG_PATH)
      .then((response) => response.json())
      .then((data) => setAllowTechnicianSignup(data.allow_technician_signup === true))
      .catch(() => setAllowTechnicianSignup(false))
  }, [])

  useEffect(() => {
    if (user) {
      const destination = user.technician_pending
        ? '/technician-pending'
        : user.role === 'admin'
          ? '/admin'
          : user.role === 'worker'
            ? '/worker'
            : '/Services'
      navigate(destination, { replace: true })
    }
  }, [user, navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const data = await login(form)
      setStatus({ type: 'success', message: data.message })
      const destination = data.user?.technician_pending
        ? '/technician-pending'
        : data.user?.role === 'admin'
          ? '/admin'
          : data.user?.role === 'worker'
            ? '/worker'
            : '/Services'
      setTimeout(() => navigate(destination), 800)
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
            <h1 className="signup-title">Welcome back</h1>
            <p className="signup-subtitle">
              Log in to book services or open your staff dashboard on mobile.
            </p>
          </div>

          <div className="signup-card-body">
            {status && (
              <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="mb-3">
                <label htmlFor="login-email" className="form-label">
                  Email or username
                </label>
                <input
                  type="text"
                  className="form-control signup-input"
                  id="login-email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <label htmlFor="login-password" className="form-label mb-0">
                    Password
                  </label>
                  <Link to="/forgot-password" className="signup-forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  className="form-control signup-input"
                  id="login-password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 signup-submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <p className="signup-footer-text text-center mb-0">
              New here?{' '}
              <Link to="/signup" className="signup-link">
                Create an account
              </Link>
            </p>
            {allowTechnicianSignup && (
              <p className="signup-staff-link text-center mb-0">
                Salon team member?{' '}
                <Link to="/signup?type=technician" className="signup-link">
                  Join as a technician
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
