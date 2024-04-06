


const Bookservice = () => {

  return (
    <div>
      
<button type="button" className="btn btn-primary rounded-pill border border-5" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
  Book service
</button>


<div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
  <div className="modal-dialog">
    <div className="modal-content">
      <div className="modal-header">
      <h1 className="navbar-brand" href="#"><span className="badge bg-light text-dark fs-4">Voltage <span className="badge bg-info text-danger">smuk</span></span></h1>
        <h2 className="modal-title fs-5 text-primary fs-3" id="staticBackdropLabel">Booking booth</h2>
        <button type="button" className="btn-close w-1" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        
      <form>
  <div className="mb-3">
    <label for="name" className="form-label text-primary fs-4">Name</label>
    <input type="text" className="form-control" id="name"/>
  </div>

  <div className="mb-3">
    <label for="integer" className="form-label text-primary fs-4">Phone</label>
    <input type="integer" className="form-control" id="Phone"/>
  </div>

  <div className="mb-3">
    <label for="location" className="form-label text-primary fs-4">location</label>
    <input type="text" className="form-control" id="location"/>
  </div>
  
  
</form>

      </div>
      <div className="modal-footer float-start">
        <button type="button" className="btn btn-danger text-white" data-bs-dismiss="modal">Quit</button>
        <button type="submit" className="btn btn-primary">Send</button>
      </div>
    </div>
  </div>
</div>
    </div>
  )
}

export default Bookservice
