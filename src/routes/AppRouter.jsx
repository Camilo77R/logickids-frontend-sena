import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegistroPage from "../pages/auth/RegistroPage";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";

// Pantalla temporal para evitar loops de redirección cuando el usuario ya está logueado
const DummyDashboard = () => (
  <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
    <h2>Has iniciado sesión correctamente 🎉</h2>
    <p>El dashboard oficial está en otra rama. Para volver al login, cierra tu sesión:</p>
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

        {/* Rutas protegidas atrapadas temporalmente para evitar Infinite Loop */}
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute><DummyDashboard /></ProtectedRoute>}
        />
        <Route
          path="/tutor/dashboard"
          element={<ProtectedRoute><DummyDashboard /></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
