import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function MarketingNav() {
  const { user } = useAuth();
  return (
    <header className="mkt-nav">
      <Link to="/" className="brand">
        <span className="brand-mark">LS</span>
        Lead Scraper
      </Link>
      <nav className="mkt-nav-links">
        <Link to="/pricing">Pricing</Link>
        {user ? (
          <Link to="/app" className="mkt-btn">
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/app">Log in</Link>
            <Link to="/app" className="mkt-btn">
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
