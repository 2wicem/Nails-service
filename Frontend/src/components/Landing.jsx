import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Bookservice from './Bookservice'
import BrandLogo from './BrandLogo'
import hero1 from './images/dope8.jpg'
import hero2 from './images/dope03.jpg'
import hero3 from './images/dope9.jpg'
import hero4 from './images/dope5.jpg'
import './css/Landing.css'

const heroSlides = [
  { id: 'hero-1', image: hero1, alt: 'Leopard tip gel nail art' },
  { id: 'hero-2', image: hero2, alt: 'Stiletto builder gel design' },
  { id: 'hero-3', image: hero3, alt: 'Classic gel manicure' },
  { id: 'hero-4', image: hero4, alt: 'Geometric builder gel nails' },
]

const SLIDE_INTERVAL_MS = 2000

const Landing = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroSlides.length)
    }, SLIDE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="landing-hero">
      <div className="landing-hero-carousel" aria-hidden="true">
        {heroSlides.map(({ id, image, alt }, index) => (
          <img
            key={id}
            src={image}
            alt={alt}
            className={`landing-hero-bg${index === activeIndex ? ' is-active' : ''}`}
          />
        ))}
      </div>

      <div className="landing-hero-overlay" aria-hidden="true" />

      <div className="landing-hero-content container text-center">
        <div className="landing-hero-badge mb-3">
          <BrandLogo size="lg" variant="hero" />
        </div>
        <h1 className="landing-hero-title">
          Looking for indoor or outdoor manicure and pedicure services
        </h1>
        <h2 className="landing-hero-subtitle">
          Discover the perfect nail care experience with Dopekit
        </h2>
        <p className="landing-hero-lead">
          From gel and builder sets to tips and acrylics, we bring professional nail care
          to you — at Wangige Mall or at your location.
        </p>
        <div className="landing-hero-actions d-flex justify-content-center gap-2 flex-wrap">
          <Link to="/Services" className="btn btn-outline-light btn-sm rounded-pill px-3 landing-btn-secondary">
            View services
          </Link>
          <Bookservice />
        </div>
      </div>
    </section>
  )
}

export default Landing
