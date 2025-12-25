import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

const PrivateRoute = ({ roles }) => {
  const { user, token } = useAuth();

  //console.log("User Role:", user?.role || "No user logged in");
  //console.log("Required Roles:", roles);

  // Redirect to login if no JWT token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If roles are required, check if the single user.role is included in that roles array
  if (roles?.length > 0 && !roles.includes(user?.role)) {
    console.warn("Unauthorized access: Redirecting...");
    return <Navigate to="*" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
