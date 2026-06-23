import { Link } from "react-router-dom";
import { Search, Mail, Download, KeyRound, Zap, ShieldCheck } from "lucide-react";
import MarketingNav from "./MarketingNav";
import PlanCards from "./PlanCards";

const FEATURES = [
  {
    icon: Search,
    title: "Search any market",
    body: "Pull businesses from Google Places by keyword and location — any city, any category, anywhere.",
  },
  {
    icon: Mail,
    title: "Real contact details",
    body: "We crawl each business website to surface emails and phone numbers, de-duplicated automatically.",
  },
  {
    icon: Download,
    title: "Export in one click",
    body: "Download clean, ready-to-use CSV lead lists you can drop straight into your CRM or outreach tool.",
  },
  {
    icon: KeyRound,
    title: "Bring your own API key",
    body: "On Enterprise, plug in your own Google Places key and scrape with no monthly lead cap.",
  },
  {
    icon: Zap,
    title: "Built for volume",
    body: "Background scraping with retries and pagination keeps large pulls running while you work.",
  },
  {
    icon: ShieldCheck,
    title: "Your data, your control",
    body: "Every search and lead list is tied to your account and exportable whenever you need it.",
  },
];

export default function Landing() {
  return (
    <div className="mkt">
      <MarketingNav />

      <section className="mkt-hero">
        <span className="mkt-eyebrow">Lead generation, on autopilot</span>
        <h1>
          Find your next customer
          <br />
          before your competitors do.
        </h1>
        <p>
          Search Google Places by keyword and location, enrich every business with verified
          emails and phone numbers, and export ready-to-use lead lists in minutes.
        </p>
        <div className="mkt-hero-actions">
          <Link to="/app" className="mkt-btn lg">
            Start free — 200 leads
          </Link>
          <Link to="/pricing" className="mkt-btn ghost lg">
            See pricing
          </Link>
        </div>
        <div className="mkt-hero-stats">
          <div>
            <strong>10k+</strong>
            <span>Leads scraped</span>
          </div>
          <div>
            <strong>200+</strong>
            <span>Cities covered</span>
          </div>
          <div>
            <strong>98%</strong>
            <span>Data accuracy</span>
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-section-head">
          <h2>Everything you need to fill your pipeline</h2>
          <p>From the first search to a CSV your sales team can call today.</p>
        </div>
        <div className="mkt-feature-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="mkt-feature">
              <div className="mkt-feature-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mkt-section mkt-how">
        <div className="mkt-section-head">
          <h2>Three steps to a full lead list</h2>
        </div>
        <div className="mkt-steps">
          <div className="mkt-step">
            <span className="mkt-step-num">1</span>
            <h3>Describe who you want</h3>
            <p>Type a keyword and a location, e.g. “dentists in Austin”.</p>
          </div>
          <div className="mkt-step">
            <span className="mkt-step-num">2</span>
            <h3>We scrape &amp; enrich</h3>
            <p>We pull matching businesses and crawl their sites for contact info.</p>
          </div>
          <div className="mkt-step">
            <span className="mkt-step-num">3</span>
            <h3>Export &amp; reach out</h3>
            <p>Download a clean CSV and start your outreach the same day.</p>
          </div>
        </div>
      </section>

      <section className="mkt-section" id="pricing">
        <div className="mkt-section-head">
          <h2>Simple, scalable pricing</h2>
          <p>Start free. Upgrade when you need more volume — or bring your own API key.</p>
        </div>
        <PlanCards />
      </section>

      <section className="mkt-cta">
        <h2>Ready to find your next 200 customers?</h2>
        <p>Create a free account and run your first search in under a minute.</p>
        <Link to="/app" className="mkt-btn lg">
          Get started free
        </Link>
      </section>

      <footer className="mkt-footer">
        <span>© {new Date().getFullYear()} Lead Scraper</span>
        <div className="mkt-footer-links">
          <Link to="/pricing">Pricing</Link>
          <Link to="/app">Log in</Link>
        </div>
      </footer>
    </div>
  );
}
