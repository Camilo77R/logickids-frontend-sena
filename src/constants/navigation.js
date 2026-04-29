import { USER_ROLES } from "./roles";

export const NAVIGATION_BY_ROLE = {
  [USER_ROLES.ADMIN]: [
    { key: "admin-dashboard", label: "Resumen", path: "/admin/dashboard", icon: "◫" },
    { key: "admin-usuarios", label: "Usuarios", path: "/admin/usuarios", icon: "◌" },
    { key: "admin-instituciones", label: "Instituciones", path: "/admin/instituciones", icon: "▣" },
    { key: "admin-minijuegos", label: "Minijuegos", path: "/admin/minijuegos", icon: "◈" },
  ],
};
