"""Pricing tier definitions.

Single source of truth for plans, shared by the API (plan selection,
quota enforcement) and surfaced to the marketing site / billing UI.
Edit prices/quotas here and both the backend and frontend follow.

The Enterprise tier is "bring your own API key": once a user saves
their own Google Places key, scrapes run on that key and the monthly
lead quota stops being enforced (see app/jobs.py and app/main.py).
"""

# A quota high enough to be effectively unlimited for BYO-key users.
UNLIMITED_QUOTA = 1_000_000

PLANS = {
    "free": {
        "id": "free",
        "name": "Free",
        "price_monthly": 0,
        "monthly_lead_quota": 200,
        "byo_api_key": False,
        "tagline": "Kick the tyres on real lead data.",
        "features": [
            "200 leads / month",
            "Google Places search by keyword + location",
            "Website email scraping",
            "CSV export",
        ],
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price_monthly": 49,
        "monthly_lead_quota": 5000,
        "byo_api_key": False,
        "tagline": "For agencies and teams shipping outreach weekly.",
        "features": [
            "5,000 leads / month",
            "Everything in Free",
            "Priority scraping queue",
            "De-duplicated lead lists",
            "Email + phone enrichment",
        ],
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise",
        "price_monthly": 199,
        "monthly_lead_quota": UNLIMITED_QUOTA,
        "byo_api_key": True,
        "tagline": "Bring your own Google API key for unlimited volume.",
        "features": [
            "Unlimited leads with your own Google Places API key",
            "Everything in Pro",
            "No monthly lead cap",
            "Use your own Google billing & rate limits",
            "Priority support",
        ],
    },
}

DEFAULT_PLAN = "free"


def get_plan(plan_id: str) -> dict:
    """Return the plan dict for an id, falling back to the default plan."""
    return PLANS.get(plan_id, PLANS[DEFAULT_PLAN])


def plan_quota(plan_id: str) -> int:
    return get_plan(plan_id)["monthly_lead_quota"]


def list_plans() -> list[dict]:
    return list(PLANS.values())
