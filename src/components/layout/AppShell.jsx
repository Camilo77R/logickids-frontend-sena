import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import PortalShell from "./portal/PortalShell";
import AccountCenterModal from "../account/AccountCenterModal";
import { USER_ROLES } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";

const PORTAL_NAVIGATION = {
  [USER_ROLES.ADMIN]: [
    { key: "admin-dashboard", label: "Resumen", path: "/admin/dashboard", icon: LayoutDashboard },
    { key: "admin-usuarios", label: "Tutores", path: "/admin/usuarios", icon: UsersRound },
    { key: "admin-estudiantes", label: "Estudiantes", path: "/admin/estudiantes", icon: GraduationCap },
    { key: "admin-admins", label: "Admins", path: "/admin/admins", icon: ShieldCheck },
    { key: "admin-solicitudes", label: "Solicitudes", path: "/admin/solicitudes", icon: Mail },
  ],
  [USER_ROLES.SUPERADMIN]: [
    { key: "superadmin-dashboard", label: "Resumen global", path: "/superadmin/dashboard", icon: LayoutDashboard },
    { key: "superadmin-instituciones", label: "Instituciones", path: "/superadmin/instituciones", icon: Building2 },
  ],
};

const ROLE_LABEL = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.SUPERADMIN]: "Superadmin",
};

/**
 * AppShell
 *
 * Adaptador entre páginas administrativas y el shell moderno.
 * Mantiene la API simple: título, descripción, acciones y children.
 */
export default function AppShell({
  title,
  description,
  children,
  actions,
  notificationCount = 0,
}) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showAccountCenter, setShowAccountCenter] = useState(false);

  const initials = useMemo(() => {
    if (!user?.nombre) return "LK";

    return user.nombre
      .split(" ")
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("");
  }, [user?.nombre]);

  const navigation = PORTAL_NAVIGATION[user?.rol] ?? [];
  const roleLabel = ROLE_LABEL[user?.rol] ?? "Portal";

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  const handleNotificationsClick = () => {
    if (user?.rol === USER_ROLES.ADMIN) {
      navigate("/admin/solicitudes");
    }
  };

  return (
    <>
      <PortalShell
        navigation={navigation}
        roleLabel={roleLabel}
        title={title}
        subtitle={description}
        userName={user?.nombre || "Usuario LogicKids"}
        initials={initials}
        notificationCount={user?.rol === USER_ROLES.ADMIN ? notificationCount : 0}
        showNotifications={user?.rol === USER_ROLES.ADMIN}
        onNotificationsClick={handleNotificationsClick}
        onAccountCenter={() => setShowAccountCenter(true)}
        onLogout={handleLogout}
        actions={actions}
      >
        {children}
      </PortalShell>

      <AccountCenterModal
        show={showAccountCenter}
        onHide={() => setShowAccountCenter(false)}
      />
    </>
  );
}
