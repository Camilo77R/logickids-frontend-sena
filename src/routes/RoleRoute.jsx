import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getHomePathByRole } from "../utils/paths";

export default function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.rol)) {
    return <Navigate to={getHomePathByRole(user?.rol)} replace />;
  }

  return children;
}
