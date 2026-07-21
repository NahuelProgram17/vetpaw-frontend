import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import { RouteChangeLoader, VetPawLoader } from './components/VetPawLoader'
import BirthdayCelebration from './components/BirthdayCelebration'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const RegisterChoice = lazy(() => import('./pages/RegisterChoice'))
const RegisterClinic = lazy(() => import('./pages/RegisterClinic'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Pets = lazy(() => import('./pages/Pets'))
const Appointments = lazy(() => import('./pages/Appointments'))
const Clinics = lazy(() => import('./pages/Clinics'))
const MedicalHistory = lazy(() => import('./pages/MedicalHistory'))
const Profile = lazy(() => import('./pages/Profile'))
const VetDashboard = lazy(() => import('./pages/VetDashboard'))
const Messages = lazy(() => import('./pages/Messages'))
const Tips = lazy(() => import('./pages/Tips'))
const TerminosCondiciones = lazy(() => import('./pages/TerminosCondiciones'))
const Privacidad = lazy(() => import('./pages/Privacidad'))
const Contacto = lazy(() => import('./pages/Contacto'))
const ComoFunciona = lazy(() => import('./pages/ComoFunciona'))
const SumarVeterinaria = lazy(() => import('./pages/SumarVeterinaria'))
const AnunciarVetPaw = lazy(() => import('./pages/AnunciarVetPaw'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Estadisticas = lazy(() => import('./pages/Estadisticas'))
const ClinicProfile = lazy(() => import('./pages/ClinicProfile'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const LostPets = lazy(() => import('./pages/LostPets'))
const Configuracion = lazy(() => import('./pages/Configuracion'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Community = lazy(() => import('./pages/Community'))
const PublicPetProfile = lazy(() => import('./pages/PublicPetProfile'))
const CommunityModeration = lazy(() => import('./pages/CommunityModeration'))
const NotFound = lazy(() => import('./pages/NotFound'))

const pageFallback = (
  <VetPawLoader
    message="Cargando VetPaw..."
    subText="Preparando esta sección"
  />
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <RouteChangeLoader />
        <Navbar />
        <BirthdayCelebration />
        <Suspense fallback={pageFallback}>
          <Routes>
            <Route path="/" element={<Community />} />
            <Route path="/comunidad" element={<Community />} />
            <Route path="/inicio-vetpaw" element={<Home />} />
            <Route path="/mascotas/:id" element={<PublicPetProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterChoice />} />
            <Route path="/register/owner" element={<Register />} />
            <Route path="/register/clinic" element={<RegisterClinic />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/mascotas-perdidas" element={<LostPets />} />
            <Route path="/clinicas/:slug" element={<ClinicProfile />} />

            <Route path="/dashboard" element={<ProtectedRoute role="owner"><Dashboard /></ProtectedRoute>} />
            <Route path="/pets" element={<ProtectedRoute role="owner"><Pets /></ProtectedRoute>} />
            <Route path="/pets/new" element={<ProtectedRoute role="owner"><Pets /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute role="owner"><Appointments /></ProtectedRoute>} />
            <Route path="/appointments/new" element={<ProtectedRoute role="owner"><Appointments /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute role="owner"><MedicalHistory /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/clinic/estadisticas" element={<ProtectedRoute role="clinic"><Estadisticas /></ProtectedRoute>} />
            <Route path="/admin-panel" element={<ProtectedRoute permission="admin"><AdminPanel /></ProtectedRoute>} />
            <Route path="/comunidad/moderacion" element={<ProtectedRoute permission="moderator"><CommunityModeration /></ProtectedRoute>} />

            <Route path="/clinic/dashboard" element={<ProtectedRoute role="clinic"><VetDashboard /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
            <Route path="/terminos" element={<TerminosCondiciones />} />
            <Route path="/privacidad" element={<Privacidad />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/contact" element={<Contacto />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/sumar-veterinaria" element={<SumarVeterinaria />} />
            <Route path="/anunciar" element={<AnunciarVetPaw />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
