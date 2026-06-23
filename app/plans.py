"""Pricing tier + add-on definitions.

Single source of truth for plans, shared by the API (plan selection,
quota enforcement) and surfaced to the marketing site / billing UI.
Edit prices/quotas here and both the backend and frontend follow.

Plans (Free / Starter / Growth / Enterprise) all run on *our* Google
Places API; higher tiers simply lift the monthly lead quota. Enterprise
is a managed, unlimited-volume plan we provision directly.

Separately, the "Bring your own API key" add-on (a one-time purchase)
lets a user plug in their own Google Places key. When a key is saved the
monthly quota stops being enforced (see app/jobs.py and app/main.py).
"""

# A quota high enough to be effectively unlimited.
UNLIMITED_QUOTA = 1_000_000

PLANS = {
    "free": {
        "id": "free",
        "name": "Free",
        "price_monthly": 0,
        "monthly_lead_quota": 200,
        "tagline": "Kick the tyres on real lead data.",
        "cta": "Start free",
        "features": [
            "200 leads / month",
            "Google Places search by keyword + location",
            "Website email scraping",
            "CSV export",
        ],
    },
    "starter": {
        "id": "starter",
        "name": "Starter",
        "price_monthly": 20,
        "monthly_lead_quota": 2000,
        "tagline": "For solo founders and freelancers shipping outreach.",
        "cta": "Choose Starter",
        "features": [
            "2,000 leads / month",
            "Everything in Free",
            "Email + phone enrichment",
            "De-duplicated lead lists",
        ],
    },
    "growth": {
        "id": "growth",
        "name": "Growth",
        "price_monthly": 45,
        "monthly_lead_quota": 6000,
        "tagline": "For agencies and teams running outreach at scale.",
        "cta": "Choose Growth",
        "features": [
            "6,000 leads / month",
            "Everything in Starter",
            "Priority scraping queue",
            "Bulk multi-term searches",
            "Email support",
        ],
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise",
        "price_monthly": None,  # custom / contact sales
        "monthly_lead_quota": UNLIMITED_QUOTA,
        "tagline": "Unlimited volume on a managed API we provision for you.",
        "cta": "Contact sales",
        "features": [
            "Unlimited leads — we provide the API",
            "Everything in Growth",
            "Dedicated onboarding",
            "Higher rate limits & SLAs",
            "Priority support",
        ],
    },
}

DEFAULT_PLAN = "free"

# One-time add-ons (presented separately from the monthly plans).
ADDONS = {
    "byo_api_key": {
        "id": "byo_api_key",
        "name": "Bring Your Own API Key",
        "one_time_price": 99,
        "tagline": "Connect your own Google Places key and scrape with no monthly cap — pay once, use forever.",
        "features": [
            "Unlimited leads on any plan",
            "Runs on your own Google billing & rate limits",
            "Monthly lead cap no longer applies",
            "One-time fee — no recurring cost",
        ],
    },
}


def get_plan(plan_id: str) -> dict:
    """Return the plan dict for an id, falling back to the default plan."""
    return PLANS.get(plan_id, PLANS[DEFAULT_PLAN])


def plan_quota(plan_id: str) -> int:
    return get_plan(plan_id)["monthly_lead_quota"]


def list_plans() -> list[dict]:
    return list(PLANS.values())


def list_addons() -> list[dict]:
    return list(ADDONS.values())
