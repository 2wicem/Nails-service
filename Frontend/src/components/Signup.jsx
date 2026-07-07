import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ACCOUNT_TYPES, parseSignupAccountType } from '../constants/accountTypes'
import { useAuth } from '../context/useAuth'
import { PASSWORD_HINT, validatePassword } from '../utils/passwordRules'
import { apiFetch } from '../config/api'
import BrandLogo from './BrandLogo'
import './css/Signup.css'

const SIGNUP_CONFIG_PATH = '/products/auth/signup-config/'

const Signup = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useAuth()
  const prefilledType = parseSignupAccountType(searchParams.get('type'))
  const [allowTechnicianSignup, setAllowTechnicianSignup] = useState(true)
  const [requireTechnicianApproval, setRequireTechnicianApproval] = useState(false)
  const [accountType, setAccountType] = useState('client')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch(SIGNUP_CONFIG_PATH)
      .then((response) => response.json())
      .then((data) => {
        const allowed = data.allow_technician_signup !== false
        setAllowTechnicianSignup(allowed)
        setRequireTechnicianApproval(data.require_technician_approval === true)
        const nextType =
          allowed && prefilledType === 'technician' ? 'technician' : 'client'
        setAccountType(nextType)
      })
      .catch(() => {
        setAllowTechnicianSignup(true)
        setAccountType(prefilledType)
      })
  }, [prefilledType])

  const accountMeta = ACCOUNT_TYPES[accountType]
  const accountOptions = allowTechnicianSignup
    ? Object.values(ACCOUNT_TYPES)
    : [ACCOUNT_TYPES.client]

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAccountTypeChange = (nextType) => {
    setAccountType(nextType)
    setStatus(null)
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
      const data = await register({ ...form, account_type: accountType })
      setStatus({ type: 'success', message: data.message })
      const destination = data.user?.technician_pending
        ? '/technician-pending'
        : data.user?.role === 'worker'
          ? '/worker'
          : '/Services'
      setTimeout(() => navigate(destination), 1200)
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
            <h1 className="signup-title">{accountMeta.signupTitle}</h1>
            <p className="signup-subtitle">{accountMeta.signupSubtitle}</p>
          </div>

          <div className="signup-card-body">
            {allowTechnicianSignup && (
              <div
                className="signup-account-switch"
                role="group"
                aria-label="Choose account type"
              >
                {accountOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`signup-account-option${
                      accountType === option.value ? ' is-active' : ''
                    }`}
                    aria-pressed={accountType === option.value}
                    onClick={() => handleAccountTypeChange(option.value)}
                  >
                    <span className="signup-account-option-label">{option.label}</span>
                    <span className="signup-account-option-hint">{option.shortLabel}</span>
                  </button>
                ))}
              </div>
            )}

            {status && (
              <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="mb-3">
                <label htmlFor="signup-name" className="form-label">
                  Full name
                </label>
                <input
                  type="text"
                  className="form-control signup-input"
                  id="signup-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="signup-email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control signup-input"
                  id="signup-email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="signup-phone" className="form-label">
                  Phone
                </label>
                <input
                  type="tel"
                  className="form-control signup-input"
                  id="signup-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="e.g. 0790331108"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="signup-password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control signup-input"
                  id="signup-password"
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
                <label htmlFor="signup-confirm" className="form-label">
                  Confirm password
                </label>
                <input
                  type="password"
                  className="form-control signup-input"
                  id="signup-confirm"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {accountType === 'technician' && (
                <p className="signup-team-note">
                  {requireTechnicianApproval
                    ? 'Technician accounts require admin approval before you can manage schedules and bookings.'
                    : 'Technician accounts can manage schedules and bookings. Admin access is granted separately by the salon owner.'}
                </p>
              )}

              <button type="submit" className="btn btn-primary w-100 signup-submit" disabled={loading}>
                {loading ? 'Creating account...' : accountMeta.submitLabel}
              </button>
            </form>

            <p className="signup-footer-text text-center mb-0">
              Already have an account?{' '}
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

export default Signup
