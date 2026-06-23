import { Link } from "react-router-dom";
import { Search, Mail, Download, KeyRound, Zap, ShieldCheck, Check } from "lucide-react";
import MarketingNav from "./MarketingNav";
import PlanCards from "./PlanCards";
import AddonBanner from "./AddonBanner";

const FEATURES = [
  {
    icon: Search,
    title: "Search any market",
    body: "Pull businesses from Google Places by keyword and location — any city, any category, anywhere in the world.",
  },
  {
    icon: Mail,
    title: "Real contact details",
    body: "We crawl each business website to surface emails and phone numbers, then de-duplicate every list automatically.",
  },
  {
    icon: Download,
    title: "Export in one click",
    body: "Download clean, ready-to-use CSV lead lists you can drop straight into your CRM or outreach tool.",
  },
  {
    icon: Zap,
    title: "Built for volume",
    body: "Background scraping with smart retries and pagination keeps large pulls running while you get on with work.",
  },
  {
    icon: KeyRound,
    title: "Bring your own API key",
    body: "Add the one-time key add-on and scrape with no monthly cap, on your own Google billing and rate limits.",
  },
  {
    icon: ShieldCheck,
    title: "Your data, your control",
    body: "Every search and lead list is tied to your account and exportable whenever you need it. No lock-in.",
  },
];

export default function Landing() {
  return (
    <div className="mkt">
      <MarketingNav />

      {/* Hero */}
      <section className="mkt-hero">
        <span className="mkt-eyebrow">
          <span className="dot" />
          Lead generation, on autopilot
        </span>
        <h1>
          Find your next customer <span className="grad-text">before your competitors do.</span>
        </h1>
        <p className="sub">
          Search Google Places by keyword and location, enrich every business with verified emails
          and phone numbers, and export ready-to-use lead lists in minutes — not days.
        </p>
        <div className="mkt-hero-actions">
          <Link to="/app" className="mkt-btn lg">
            Start free — 200 leads
          </Link>
          <Link to="/pricing" className="mkt-btn ghost lg">
            See pricing
          </Link>
        </div>
        <div className="mkt-hero-note">
          <Check size={15} strokeWidth={3} />
          No credit card required · Cancel anytime
        </div>

        {/* Product mockup */}
        <div className="mkt-mockup">
          <div className="mkt-mockup-bar">
            <i />
            <i />
            <i />
            <span className="url">app.leadscraper.io/dashboard</span>
          </div>
          <div className="mkt-mockup-body">
            <div className="mkt-mock-side">
              <div className="row on" />
              <div className="row" />
              <div className="row" />
              <div className="row" />
            </div>
            <div className="mkt-mock-main">
              <div className="mkt-mock-stats">
                <div className="card">
                  <div className="k">Leads collected</div>
                  <div className="v">4,820</div>
                </div>
                <div className="card">
                  <div className="k">Searches</div>
                  <div className="v">37</div>
                </div>
                <div className="card">
                  <div className="k">With email</div>
                  <div className="v">71%</div>
                </div>
              </div>
              <div className="mkt-mock-table">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div className="tr" key={i}>
                    <div className="cell" style={{ width: i % 2 ? "78%" : "62%" }} />
                    <div className="cell" />
                    <div className={`cell${i % 2 ? " g" : ""}`} />
                    <div className="cell" style={{ width: "40%" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <div className="mkt-logos">
        <p>Trusted by lean teams everywhere</p>
        <div className="mkt-logos-row">
          <span>Northwind</span>
          <span>Acme Co</span>
          <span>Brightside</span>
          <span>Vertex</span>
          <span>Loop</span>
        </div>
      </div>

      {/* Features */}
      <section className="mkt-section" id="features">
        <div className="mkt-section-head">
          <div className="mkt-tag">Features</div>
          <h2>Everything you need to fill your pipeline</h2>
          <p>From the first search to a CSV your sales team can start calling today.</p>
        </div>
        <div className="mkt-feature-grid">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="mkt-feature">
              <div className="mkt-feature-icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mkt-how">
        <div className="mkt-section">
          <div className="mkt-section-head">
            <div className="mkt-tag">How it works</div>
            <h2>Three steps to a full lead list</h2>
          </div>
          <div className="mkt-steps">
            <div className="mkt-step">
              <span className="mkt-step-num">1</span>
              <h3>Describe who you want</h3>
              <p>Type a keyword and a location, like “dentists in Austin” — or paste a few terms at once.</p>
            </div>
            <div className="mkt-step">
              <span className="mkt-step-num">2</span>
              <h3>We scrape &amp; enrich</h3>
              <p>We pull matching businesses and crawl their sites for emails and phone numbers.</p>
            </div>
            <div className="mkt-step">
              <span className="mkt-step-num">3</span>
              <h3>Export &amp; reach out</h3>
              <p>Download a clean, de-duplicated CSV and start your outreach the same day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="mkt-band">
        <div className="mkt-band-inner">
          <div>
            <div className="v">10k+</div>
            <div className="k">Leads scraped</div>
          </div>
          <div>
            <div className="v">200+</div>
            <div className="k">Cities covered</div>
          </div>
          <div>
            <div className="v">98%</div>
            <div className="k">Data accuracy</div>
          </div>
          <div>
            <div className="v">&lt;2 min</div>
            <div className="k">To first export</div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="mkt-section">
        <div className="mkt-quote">
          <blockquote>
            “We replaced a $400/mo data tool with Lead Scraper and pulled 3,000 qualified leads in
            our first week. The CSV exports drop straight into our CRM.”
          </blockquote>
          <div className="who">
            <span className="ava">JM</span>
            <div>
              <div className="n">Jordan Mehta</div>
              <div className="r">Founder, Brightside Agency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mkt-section" id="pricing">
        <div className="mkt-section-head">
          <div className="mkt-tag">Pricing</div>
          <h2>Simple pricing that scales with you</h2>
          <p>Start free. Upgrade for more volume — or add your own API key for unlimited scraping.</p>
        </div>
        <PlanCards />
        <AddonBanner />
      </section>

      {/* CTA */}
      <section className="mkt-cta">
        <div className="mkt-cta-inner">
          <h2>Ready to find your next 200 customers?</h2>
          <p>Create a free account and run your first search in under a minute.</p>
          <Link to="/app" className="mkt-btn white lg">
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mkt-footer">
        <div className="mkt-footer-inner">
          <div>
            <div className="brand">
              <span className="brand-mark">LS</span> Lead Scraper
            </div>
            <p className="blurb">
              Turn Google Places into a ready-to-call lead list, complete with verified contact
              details and one-click CSV export.
            </p>
          </div>
          <div className="mkt-footer-cols">
            <div className="mkt-footer-col">
              <h4>Product</h4>
              <Link to="/#features">Features</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/app">Dashboard</Link>
            </div>
            <div className="mkt-footer-col">
              <h4>Account</h4>
              <Link to="/app">Log in</Link>
              <Link to="/app">Sign up</Link>
            </div>
          </div>
        </div>
        <div className="mkt-footer-base">© {new Date().getFullYear()} Lead Scraper. All rights reserved.</div>
      </footer>
    </div>
  );
}
