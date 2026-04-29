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

// Pantalla temporal para evitar loops de redirección cuando el usuario ya está logueado en Tutor
const DummyDashboard = () => (
  <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
    <h2>Has iniciado sesión como Tutor 🎉</h2>
    <p>El dashboard del tutor está en la otra rama. Para volver al login, cierra tu sesión:</p>
    <button 
      onClick={() => { sessionStorage.clear(); window.location.href = '/login'; }}
      style={{ padding: "10px 20px", background: "#7C6FFF", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "20px" }}
    >
      Cerrar Sesión
    </button>
  </div>
);

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

        {/* Ruta temporal atrapada para el Tutor (la hace el otro desarrollador en su rama) */}
        <Route
          path="/tutor/dashboard"
          element={<ProtectedRoute><DummyDashboard /></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
