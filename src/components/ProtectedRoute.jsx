import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, hasRole, loading, initialized } = useAuth();
  const location = useLocation();

  // Wait for auth to initialize before rendering
  if (loading || !initialized) {
    return <div>Loading...</div>;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If a specific role is required, check for it
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to home if user doesn't have the required role
    return <Navigate to="/" replace />;
  }

  // If authentication and role checks pass, render the protected component
  return children;
};

export default ProtectedRoute;
