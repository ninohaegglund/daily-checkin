import { CalendarDays, HeartPulse, Leaf, LogOut } from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import CheckInForm from "./components/CheckInForm";
import HeroQuote from "./components/HeroQuote";
import Logo from "./components/Logo";
import ProtectedRoute from "./components/ProtectedRoute";
import StatusBars from "./components/StatusBars";
import StatusPanel from "./components/StatusPanel";
import DailyCheckInPage from "./pages/DailyCheckInPage";
import HistoryPage from "./pages/History";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import { useAuthStore } from "./store/authStore";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link nav-link--active" : "nav-link";

function App() {
  const navigate = useNavigate();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === "authenticated" && user !== null;

  const displayName =
  user?.displayName ||
  user?.email ||
  "User";

  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <section className="app-hero" aria-label="Daily check-in overview">
        <video
          className="hero-media hidden md:block"
          src="/hero2.mp4"
          poster="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="hero-media block md:hidden"
        />
        <div className="hero-overlay" />

        <header className="app-header">
          <Link to="/" className="brand-link" aria-label="Daily Check-In home">
            <Logo />
          </Link>
          <nav className="app-nav" aria-label="Primary navigation">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              History
            </NavLink>
            {isAuthenticated ? (
              <button type="button" className="nav-link nav-button" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </header>

       <div className="hero-content">
          <span className="hero-kicker">
            <HeartPulse className="h-4 w-4" />
            Wellness dashboard
          </span>

          <h1>Daily Check-In</h1>

          <p className="hero-greeting">
            {isAuthenticated
              ? `Hello, ${displayName}. Take a moment to check in with your mood, energy, sleep, and daily rhythm.`
              : "A calm place to read today's mood, sleep, stress, energy, movement, and time outside."}
          </p>
   
          <div className="hero-chips" aria-label="Dashboard highlights">
            <span>
              <CalendarDays className="h-4 w-4" />
              {todayLabel}
            </span>
            <span>
              <Leaf className="h-4 w-4" />
              Mindful tracking
            </span>
          </div>
          <HeroQuote />
        </div>
      </section>

      <main className="main-content">
        <div className="dashboard-container">
          <Routes>
            <Route
              path="/login"
              element={
                <div className="dashboard-single">
                  <LoginPage />
                </div>
              }
            />
            <Route
              path="/register"
              element={
                <div className="dashboard-single">
                  <RegisterPage />
                </div>
              }
            />
            <Route
              element={<ProtectedRoute />}
            >
              <Route
                path="/"
                element={
                  <div className="dashboard-grid">
                    <div className="dashboard-primary">
                      <CheckInForm />
                    </div>
                    <aside className="dashboard-sidebar" aria-label="Status dashboard">
                      <StatusBars />
                      <StatusPanel />
                    </aside>
                  </div>
                }
              />
              <Route
                path="/history"
                element={
                  <div className="dashboard-single">
                    <HistoryPage />
                  </div>
                }
              />
              <Route
                path="/api"
                element={
                  <div className="dashboard-single">
                    <DailyCheckInPage />
                  </div>
                }
              />
            </Route>
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
