import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { socialLinks } from '../constants/socialLinks'
import './css/Footer.css'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="container site-footer__container">
          <div className="site-footer__grid">
            <div className="site-footer__col site-footer__brand">
              <Link className="site-footer__logo-link" to="/">
                <BrandLogo size="md" />
              </Link>
              <p className="site-footer__tagline">Fashion oriented and curious about results</p>
              {socialLinks.length > 0 && (
                <div className="site-footer__social" aria-label="Social links">
                  {socialLinks.map(({ id, label, icon, url }) => (
                    <a
                      key={id}
                      href={url}
                      className="site-footer__social-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Dopekit on ${label}`}
                    >
                      <i className={icon} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="site-footer__col site-footer__links">
              <h2 className="site-footer__heading">Quick Links</h2>
              <ul className="site-footer__link-list">
                <li>
                  <Link className="site-footer__link" to="/Services">
                    Services
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to="/About">
                    About us
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to="/Contact">
                    Contact us
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to="/signup">
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link className="site-footer__link" to="/login">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>

            <div className="site-footer__col site-footer__contact">
              <h2 className="site-footer__heading">Get in touch</h2>
              <ul className="site-footer__contact-list">
                <li>
                  <i className="fa-solid fa-phone-volume" aria-hidden="true" />
                  <span>
                    <a href="tel:+254790331108">0790 331 108</a>
                    <span className="site-footer__sep"> / </span>
                    <a href="tel:+254727083181">0727 083 181</a>
                  </span>
                </li>
                <li>
                  <i className="fa-solid fa-envelope" aria-hidden="true" />
                  <a href="mailto:dopekit@gmail.com">dopekit@gmail.com</a>
                </li>
                <li>
                  <i className="fa-solid fa-location-crosshairs" aria-hidden="true" />
                  <span>Kikuyu Town</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer__bar">
        <p>&copy; Dopekit</p>
      </div>
    </footer>
  )
}

export default Footer
