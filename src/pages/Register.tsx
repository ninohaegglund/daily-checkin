import { AlertCircle, UserPlus } from "lucide-react";
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, error: authError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register({
        email,
        password,
        displayName: displayName.trim() || undefined,
      });
      navigate(getRedirectPath(location.search), { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not register");
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = error ?? authError;

  return (
    <form onSubmit={handleSubmit} className="dashboard-card auth-card animate-fadeIn">
      <div className="panel-heading">
        <span className="panel-kicker">
          <UserPlus className="h-4 w-4" />
          Start tracking
        </span>
        <div>
          <h2>Create account</h2>
          <p>Save check-ins to your own private stats history.</p>
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
          <span>Display name</span>
          <input
            className="wellness-input"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            className="wellness-input"
            type="password"
            autoComplete="new-password"
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
        <UserPlus className="h-5 w-5" />
        {submitting ? "Creating account..." : "Create account"}
      </button>

      <p className="auth-switch">
        Already have an account? <Link to={`/login${location.search}`}>Log in</Link>
      </p>
    </form>
  );
}
