import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import Appointments from './pages/Appointments'
import Clinics from './pages/Clinics'
import VetDashboard from './pages/VetDashboard'
import MedicalHistory from './pages/MedicalHistory'
import Profile from './pages/Profile'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/pets/new" element={<Pets />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/new" element={<Appointments />} />
          <Route path="/clinics" element={<Clinics />} />
          <Route path="/vet/dashboard" element={<VetDashboard />} />
          <Route path="/history" element={<MedicalHistory />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App