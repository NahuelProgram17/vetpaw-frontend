import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterChoice from './pages/RegisterChoice'
import RegisterClinic from './pages/RegisterClinic'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import Appointments from './pages/Appointments'
import Clinics from './pages/Clinics'
import MedicalHistory from './pages/MedicalHistory'
import Profile from './pages/Profile'
import VetDashboard from './pages/VetDashboard'
import Messages from './pages/Messages'
import Tips from './pages/Tips'
import TerminosCondiciones from './pages/TerminosCondiciones'
import Privacidad from './pages/Privacidad'
import Contacto from './pages/Contacto'
import SumarVeterinaria from './pages/SumarVeterinaria'
import AnunciarVetPaw from './pages/AnunciarVetPaw'
import Blog from './pages/Blog'
import ScrollToTop from './components/ScrollToTop';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Estadisticas from './pages/Estadisticas';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterChoice />} />
          <Route path="/register/owner" element={<Register />} />
          <Route path="/register/clinic" element={<RegisterClinic />} />
          <Route path="/clinics" element={<Clinics />} />

          <Route path="/dashboard" element={<ProtectedRoute role="owner"><Dashboard /></ProtectedRoute>} />
          <Route path="/pets" element={<ProtectedRoute role="owner"><Pets /></ProtectedRoute>} />
          <Route path="/pets/new" element={<ProtectedRoute role="owner"><Pets /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute role="owner"><Appointments /></ProtectedRoute>} />
          <Route path="/appointments/new" element={<ProtectedRoute role="owner"><Appointments /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute role="owner"><MedicalHistory /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/clinic/estadisticas" element={<ProtectedRoute role="clinic"><Estadisticas /></ProtectedRoute>} />

          <Route path="/clinic/dashboard" element={<ProtectedRoute role="clinic"><VetDashboard /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
          <Route path="/terminos" element={<TerminosCondiciones />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/sumar-veterinaria" element={<SumarVeterinaria />} />
          <Route path="/anunciar" element={<AnunciarVetPaw />} />
          <Route path="/blog" element={<Blog />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App