import { Link } from "react-router-dom";
import MarketingNav from "./MarketingNav";
import PlanCards from "./PlanCards";

const FAQS = [
  {
    q: "What counts as a lead?",
    a: "One business record with its contact details. Duplicates found across searches are removed automatically and don't count twice.",
  },
  {
    q: "How does “bring your own API key” work?",
    a: "On the Enterprise tier you add your own Google Places API key in Settings. Scrapes then run on your Google billing with no monthly lead cap from us.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes — switch plans anytime from the Billing tab in your dashboard. Your new quota applies immediately.",
  },
  {
    q: "Do unused leads roll over?",
    a: "Quotas reset each billing period. Need a custom volume? Reach out and we'll size a plan for you.",
  },
];

export default function Pricing() {
  return (
    <div className="mkt">
      <MarketingNav />

      <section className="mkt-hero compact">
        <span className="mkt-eyebrow">Pricing</span>
        <h1>Pricing that scales with your outreach</h1>
        <p>Start free with 200 leads a month. Upgrade for volume, or go Enterprise and use your own API key.</p>
      </section>

      <section className="mkt-section">
        <PlanCards />
      </section>

      <section className="mkt-section">
        <div className="mkt-section-head">
          <h2>Frequently asked questions</h2>
        </div>
        <div className="mkt-faq">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="mkt-faq-item">
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mkt-cta">
        <h2>Still deciding?</h2>
        <p>Start on the free plan — no card required — and upgrade whenever you're ready.</p>
        <Link to="/app" className="mkt-btn lg">
          Create free account
        </Link>
      </section>

      <footer className="mkt-footer">
        <span>© {new Date().getFullYear()} Lead Scraper</span>
        <div className="mkt-footer-links">
          <Link to="/">Home</Link>
          <Link to="/app">Log in</Link>
        </div>
      </footer>
    </div>
  );
}
