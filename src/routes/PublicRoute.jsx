import { Navigate } from "react-router-dom";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../hooks/useAuth";

export default function PublicRoute({ children }) {
  const { isAuthenticated, isBootstrapping, homePath } = useAuth();

  if (isBootstrapping) {
    return <LoadingState message="Preparando acceso..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={homePath} replace />;
  }

  return children;
}
