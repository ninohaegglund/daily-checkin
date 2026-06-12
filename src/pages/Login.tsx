import { AlertCircle, LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const getRedirectPath = (search: string) => {
  const redirect = new URLSearchParams(search).get("redirect");
  if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }

  return "/";
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      navigate(getRedirectPath(location.search), { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not log in");
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = error ?? authError;

  return (
    <form onSubmit={handleSubmit} className="dashboard-card auth-card animate-fadeIn">
      <div className="panel-heading">
        <span className="panel-kicker">
          <LogIn className="h-4 w-4" />
          Welcome back
        </span>
        <div>
          <h2>Log in</h2>
          <p>Use your account to sync check-ins and view your stats.</p>
        </div>
      </div>

      <div className="auth-fields">
        <label className="auth-field">
          <span>Email</span>
          <input
            className="wellness-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            className="wellness-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
      </div>

      {displayedError && (
        <div className="form-alert auth-alert" role="alert">
          <AlertCircle className="h-4 w-4" />
          <span>{displayedError}</span>
        </div>
      )}

      <button type="submit" className="primary-action" disabled={submitting}>
        <LogIn className="h-5 w-5" />
        {submitting ? "Logging in..." : "Log in"}
      </button>

      <p className="auth-switch">
        New to Daily Check-In? <Link to={`/register${location.search}`}>Create an account</Link>
      </p>
    </form>
  );
}
