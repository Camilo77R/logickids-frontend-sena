/**
 * TutorSidebar — Barra lateral del portal tutor LogicKids
 *
 * Usa clases de shared-layout.css (lk-sidebar, lk-nav-link, lk-avatar).
 * El ítem activo resalta en amarillo sobre fondo púrpura oscuro.
 */
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../hooks/useAuth";
import logoBadge from "../../../assets/imgs/logofondo transparente.png";
import logoWordmark from "../../../assets/imgs/logoLogickids transparente.png";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  MessageSquareWarning,
  Trophy,
  LogOut,
  History,
} from "lucide-react";

/** Ítems de navegación del tutor */
const NAV_ITEMS = [
  { path: "/tutor/dashboard",        label: "Inicio",            icon: LayoutDashboard },
  { path: "/tutor/grupos",           label: "Grupos",            icon: Users },
  { path: "/tutor/estudiantes",      label: "Estudiantes",       icon: UserPlus },
  { path: "/tutor/estadisticas",     label: "Estadisticas",           icon: BarChart3 },
  { path: "/tutor/recomendaciones",  label: "Recomendaciones IA",icon: MessageSquareWarning },
  { path: "/tutor/logros",           label: "Logros",            icon: Trophy },
  { path: "/tutor/sesiones",         label: "Sesiones",          icon: History },
];

export default function TutorSidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <motion.aside
      className="lk-tutor-sidebar"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.40, ease: "easeOut" }}
    >
      {/* Branding */}
      <div className="lk-tutor-sidebar-brand">
        <div className="lk-tutor-sidebar-brand-mark">
          <img
            src={logoBadge}
            alt=""
            className="lk-tutor-sidebar-brand-badge"
            aria-hidden="true"
          />
        </div>
        <div className="lk-tutor-sidebar-brand-copy">
          <img
            src={logoWordmark}
            alt="LogicKids"
            className="lk-tutor-sidebar-brand-wordmark"
          />
          <div className="lk-tutor-sidebar-brand-role">Portal Tutor</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="lk-tutor-sidebar-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={label}
            className={({ isActive }) =>
              `lk-tutor-nav-link${isActive ? " active" : ""}`
            }
          >
            <Icon size={18} className="lk-tutor-nav-link__icon" aria-hidden="true" />
            <span className="lk-tutor-nav-link__label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer: acceso rápido al cierre de sesión */}
      <div className="lk-tutor-sidebar-footer">
        <button
          className="lk-tutor-sidebar-power"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title={`Cerrar sesión de ${user?.nombre || "Tutor"}`}
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="lk-tutor-sidebar-power__label">Cerrar sesión</span>
        </button>
      </div>
    </motion.aside>
  );
}
