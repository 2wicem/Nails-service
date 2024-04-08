import image1 from "./images/art.webp"
import image2 from "./images/web.webp"
import image3 from "./images/gel1.webp"
import image4 from "./images/web1.webp"
import image5 from "./images/web2.webp"
import image6 from "./images/tips.webp"
import Bookservice from "./Bookservice"
import './css/Services.css'
import ReactPlayer from 'react-player'

const Services = () => {
  return (
    <div>
      <div className="text-primary bg-info m-5 ps-5 pt-5 pb-5 border-start border-danger border-5 rounded-end">
          <div className="ms-5">
            <h1>Looking out for Perfect nails for an event or occassion</h1>
            <h2>Select below to indulge and give in to your passion...</h2>
          </div>

          <div className="d-flex justify-content-between">
          <div className="section ms-5">
       <table>
        <thead>
          <tr>
            <th className='expand'>Service</th>
            <th className='expand'>Cost in ksh</th>
          </tr>
        </thead>
        <tbody>
        <tr>
            <td>Just gel</td>
            <td>500</td>
          </tr>
          <tr>
            <td>Builder + gel</td>
            <td>1000</td>
          </tr>
          <tr>
            <td>Tips + gel</td>
            <td>1000</td>
          </tr>
          <tr>
            <td> Tips Builder + gel</td>
            <td>1500</td>
          </tr>
          <tr>
            <td>Gum gel</td>
            <td>1500</td>
          </tr>
          <tr>
            <td>Aclyrics</td>
            <td>2500</td>
          </tr>
        </tbody>
      </table>
      </div>
        
          <div className="container">
  <div id="carouselExampleAutoplaying" className="carousel slide w-75 me-5" data-bs-ride="carousel" data-bs-interval="2000">

    <div className="carousel-inner rounded-5">
      <div className="carousel-item active">
        <img src={image2} className="d-block w-100 h-100" alt="image1" />
      </div>
      <div className="carousel-item">
        <img src={image4} className="d-block w-100 h-100" alt="image2" />
      </div>
      <div className="carousel-item">
        <img src={image5} className="d-block w-100 h-100" alt="image3" />
      </div>
    </div>
    <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
      <span className="visually-hidden">Previous</span>
    </button>
    <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
      <span className="carousel-control-next-icon" aria-hidden="true"></span>
      <span className="visually-hidden">Next</span>
    </button>
  </div>
</div>
</div>
</div>


<div className="container justify-between d-flex flex-row border bg-danger mb-auto">

<div className="col-4 m-2 h-100">
<div className="card custom-card d-flex flex-column justify-content-center h-100 bg-dark">
  <img src={image2} className="card-img-top mx-auto img-fluid rounded-5 w-50" alt="..."/>
  <div className="card-body text-center h-100">
    <h5 className="card-title">Gel</h5>
    <p className="card-text text-primary">A quality plane gel featuring products such as Bluesky, skywei and another sexy</p>
    <Bookservice/>
  </div>
</div>
</div>

<div className="col-4 m-2 h-100">
<div className="card custom-card h-100 bg-dark">
  <img src={image4} className="card-img-top  mx-auto w-50 rounded-5" alt="..."/>
  <div className="card-body text-center h-100">
    <h5 className="card-title">Tips gel</h5>
    <p className="card-text text-primary">A quality plane gel featuring products such as Bluesky, skywei and another sexy coupled with no compromise proffessional tips</p>
    <Bookservice/>
  </div>
</div>
</div>

<div className="col-4 m-2 h-50">
<div className="card custom-card h-100 bg-dark">
  <img src={image5} className="card-img-top mx-auto w-50 rounded-5" alt="..."/>
  <div className="card-body text-center h-100">
    <h5 className="card-title">Builder gel</h5>
    <p className="card-text text-primary">A quality plane gel featuring products such as Bluesky, skywei and another sexy coupled with no compromise proffessional multiple color builder like Beshine, Nail luxie among others</p>
    <Bookservice/>
  </div>
</div>
</div>

</div>
    </div>
  )
}

export default Services
