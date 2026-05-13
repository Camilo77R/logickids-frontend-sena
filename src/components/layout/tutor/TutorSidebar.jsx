import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import { LayoutDashboard, Users, UserPlus, BarChart3, MessageSquareWarning, Trophy, LogOut, History } from "lucide-react";

export default function TutorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { path: "/tutor/dashboard", label: "Inicio", icon: <LayoutDashboard size={20} /> },
    { path: "/tutor/grupos", label: "Mis Grupos", icon: <Users size={20} /> },
    { path: "/tutor/estudiantes", label: "Estudiantes", icon: <UserPlus size={20} /> },
    { path: "/tutor/estadisticas", label: "Estadísticas", icon: <BarChart3 size={20} /> },
    { path: "/tutor/recomendaciones", label: "Recomendaciones IA", icon: <MessageSquareWarning size={20} /> },
    { path: "/tutor/sesiones", label: "Sesiones", icon: <History size={20} /> },
    { path: "/tutor/logros", label: "Logros", icon: <Trophy size={20} /> },
  ];

  return (
    <motion.aside 
      className="tutor-sidebar"
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="tutor-brand">
        <div className="tutor-brand-logo">LK</div>
        <div className="tutor-brand-text">
          <h2>LogicKids</h2>
          <span>Portal Tutor</span>
        </div>
      </div>

      <nav className="tutor-nav">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`tutor-nav-item ${isActive ? "active" : ""}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="tutor-nav-active-bg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="tutor-nav-icon">{item.icon}</span>
              <span className="tutor-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="tutor-sidebar-footer">
        <button className="tutor-logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </motion.aside>
  );
}
