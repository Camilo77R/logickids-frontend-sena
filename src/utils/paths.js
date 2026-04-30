import { USER_ROLES } from "../constants/roles";

export const getHomePathByRole = (role) => {
  if (role === USER_ROLES.ADMIN) return "/admin/dashboard";
  if (role === USER_ROLES.TUTOR) return "/tutor/dashboard";
  return "/login";
};
