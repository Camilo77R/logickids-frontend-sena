import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import logoBadge from "../../../assets/imgs/logofondo transparente.png";
import logoWordmark from "../../../assets/imgs/logoLogickids transparente.png";

/**
 * PortalSidebar
 *
 * Barra lateral compacta tipo mockup.
 * SOLO se encarga de navegación y salida.
 */
export default function PortalSidebar({
  navigation,
  roleLabel,
  userName,
  initials,
  onLogout,
}) {
  return (
    <motion.aside
      className="lk-portal-sidebar"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div className="lk-portal-sidebar__brand-block" aria-label={`Portal ${roleLabel}`}>
        <div className="lk-portal-sidebar__brand">
          <img
            src={logoBadge}
            alt="LogicKids"
            className="lk-portal-sidebar__brand-badge"
          />
        </div>
        <img
          src={logoWordmark}
          alt="LogicKids"
          className="lk-portal-sidebar__brand-wordmark"
        />
        <span className="lk-portal-sidebar__brand-role">{roleLabel}</span>
      </div>

      <nav className="lk-portal-sidebar__nav" aria-label="Navegación principal">
        {navigation.map(({ key, path, label, icon: Icon }) => (
          <NavLink
            key={key}
            to={path}
            title={label}
            className={({ isActive }) =>
              `lk-portal-sidebar__link${isActive ? " active" : ""}`
            }
          >
            <span className="lk-portal-sidebar__link-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <span className="lk-portal-sidebar__link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="lk-portal-sidebar__footer">
        <div className="lk-portal-sidebar__profile">
          <div className="lk-portal-sidebar__avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="lk-portal-sidebar__profile-copy">
            <strong>{userName}</strong>
            <small>{roleLabel}</small>
          </div>
        </div>

        <button
          type="button"
          className="lk-portal-sidebar__power"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </motion.aside>
  );
}
