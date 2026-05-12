import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import UserDashboard from "./pages/user/UserDashboard";

import PrivateRoute from "./routes/PrivateRoute";

function App() {

  return (

    <Routes>

      <Route
        path="/"
        element={<LoginPage />}
      />

      <Route
        path="/admin"
        element={
          <PrivateRoute
            allowedRoles={["Administrador"]}
          >

            <AdminDashboard />

          </PrivateRoute>
        }
      />

      <Route
        path="/technician"
        element={
          <PrivateRoute
            allowedRoles={["Tecnico"]}
          >

            <TechnicianDashboard />

          </PrivateRoute>
        }
      />

      <Route
        path="/user"
        element={
          <PrivateRoute
            allowedRoles={["Usuario"]}
          >

            <UserDashboard />

          </PrivateRoute>
        }
      />

    </Routes>

  );
}

export default App;