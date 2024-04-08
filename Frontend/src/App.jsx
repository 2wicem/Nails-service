import About from "./components/About"
import Contact from "./components/Contact"
import Footer from "./components/Footer"
import Landing from "./components/Landing"
import Navbar from "./components/Navbar"
import Services from "./components/Services"
import {Routes, Route} from 'react-router-dom';

const App = () => {
  return (
    <div>
      <Navbar/>
      <Routes>
      <Route path='/' element={<Landing/>}/>
      <Route path='/Landing' element={<Landing/>}/>
      <Route path='/Services' element={<Services/>}/>
      <Route path='/About' element={<About/>}/>
      <Route path='/Contact' element={<Contact/>}/>
      </Routes>
      <Footer/>
    </div>
  )
}

export default App
