import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { USER_ROLES } from "../constants/roles";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import InstitucionesPage from "../pages/admin/InstitucionesPage";
import MinijuegosPage from "../pages/admin/MinijuegosPage";
import SuperadminDashboardPage from "../pages/admin/SuperadminDashboardPage";
import UsuariosPage from "../pages/admin/UsuariosPage";
import LoginPage from "../pages/auth/LoginPage";
import RegistroPage from "../pages/auth/RegistroPage";
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import TutorProfilePage from "../pages/tutor/TutorProfilePage";
import TutorGroupsPage from "../pages/tutor/TutorGroupsPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";

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

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
                <SuperadminDashboardPage />
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
              <RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
                <InstitucionesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/minijuegos"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
                <MinijuegosPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/institution-admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.TUTOR]}>
                <TutorDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/perfil"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.TUTOR]}>
                <TutorProfilePage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/grupos"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[USER_ROLES.TUTOR]}>
                <TutorGroupsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
