import { USER_ROLES } from "./roles";

export const NAVIGATION_BY_ROLE = {
  [USER_ROLES.SUPERADMIN]: [
    { key: "superadmin-dashboard", label: "Resumen global", path: "/admin/dashboard", icon: "◫" },
    { key: "superadmin-instituciones", label: "Instituciones", path: "/admin/instituciones", icon: "▣" },
    { key: "superadmin-minijuegos", label: "Minijuegos", path: "/admin/minijuegos", icon: "◈" },
  ],
  [USER_ROLES.ADMIN]: [
    { key: "admin-usuarios", label: "Tutores", path: "/admin/usuarios", icon: "◌" },
  ],
  [USER_ROLES.TUTOR]: [
    { key: "tutor-dashboard", label: "Inicio", path: "/tutor/dashboard", icon: "🏠" },
    { key: "tutor-grupos", label: "Grupos", path: "/tutor/grupos", icon: "👥" },
    { key: "tutor-perfil", label: "Perfil", path: "/tutor/perfil", icon: "👤" },
  ],
};
