import { Link } from "react-router-dom";
import { Search, Mail, Download, KeyRound, Sparkles, Send, Check, FileSpreadsheet } from "lucide-react";
import MarketingNav from "./MarketingNav";
import PlanCards from "./PlanCards";
import AddonBanner from "./AddonBanner";

// Mirrors the fields the scraper actually returns (see LeadRecord).
const MOCK_LEADS = [
  {
    name: "Sunrise Dental Care", phone: "(512) 555-0142", email: "hello@sunrisedental.com",
    website: "sunrisedental.com", rating: "4.8", reviews: "212", category: "Dentist", city: "Austin",
  },
  {
    name: "BrightPath Plumbing", phone: "(512) 555-0198", email: "info@brightpathplumbing.com",
    website: "brightpathplumbing.com", rating: "4.6", reviews: "143", category: "Plumber", city: "Austin",
  },
  {
    name: "Vertex Fitness Studio", phone: "(512) 555-0177", email: "team@vertexfit.com",
    website: "vertexfit.com", rating: "4.9", reviews: "389", category: "Gym", city: "Austin",
  },
  {
    name: "Maple Leaf Bakery", phone: "(512) 555-0125", email: "orders@mapleleafbakery.co",
    website: "mapleleafbakery.co", rating: "4.7", reviews: "98", category: "Bakery", city: "Austin",
  },
  {
    name: "Cooper & Co Law", phone: "(512) 555-0163", email: "contact@cooperlaw.com",
    website: "cooperlaw.com", rating: "4.5", reviews: "64", category: "Law firm", city: "Austin",
  },
];

const FEATURES = [
  {
    icon: Search,
    title: "Search any market",
    body: "Pull businesses from Google Places by keyword and location — any city, any category, anywhere in the world.",
  },
  {
    icon: Mail,
    title: "Verified contact details",
    body: "We crawl each business website to surface emails and phone numbers, then de-duplicate every list automatically.",
  },
  {
    icon: Sparkles,
    title: "AI service suggestions",
    body: "For every lead, AI tells you what services you could pitch them — new website, SEO, automation — based on their data. Bring your own Anthropic, OpenAI, or Gemini key.",
  },
  {
    icon: Send,
    title: "Email outreach, built in",
    body: "Connect your own Gmail / SMTP and send personalized outreach to leads straight from the dashboard — no copy-paste, no extra tool.",
  },
  {
    icon: Download,
    title: "One-click CSV export",
    body: "Download clean, ready-to-use lead lists you can drop straight into your CRM or spreadsheet.",
  },
  {
    icon: KeyRound,
    title: "Bring your own keys",
    body: "Plug in your own Google Places key for unlimited scraping, and your own AI/email keys — you stay in control of cost and data.",
  },
];

export default function Landing() {
  return (
    <div className="mkt">
      <MarketingNav />

      {/* Hero — centered copy, full-width spreadsheet below */}
      <section className="mkt-hero home">
        <div className="mkt-hero-copy">
          <span className="mkt-eyebrow">
            <span className="dot" />
            Lead generation, on autopilot
          </span>
          <h1>
            Type a city.<br />
            Get a <span className="grad-text">qualified lead list.</span>
          </h1>
          <p className="sub">
            Search Google Places by keyword and location, enrich every business with verified
            emails and phone numbers, then export a ready-to-call CSV — in minutes.
          </p>

          <div className="mkt-search">
            <Search size={18} strokeWidth={2} className="mkt-search-ic" />
            <input value="dentists in Austin" readOnly aria-label="Example search" />
            <Link to="/app" className="mkt-btn">
              Generate leads
            </Link>
          </div>

          <div className="mkt-hero-note">
            <Check size={15} strokeWidth={3} />
            No credit card required · 200 free leads to start
          </div>
        </div>

        {/* A spreadsheet of everything we scrape */}
        <div className="mkt-hero-visual">
          <div className="mkt-sheet">
            <div className="mkt-sheet-bar">
              <span className="fname">
                <FileSpreadsheet size={15} strokeWidth={2} />
                leads_dentists_austin.csv
              </span>
              <span className="rows">237 rows · 10 fields</span>
            </div>
            <table className="mkt-sheet-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  <th>Category</th>
                  <th>City</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEADS.map((l) => (
                  <tr key={l.name}>
                    <td className="b">{l.name}</td>
                    <td>{l.phone}</td>
                    <td>{l.email}</td>
                    <td>{l.website}</td>
                    <td className="rt">★ {l.rating}</td>
                    <td>{l.reviews}</td>
                    <td>{l.category}</td>
                    <td>{l.city}</td>
                    <td>USA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mkt-sheet-note">
            <span>
              <Check size={14} strokeWidth={2.5} /> 10 verified fields per lead
            </span>
            <span>
              <Sparkles size={14} strokeWidth={2} /> AI pitch ideas per lead
            </span>
            <span>
              <Send size={14} strokeWidth={2} /> Email outreach built in
            </span>
            <span>
              <Download size={14} strokeWidth={2} /> CSV export
            </span>
          </div>
        </div>
      </section>

      {/* Honest capability strip (no fabricated logos) */}
      <div className="mkt-logos">
        <p>What every search gives you</p>
        <div className="mkt-logos-row">
          <span>Official Google Places data</span>
          <span>Verified emails &amp; phones</span>
          <span>De-duplicated lists</span>
          <span>One-click CSV export</span>
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
      <section className="mkt-how" id="how">
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
              <h3>Get AI ideas &amp; reach out</h3>
              <p>See AI-suggested services to pitch each lead, email them from the app, or export a clean CSV.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capability stats (true product facts, not traction claims) */}
      <section className="mkt-band">
        <div className="mkt-band-inner">
          <div>
            <div className="v">200+</div>
            <div className="k">Countries supported</div>
          </div>
          <div>
            <div className="v">6,000</div>
            <div className="k">Leads / mo on Growth</div>
          </div>
          <div>
            <div className="v">10</div>
            <div className="k">Data fields per lead</div>
          </div>
          <div>
            <div className="v">&lt;2 min</div>
            <div className="k">To your first export</div>
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
