import Bookservice from "./Bookservice"
import {Link} from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
  <div className="container-fluid  justify-between">
    <a className="navbar-brand" href="/Landing"><span className="badge bg-light text-dark fs-4">Vo<i class="fa-solid fa-bolt"></i>tage <span className="badge bg-info text-danger">smuk</span></span></a>

    <div className="header bg-dark text-info text-center">
    <h1>Welcome to your go-to place for stunning nail designs...</h1>
  </div>
    
    <div className="collapse navbar-collapse" id="navbarNav">
      <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
        <Link to='/Services' className="nav-item nav-link active text-success fs-5 p-2" aria-current="page">
          Services
        </Link>
        <Link to='/About' className="nav-item text-decoration-none fs-5 p-2">
          About
        </Link>
        <Link to='/Contact' className="nav-item text-decoration-none fs-5 p-2 me-n2">
          Contact
        </Link>
        <l className="nav-item">
        <Bookservice/>
        </l>
      </ul>
    </div>
  </div>
</nav>
  )
}

export default Navbar
