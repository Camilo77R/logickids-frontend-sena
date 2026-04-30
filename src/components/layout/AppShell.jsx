import { NavLink, useNavigate } from "react-router-dom";
import LogicKidsLogo from "../branding/LogicKidsLogo";
import { NAVIGATION_BY_ROLE } from "../../constants/navigation";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../../components/NotificationBell";

export default function AppShell({
  eyebrow,
  title,
  description,
  children,
  actions,
}) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const navigation = NAVIGATION_BY_ROLE[user?.rol] ?? [];
  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .slice(0, 2)
        .map((chunk) => chunk[0]?.toUpperCase())
        .join("")
    : "LK";

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="lk-shell">
      <div className="lk-shell-grid">
        <aside className="lk-shell-sidebar">
          <div className="lk-auth-brand">
            <LogicKidsLogo />
            <div className="lk-auth-brand-copy">
              <strong>LogicKids</strong>
              <span>Panel administrativo</span>
            </div>
          </div>

          <section className="lk-shell-profile">
            <div className="lk-avatar">{initials}</div>
            <div className="lk-shell-profile-copy">
              <strong>{user?.nombre || "Usuario"}</strong>
              <span>{user?.email}</span>
              <span className="lk-role-badge">Administrador</span>
            </div>
          </section>

          <nav className="lk-nav" aria-label="Navegación principal">
            {navigation.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  `lk-nav-link${isActive ? " active" : ""}`
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button type="button" className="lk-btn lk-btn--secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </aside>

        <main className="lk-shell-main">
          <header className="lk-topbar">
            <div className="lk-topbar-title">Administración</div>
            <div className="lk-topbar-tools" aria-hidden="true">
              <NotificationBell />
              <span className="lk-topbar-icon">⚙</span>
              <span className="lk-topbar-icon">{initials}</span>
            </div>
          </header>

          <section className="lk-page-header">
            <div>
              {eyebrow ? <span className="lk-page-eyebrow">{eyebrow}</span> : null}
              <h1>{title}</h1>
              <p className="lk-page-subtitle">{description}</p>
            </div>
            {actions ? <div className="lk-actions">{actions}</div> : null}
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}
