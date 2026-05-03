import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext.jsx";

export const ProtectedAdminRoute = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) return <Navigate replace to="/admin/login" />;
  if (user?.role !== "admin") return <Navigate replace to="/admin/login" />;

  return <Outlet />;
};
