import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, isHydrating, user } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return <div className="container-shell py-10 text-sm text-zinc-500">A validar sessão...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate replace to="/404" />;
  }

  return <Outlet />;
};
