import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const auth = useAuth() || {};
  const token = auth.token || null;
  const role = auth.role || null;

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children || <div>Loading...</div>;
};

export default ProtectedRoute;
