import { USER_ROLES } from "../constants/roles";

/**
 * Devuelve la ruta de inicio según el rol del usuario autenticado.
 * Usado por AuthContext y PublicRoute para redirigir automáticamente
 * al panel correcto después del login.
 *
 * @param {string} role - Rol del usuario ("superadmin" | "admin" | "tutor")
 * @returns {string} Ruta de inicio correspondiente al rol
 */
export const getHomePathByRole = (role) => {
  if (role === USER_ROLES.SUPERADMIN) return "/superadmin/instituciones";
  if (role === USER_ROLES.ADMIN) return "/admin/dashboard";
  if (role === USER_ROLES.TUTOR) return "/tutor/dashboard";
  return "/login";
};

