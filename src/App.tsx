import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ParkDetail from './pages/ParkDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/park/:id" element={<ParkDetail />} />
    </Routes>
  )
}

export default App
