import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const location = useLocation();
  const { status, token, user } = useAuthStore();

  if (status === "checking") {
    return (
      <div className="dashboard-card auth-card animate-fadeIn">
        <div className="panel-heading">
          <span className="panel-kicker">Session</span>
          <div>
            <h2>Checking your session</h2>
            <p>Loading your saved check-ins.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
