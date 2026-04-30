import { USER_ROLES } from "./roles";

export const NAVIGATION_BY_ROLE = {
  [USER_ROLES.ADMIN]: [
    { key: "admin-dashboard", label: "Resumen", path: "/admin/dashboard", icon: "◫" },
    { key: "admin-usuarios", label: "Usuarios", path: "/admin/usuarios", icon: "◌" },
    { key: "admin-instituciones", label: "Instituciones", path: "/admin/instituciones", icon: "▣" },
    { key: "admin-minijuegos", label: "Minijuegos", path: "/admin/minijuegos", icon: "◈" },
  ],
  
  [USER_ROLES.TUTOR]: [
    { key: "tutor-inicio", label: "Inicio", path: "/tutor/dashboard", icon: "🏠" },
    { key: "tutor-grupos", label: "Mis Grupos", path: "/tutor/grupos", icon: "👥" },
    { key: "tutor-estudiantes", label: "Estudiantes", path: "/tutor/estudiantes", icon: "🎓" },
    { key: "tutor-estadisticas", label: "Estadísticas", path: "/tutor/estadisticas", icon: "📊" },
    { key: "tutor-recomendaciones", label: "Recomendaciones IA", path: "/tutor/recomendaciones", icon: "🤖" },
    { key: "tutor-logros", label: "Logros", path: "/tutor/logros", icon: "🏆" },
    { key: "tutor-perfil", label: "Mi Perfil", path: "/tutor/perfil", icon: "👤" },
  ],
};