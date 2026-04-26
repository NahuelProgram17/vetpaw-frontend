import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import Appointments from './pages/Appointments'
import Clinics from './pages/Clinics'
import MedicalHistory from './pages/MedicalHistory'
import Profile from './pages/Profile'
import VetDashboard from './pages/VetDashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/clinics" element={<Clinics />} />

          {/* Dueño */}
          <Route path="/dashboard" element={<ProtectedRoute role="owner"><Dashboard /></ProtectedRoute>} />
          <Route path="/pets" element={<ProtectedRoute role="owner"><Pets /></ProtectedRoute>} />
          <Route path="/pets/new" element={<ProtectedRoute role="owner"><Pets /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute role="owner"><Appointments /></ProtectedRoute>} />
          <Route path="/appointments/new" element={<ProtectedRoute role="owner"><Appointments /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute role="owner"><MedicalHistory /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Veterinario */}
          <Route path="/vet/dashboard" element={<ProtectedRoute role="vet"><VetDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App