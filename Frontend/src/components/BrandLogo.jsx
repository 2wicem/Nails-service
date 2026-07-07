/* eslint-disable react/prop-types */
import './css/BrandLogo.css'

const sizeClass = {
  sm: 'brand-logo--sm',
  md: 'brand-logo--md',
  lg: 'brand-logo--lg',
}

const BrandLogo = ({ size = 'md', variant = 'default', className = '' }) => {
  return (
    <span
      className={`brand-logo ${sizeClass[size] || sizeClass.md} brand-logo--${variant} ${className}`.trim()}
      aria-label="Dopekit"
    >
      <span className="brand-dope">Dope</span>
      <i className="fa-solid fa-bolt brand-flash" aria-hidden="true" />
      <span className="brand-kit">kit</span>
    </span>
  )
}

export default BrandLogo
