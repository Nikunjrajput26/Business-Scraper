import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { api } from "../../api";

/**
 * Renders the pricing tiers. Two modes:
 *  - Marketing (default): each CTA navigates to /app to sign up.
 *  - Billing: pass `currentPlan` + `onSelect(planId)` to switch plans in place.
 */
export default function PlanCards({ currentPlan, onSelect, busyPlan }) {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const billingMode = typeof onSelect === "function";

  useEffect(() => {
    api
      .getPlans()
      .then(setPlans)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!plans.length) return <div className="mkt-muted">Loading plans…</div>;

  return (
    <div className="plan-grid">
      {plans.map((plan) => {
        const isCurrent = billingMode && currentPlan === plan.id;
        const highlighted = plan.id === "pro";
        return (
          <div key={plan.id} className={`plan-card${highlighted ? " featured" : ""}`}>
            {highlighted && <span className="plan-badge">Most popular</span>}
            <h3>{plan.name}</h3>
            <div className="plan-price">
              {plan.price_monthly === 0 ? (
                <span className="plan-amount">Free</span>
              ) : (
                <>
                  <span className="plan-amount">${plan.price_monthly}</span>
                  <span className="plan-per">/mo</span>
                </>
              )}
            </div>
            <p className="plan-tagline">{plan.tagline}</p>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>
                  <Check size={15} strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            {billingMode ? (
              <button
                className={isCurrent ? "btn-secondary" : ""}
                disabled={isCurrent || busyPlan === plan.id}
                onClick={() => onSelect(plan.id)}
              >
                {isCurrent ? "Current plan" : busyPlan === plan.id ? "Switching…" : `Switch to ${plan.name}`}
              </button>
            ) : (
              <button
                className={highlighted ? "" : "btn-secondary"}
                onClick={() => navigate("/app")}
              >
                {plan.price_monthly === 0 ? "Start free" : `Choose ${plan.name}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
