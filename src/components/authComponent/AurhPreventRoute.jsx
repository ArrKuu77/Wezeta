import React from "react";
import { useAuth } from "./context/AuthContext";
import Dashboard from "../../pages/dashboardPage/DashboardLayout";
import { Navigate } from "react-router-dom";
const AurhPreventRoute = ({ children }) => {
  const { session } = useAuth();
  if (session === undefined) {
    return <div>Loading...</div>; // or a spinner
  }

  // If logged in, block access to route and go home
  if (session) {
    return <Navigate to="/" replace />;
  }

  // Otherwise show the page (e.g. Signup)
  return <>{children}</>;
};

export default AurhPreventRoute;
