import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { USER_ROLES } from "../constants/roles";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import InstitucionesPage from "../pages/admin/InstitucionesPage";
import MinijuegosPage from "../pages/admin/MinijuegosPage";
import UsuariosPage from "../pages/admin/UsuariosPage";
import LoginPage from "../pages/auth/LoginPage";
import RegistroPage from "../pages/auth/RegistroPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";

import TutorLayout from "../components/layout/tutor/TutorLayout";
import TutorDashboardOverview from "../pages/tutor/TutorDashboardOverview";
import TutorGruposPage from "../pages/tutor/TutorGruposPage";
import TutorEstudiantesPage from "../pages/tutor/TutorEstudiantesPage";
import TutorEstadisticasPage from "../pages/tutor/TutorEstadisticasPage";
import TutorRecomendacionesPage from "../pages/tutor/TutorRecomendacionesPage";
import TutorLogrosPage from "../pages/tutor/TutorLogrosPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

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

        {/* Rutas Oficiales del Administrador */}
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
        <Route
          path="/admin/instituciones"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <InstitucionesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/minijuegos"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <MinijuegosPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Rutas del Tutor */}
        <Route
          path="/tutor/*"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.TUTOR]}>
                <TutorLayout>
                  <Routes>
                    <Route path="dashboard" element={<TutorDashboardOverview />} />
                    <Route path="grupos" element={<TutorGruposPage />} />
                    <Route path="estudiantes" element={<TutorEstudiantesPage />} />
                    <Route path="estadisticas" element={<TutorEstadisticasPage />} />
                    <Route path="recomendaciones" element={<TutorRecomendacionesPage />} />
                    <Route path="logros" element={<TutorLogrosPage />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </TutorLayout>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
