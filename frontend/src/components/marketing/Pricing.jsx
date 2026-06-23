import { Link } from "react-router-dom";
import MarketingNav from "./MarketingNav";
import PlanCards from "./PlanCards";
import AddonBanner from "./AddonBanner";

const FAQS = [
  {
    q: "What counts as a lead?",
    a: "One business record with its contact details. Duplicates found across searches are removed automatically and never count twice.",
  },
  {
    q: "How does the “bring your own API key” add-on work?",
    a: "It's a one-time purchase. Once you add your own Google Places API key in Settings, scrapes run on your Google billing with no monthly lead cap from us — on any plan.",
  },
  {
    q: "What's the difference between Enterprise and the API-key add-on?",
    a: "Enterprise is a managed plan where we provision and run the API for you at unlimited volume. The add-on instead lets you plug in your own key and pay Google directly.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes — switch plans anytime from the Billing tab in your dashboard. Your new quota applies immediately.",
  },
  {
    q: "Do unused leads roll over?",
    a: "Quotas reset each billing period. Need a custom volume? Talk to us and we'll size an Enterprise plan for you.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan gives you 200 leads every month with no credit card required, so you can try the full workflow first.",
  },
];

export default function Pricing() {
  return (
    <div className="mkt">
      <MarketingNav />

      <section className="mkt-hero compact">
        <span className="mkt-eyebrow">
          <span className="dot" />
          Pricing
        </span>
        <h1>
          Pricing that scales with <span className="grad-text">your outreach</span>
        </h1>
        <p className="sub">
          Start free with 200 leads a month. Upgrade for volume, go Enterprise for a managed API, or
          add your own key for unlimited scraping.
        </p>
      </section>

      <section className="mkt-section" style={{ paddingTop: 24 }}>
        <PlanCards />
        <AddonBanner />
      </section>

      <section className="mkt-section" style={{ paddingTop: 0 }}>
        <div className="mkt-section-head">
          <div className="mkt-tag">FAQ</div>
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
        <div className="mkt-cta-inner">
          <h2>Still deciding?</h2>
          <p>Start on the free plan — no card required — and upgrade whenever you're ready.</p>
          <Link to="/app" className="mkt-btn white lg">
            Create free account
          </Link>
        </div>
      </section>

      <footer className="mkt-footer">
        <div className="mkt-footer-base">© {new Date().getFullYear()} Lead Scraper. All rights reserved.</div>
      </footer>
    </div>
  );
}
