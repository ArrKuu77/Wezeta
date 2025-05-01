import React from "react";
import { useAuth } from "./authComponent/context/AuthContext";
import { Navigate } from "react-router-dom";

const PreventRoute = ({ children }) => {
  const { session } = useAuth();

  if (session === undefined) {
    return <div>Loading...</div>; // or a spinner
  }

  // If logged in, block access to route and go home
  if (!session) {
    return <Navigate to="/signup" replace />;
  }

  // Otherwise show the page (e.g. Signup)
  return <>{children}</>;
};

export default PreventRoute;
