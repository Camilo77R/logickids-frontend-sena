import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  MessageSquareWarning,
  Trophy,
  History,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/tutor/dashboard",        label: "Inicio",            icon: LayoutDashboard },
  { path: "/tutor/grupos",           label: "Mis Grupos",        icon: Users },
  { path: "/tutor/estudiantes",      label: "Estudiantes",       icon: UserPlus },
  { path: "/tutor/estadisticas",     label: "Estadísticas",      icon: BarChart3 },
  { path: "/tutor/recomendaciones",  label: "Recomendaciones",   icon: MessageSquareWarning },
  { path: "/tutor/sesiones",         label: "Sesiones",          icon: History },
  { path: "/tutor/logros",           label: "Logros",            icon: Trophy },
];

export default function TutorMobileNav() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="lk-tutor-mobile-nav" aria-label="Navegación tutor">
      <div className="lk-tutor-mobile-nav__track">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `lk-tutor-mobile-nav__link${isActive ? " active" : ""}`
            }
          >
            <span className="lk-tutor-mobile-nav__icon">
              <Icon size={18} />
            </span>
            <span className="lk-tutor-mobile-nav__label">{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className="lk-tutor-mobile-nav__power"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          <span className="lk-tutor-mobile-nav__icon">
            <LogOut size={18} />
          </span>
          <span className="lk-tutor-mobile-nav__label">Salir</span>
        </button>
      </div>
    </nav>
  );
}
