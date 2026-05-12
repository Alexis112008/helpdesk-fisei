import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children, allowedRoles }) {

  const { user } = useAuth();

  if (!user) {

    return <Navigate to="/" />;

  }

  if (!allowedRoles.includes(user.role)) {

    return <Navigate to="/" />;

  }

  return children;

}

export default PrivateRoute;