/**
 * SuperadminLayout — Layout de navegación para el superadmin
 *
 * Proporciona la barra lateral y el encabezado para todas las páginas
 * del superadmin. El superadmin gestiona la plataforma completa:
 * instituciones y minijuegos.
 *
 * CONCEPTO: Un Layout es un componente que envuelve páginas y provee
 * estructura visual compartida (sidebar, header, footer) sin repetir código.
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, Gamepad2, LogOut, Settings, ShieldCheck } from "lucide-react";
import AccountCenterModal from "../../account/AccountCenterModal";
import { useAuth } from "../../../hooks/useAuth";

/** Ítems de navegación del superadmin */
const NAV_ITEMS = [
  {
    to: "/superadmin/instituciones",
    icon: Building2,
    label: "Instituciones",
    description: "Crear, editar y eliminar colegios",
  },
  {
    to: "/superadmin/minijuegos",
    icon: Gamepad2,
    label: "Minijuegos",
    description: "Activar o desactivar juegos",
  },
];

export default function SuperadminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showAccountCenter, setShowAccountCenter] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.shell}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        {/* Branding */}
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <div style={styles.brandName}>LogicKids</div>
            <div style={styles.brandRole}>Superadmin</div>
          </div>
        </div>

        {/* Perfil */}
        <div style={styles.profile}>
          <div style={styles.profileAvatar}>
            {(user?.nombre ?? "S").charAt(0).toUpperCase()}
          </div>
          <div style={styles.profileInfo}>
            <div style={styles.profileName}>{user?.nombre ?? "Superadmin"}</div>
            <div style={styles.profileEmail}>{user?.email ?? ""}</div>
          </div>
        </div>

        <button style={styles.accountButton} onClick={() => setShowAccountCenter(true)}>
          <Settings size={16} />
          <span>Centro de cuenta</span>
        </button>

        {/* Navegación */}
        <nav style={styles.nav}>
          {NAV_ITEMS.map(({ to, icon: Icon, label, description }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <Icon size={20} />
                <div>
                  <div style={styles.navLabel}>{label}</div>
                  <div style={styles.navDesc}>{description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <button style={styles.signOut} onClick={handleSignOut}>
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* ── Contenido principal ── */}
      <main style={styles.main}>{children}</main>

      <AccountCenterModal show={showAccountCenter} onHide={() => setShowAccountCenter(false)} />
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: "260px",
    background: "#612B88",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  brandIcon: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "8px",
    display: "flex",
  },
  brandName: { color: "white", fontWeight: 700, fontSize: "16px" },
  brandRole: { color: "rgba(255,255,255,0.5)", fontSize: "12px" },
  profile: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "20px",
  },
  profileAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#612B88",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 700,
    fontSize: "15px",
    flexShrink: 0,
  },
  profileInfo: { overflow: "hidden" },
  profileName: {
    color: "white",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "11px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    padding: "12px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    color: "rgba(255,255,255,0.65)",
    transition: "background 0.15s",
  },
  navItemActive: {
    background: "rgba(255,255,255,0.12)",
    color: "white",
  },
  navLabel: { fontSize: "14px", fontWeight: 600 },
  navDesc: { fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" },
  main: { flex: 1, padding: "32px", overflowY: "auto" },
  accountButton: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    width: "100%",
    marginBottom: "16px",
  },
  signOut: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    width: "100%",
    marginTop: "auto",
  },
};
