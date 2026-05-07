/**
 * AppRouter
 *
 * Enrutador principal de la aplicación LogicKids (Web).
 * Define todas las rutas y aplica las guardas de autenticación y rol.
 *
 * CONCEPTO — Guardas de ruta:
 *  - ProtectedRoute: verifica que haya sesión activa. Si no, redirige a /login
 *  - RoleRoute: verifica que el rol del usuario sea el correcto. Si no, redirige a /login
 *  - PublicRoute: solo accesible sin sesión (login, registro). Si ya hay sesión, redirige al home del rol
 *
 * JERARQUÍA DE ROLES:
 *  superadmin → /superadmin/* (instituciones, minijuegos)
 *  admin      → /admin/* (gestión de tutores de su institución)
 *  tutor      → /tutor/* (grupos, estudiantes, estadísticas, etc.)
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

// Páginas de superadmin (plataforma global)
import InstitucionesPage from "../pages/admin/InstitucionesPage";
import MinijuegosPage from "../pages/admin/MinijuegosPage";

// Páginas del tutor
import TutorDashboardOverview from "../pages/tutor/TutorDashboardOverview";
import TutorGruposPage from "../pages/tutor/TutorGruposPage";
import TutorEstudiantesPage from "../pages/tutor/TutorEstudiantesPage";
import TutorEstadisticasPage from "../pages/tutor/TutorEstadisticasPage";
import TutorRecomendacionesPage from "../pages/tutor/TutorRecomendacionesPage";
import TutorLogrosPage from "../pages/tutor/TutorLogrosPage";
import TutorSesionesPage from "../pages/tutor/Tutorsesiones.page";

// Guardas de ruta
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";

// Layouts
import TutorLayout from "../components/layout/tutor/TutorLayout";
import SuperadminLayout from "../components/layout/superadmin/SuperadminLayout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirige la raíz al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ───────── RUTAS PÚBLICAS (sin sesión) ───────── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/registro"
          element={
            <PublicRoute>
              <RegistroPage />
            </PublicRoute>
          }
        />
        <Route
          path="/recuperar-acceso"
          element={
            <PublicRoute>
              <RecuperarAccesoPage />
            </PublicRoute>
          }
        />

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
                    <Route path="sesiones" element={<TutorSesionesPage />} />
                  </Routes>
                </TutorLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ───────── RUTAS DEL ADMIN (institucional) ───────── */}
        {/* El admin gestiona SOLO los tutores de su institución */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <UsuariosPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ───────── RUTAS DEL SUPERADMIN (plataforma global) ───────── */}
        {/* El superadmin gestiona instituciones y minijuegos de TODA la plataforma */}
        <Route
          path="/superadmin/instituciones"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
                <SuperadminLayout>
                  <InstitucionesPage />
                </SuperadminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/minijuegos"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
                <SuperadminLayout>
                  <MinijuegosPage />
                </SuperadminLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Cualquier ruta desconocida → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
