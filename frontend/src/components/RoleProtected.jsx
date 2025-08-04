import React from "react";
import { Navigate } from "react-router-dom";

export default function RoleProtected({ allowedRoles, userRole, children }) {
  if (!allowedRoles.includes(userRole)) {
    // Bloqueia acesso e redireciona para início
    return <Navigate to="/Inicio" replace />;
  }

  return children;
}
