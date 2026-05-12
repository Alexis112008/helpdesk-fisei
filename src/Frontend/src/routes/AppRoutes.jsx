import { Routes, Route } from "react-router-dom";

import LoginPage from "../pages/LoginPage";

import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersManagement from "../pages/admin/UsersManagement";

import TechnicianDashboard from "../pages/technician/TechnicianDashboard";
import UserDashboard from "../pages/user/UserDashboard";

import PrivateRoute from "./PrivateRoute";

export default function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/" element={<LoginPage />} />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={["Administrador"]}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <PrivateRoute allowedRoles={["Administrador"]}>
            <UsersManagement />
          </PrivateRoute>
        }
      />

      {/* TECHNICIAN */}
      <Route
        path="/technician"
        element={
          <PrivateRoute allowedRoles={["Tecnico"]}>
            <TechnicianDashboard />
          </PrivateRoute>
        }
      />

      {/* USER */}
      <Route
        path="/user"
        element={
          <PrivateRoute allowedRoles={["Usuario"]}>
            <UserDashboard />
          </PrivateRoute>
        }
      />

    </Routes>
  );
}
