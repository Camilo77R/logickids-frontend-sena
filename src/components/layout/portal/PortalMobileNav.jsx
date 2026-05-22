import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function PortalMobileNav({
  navigation,
  roleLabel,
  onLogout,
}) {
  return (
    <nav className="lk-portal-mobile-nav" aria-label={`Navegación ${roleLabel}`}>
      <div className="lk-portal-mobile-nav__track">
        {navigation.map(({ key, path, label, icon: Icon }) => (
          <NavLink
            key={key}
            to={path}
            className={({ isActive }) =>
              `lk-portal-mobile-nav__link${isActive ? " active" : ""}`
            }
          >
            <span className="lk-portal-mobile-nav__icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span className="lk-portal-mobile-nav__label">{label.split(" ")[0]}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className="lk-portal-mobile-nav__power"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <span className="lk-portal-mobile-nav__icon" aria-hidden="true">
            <LogOut size={18} />
          </span>
          <span className="lk-portal-mobile-nav__label">Salir</span>
        </button>
      </div>
    </nav>
  );
}
