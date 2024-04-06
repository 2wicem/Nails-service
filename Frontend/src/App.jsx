import About from "./components/About"
import Contact from "./components/Contact"
import Footer from "./components/Footer"
import Landing from "./components/Landing"
import Navbar from "./components/Navbar"
import Services from "./components/Services"
import { BrowserRouter as Router, Route} from 'react-router-dom';

const App = () => {
  return (
    <div>
      <Navbar/>
      <Router>
      <Route path='/Landing' element={<Landing/>}/>
      <Route path='/Services' element={<Services/>}/>
      <Route path='/About' element={<About/>}/>
      <Route path='/Contact' element={<Contact/>}/>
      </Router>
      <Footer/>
    </div>
  )
}

export default App
