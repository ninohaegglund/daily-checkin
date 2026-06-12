import { CalendarDays, HeartPulse, Leaf } from "lucide-react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import CheckInForm from "./components/CheckInForm";
import HeroQuote from "./components/HeroQuote";
import Logo from "./components/Logo";
import StatusBars from "./components/StatusBars";
import StatusPanel from "./components/StatusPanel";
import DailyCheckInPage from "./pages/DailyCheckInPage";
import HistoryPage from "./pages/History";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link nav-link--active" : "nav-link";

function App() {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

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
          </nav>
        </header>

        <div className="hero-content">
          <span className="hero-kicker">
            <HeartPulse className="h-4 w-4" />
            Wellness dashboard
          </span>
          <h1>Daily Check-In</h1>
          <p>
            A calm place to read today's mood, sleep, stress, energy, movement,
            and time outside.
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
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
