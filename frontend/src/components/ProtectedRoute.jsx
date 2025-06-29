// components/ProtectedRoute.js
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // ⏳ or return a spinner if you'd like

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
