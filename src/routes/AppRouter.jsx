/**
 * AppRouter
 *
 * Enrutador principal de la aplicación LogicKids (Web).
 * Define todas las rutas y aplica las guardas de autenticación y rol.
 */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { USER_ROLES } from "../constants/roles";

// Páginas de autenticación
import LoginPage from "../pages/auth/LoginPage";
import RegistroPage from "../pages/auth/RegistroPage";
import RecuperarAccesoPage from "../pages/auth/RecuperarAccesoPage";

// Páginas de administrador (institucional)
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import UsuariosPage from "../pages/admin/UsuariosPage";
import GruposPage from "../pages/admin/GruposPage";
import EstudiantesPage from "../pages/admin/EstudiantesPage";
import AdminsInstitucionalesPage from "../pages/admin/AdminsInstitucionalesPage";
import SolicitudesPage from "../pages/admin/SolicitudesPage";

// Páginas de superadmin (plataforma global)
import InstitucionesPage from "../pages/superadmin/InstitucionesPage";
import MinijuegosPage from "../pages/superadmin/MinijuegosPage";
import SuperadminDashboardPage from "../pages/superadmin/SuperadminDashboardPage";
import SuperadminUsersDirectoryPage from "../pages/superadmin/SuperadminUsersDirectoryPage";

// Páginas del tutor
import TutorDashboardOverview from "../pages/tutor/TutorDashboardOverview";
import TutorGruposPage from "../pages/tutor/TutorGruposPage";
import TutorEstudiantesPage from "../pages/tutor/TutorEstudiantesPage";
import TutorEstadisticasPage from "../pages/tutor/TutorEstadisticasPage";
import TutorRecomendacionesPage from "../pages/tutor/TutorRecomendacionesPage";
import TutorLogrosPage from "../pages/tutor/TutorLogrosPage";
import Tutorsesiones from "../pages/tutor/Tutorsesiones.page";
import TutorProfilePage from "../pages/tutor/TutorProfilePage";

// NUEVA: Página para solicitar reactivación de cuenta suspendida
import SolicitarReactivacionPage from "../pages/SolicitarReactivacionPage";

// Guardas de ruta
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";

// Layouts
import TutorLayout from "../components/layout/tutor/TutorLayout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirige la raíz al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ───────── RUTAS PÚBLICAS (sin sesión) ───────── */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/registro" element={<PublicRoute><RegistroPage /></PublicRoute>} />
        <Route path="/recuperar-acceso" element={<PublicRoute><RecuperarAccesoPage /></PublicRoute>} />

        {/* RUTA PÚBLICA: Solicitar reactivación */}
        <Route path="/solicitar-reactivacion" element={<PublicRoute><SolicitarReactivacionPage /></PublicRoute>} />

        {/* ───────── RUTAS DEL TUTOR ───────── */}
        <Route
          path="/tutor/*"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.TUTOR]}>
                <TutorLayout>
                  <Routes>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<TutorDashboardOverview />} />
                    <Route path="grupos" element={<TutorGruposPage />} />
                    <Route path="estudiantes" element={<TutorEstudiantesPage />} />
                    <Route path="estadisticas" element={<TutorEstadisticasPage />} />
                    <Route path="recomendaciones" element={<TutorRecomendacionesPage />} />
                    <Route path="logros" element={<TutorLogrosPage />} />
                    <Route path="sesiones" element={<Tutorsesiones />} />
                    <Route path="perfil" element={<TutorProfilePage />} />
                  </Routes>
                </TutorLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ───────── RUTAS DEL ADMIN (institucional) ───────── */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><AdminDashboardPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><UsuariosPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/grupos" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><GruposPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/estudiantes" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><EstudiantesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/admins" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><AdminsInstitucionalesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/solicitudes" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.ADMIN]}><SolicitudesPage /></RoleRoute></ProtectedRoute>} />

        {/* ───────── RUTAS DEL SUPERADMIN (plataforma global) ───────── */}
        <Route path="/superadmin/dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}><SuperadminDashboardPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/superadmin/instituciones" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}><InstitucionesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/superadmin/admins" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}><SuperadminUsersDirectoryPage type="admins" /></RoleRoute></ProtectedRoute>} />
        <Route path="/superadmin/tutores" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}><SuperadminUsersDirectoryPage type="tutors" /></RoleRoute></ProtectedRoute>} />
        <Route path="/superadmin/estudiantes" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}><SuperadminUsersDirectoryPage type="students" /></RoleRoute></ProtectedRoute>} />
        <Route path="/superadmin/minijuegos" element={<ProtectedRoute><RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}><MinijuegosPage /></RoleRoute></ProtectedRoute>} />

        {/* Cualquier ruta desconocida → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
