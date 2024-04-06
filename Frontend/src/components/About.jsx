import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">About Us</h1>
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <p className="lead">
            We are dedicated to providing top-notch services to our clients and ensuring a relaxing
            and enjoyable experience.
          </p>
          <p className="text-muted">
            Contact us for more information:
          </p>
          <ul className="list-unstyled">
            <li>
              <strong>Email:</strong> smuknails@gmail.com
            </li>
            <li>
              <strong>Phone:</strong> 0790331108 / 0743548780
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
