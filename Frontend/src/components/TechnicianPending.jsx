import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import BrandLogo from './BrandLogo'
import './css/Signup.css'

const TechnicianPending = () => {
  const { user, logout } = useAuth()

  const isRejected = user?.technician_approval === 'rejected'

  return (
    <section className="section-band section-band--alt signup-page">
      <div className="container">
        <div className="signup-card mx-auto">
          <div className="signup-card-header text-center">
            <BrandLogo size="md" />
            <h1 className="signup-title">
              {isRejected ? 'Application not approved' : 'Application under review'}
            </h1>
            <p className="signup-subtitle">
              {isRejected
                ? 'Your technician application was not approved. You can still book services as a client.'
                : 'Thanks for applying to join the Dopekit team. An admin will review your application soon.'}
            </p>
          </div>

          <div className="signup-card-body text-center">
            {!isRejected && (
              <p className="text-muted mb-4">
                We will email you at <strong>{user?.email}</strong> once your account is approved.
                You can log out and check back later.
              </p>
            )}

            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
              <Link to="/Services" className="btn btn-primary">
                Browse services
              </Link>
              <button type="button" className="btn btn-outline-secondary" onClick={() => logout()}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TechnicianPending
