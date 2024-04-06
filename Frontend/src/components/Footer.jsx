import React from 'react'

const Footer = () => {
    return (
        <>
            <div className="Footer mt-1">
                <div className="container sm-text-align-center">
                    <div className="row">
                        <div className="col-md-6 col-lg-5 col-12 ft-1">
                            <h3><a className="navbar-brand" href="/Landing"><span className="badge bg-light text-dark fs-4">Vo<i class="fa-solid fa-bolt"></i>tage <span className="badge bg-info text-danger">smuk</span></span></a></h3>
                            <p className='text-white'>Fashion oriented and curious about results</p>
                            <div className="footer-icons">
                                <i class="fa-brands fa-facebook"></i>
                                <i class="fa-brands fa-twitter"></i>
                                <i class="fa-brands fa-instagram"></i>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-3 col-12 ft-2">
                            <h5>Quick Links</h5>
                            <ul>
                                <li className="nav-item">
                                    <a className=" text-info" href="/">Services</a>
                                </li>
                                <li className="nav-item">
                                    <a className=" text-info" href="/">About us</a>
                                </li>
                                <li className="nav-item">
                                    <a className=" text-info" href="/">Contact us</a>
                                </li>
                            </ul>
                        </div>
                        <div className="col-md-6 col-lg-4 col-12 ft-3">
                            <h5>Get in touch</h5>
                            <p className=" text-info"><i class="fa-solid fa-phone-volume"></i> 0790331108 / 0743548780</p>
                            <p className=" text-info"><i class="fa-solid fa-envelope"></i> smuknails@gmail.com</p>
                            <p className=" text-info"><i class="fa-solid fa-location-crosshairs"></i> Wangige Mall</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='Last-footer'>
                <p>&copy; Dope kit Product</p>
            </div>
        </>
    )
}

export default Footer