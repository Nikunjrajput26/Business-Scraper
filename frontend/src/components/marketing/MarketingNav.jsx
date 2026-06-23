import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../../AuthContext";

export default function MarketingNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // In-page section links. If we're not on the landing page, route there
  // first, then scroll once it has rendered.
  const goToSection = (id) => (e) => {
    e.preventDefault();
    if (pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToId(id), 80);
    } else {
      scrollToId(id);
    }
  };

  return (
    <>
      <div className="mkt-announce">
        <span className="lead">
          <Sparkles size={14} strokeWidth={2} />
          New — bring your own API key for unlimited leads
        </span>
        <Link to="/pricing">
          See pricing <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>

      <header className="mkt-nav">
        <div className="mkt-nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">LS</span>
            Lead Scraper
          </Link>

          <nav className="mkt-nav-center">
            <a href="/#features" onClick={goToSection("features")}>
              Features
            </a>
            <a href="/#how" onClick={goToSection("how")}>
              How it works
            </a>
            <Link to="/pricing">Pricing</Link>
          </nav>

          <div className="mkt-nav-actions">
            {user ? (
              <Link to="/app" className="mkt-btn">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/app" className="mkt-nav-login">
                  Log in
                </Link>
                <Link to="/app" className="mkt-btn">
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
