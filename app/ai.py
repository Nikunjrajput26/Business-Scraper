"""AI-generated sales angles for scraped leads.

Given a scraped business, ask Claude what services the *user* (an agency /
freelancer / software shop) could realistically pitch to that business — e.g.
"no website found → offer web design", "low review count → reputation
management". Each user brings their own Anthropic API key.
"""

MODEL = "claude-opus-4-8"

SYSTEM_PROMPT = (
    "You help sales teams at digital agencies and software companies. Given a "
    "business scraped from Google Places, suggest concrete services the agency "
    "could pitch to that business and the signal that justifies each. Be specific "
    "and practical (e.g. new website, SEO, Google Ads, custom software, booking "
    "system, reputation management, automation). Reply with 3-4 short bullet "
    "points, each as 'Service — one-line reason tied to the data.' No preamble."
)


def _lead_summary(lead) -> str:
    parts = [
        f"Business name: {lead.business_name or 'unknown'}",
        f"Category: {lead.category or 'unknown'}",
        f"City/Country: {lead.city or '?'}, {lead.country or '?'}",
        f"Rating: {lead.rating or 'none'} ({lead.total_reviews or '0'} reviews)",
        f"Website: {lead.website or 'NONE — no website found'}",
        f"Email on file: {'yes' if lead.email else 'no'}",
        f"Phone on file: {'yes' if lead.phone_number else 'no'}",
    ]
    return "\n".join(parts)


def generate_pitch(lead, api_key: str) -> str:
    """Return AI-suggested service angles for a lead using the user's own
    Anthropic API key. Raises on failure."""
    api_key = (api_key or "").strip()
    if not api_key:
        raise RuntimeError("Add your Anthropic API key in Settings to use AI suggestions.")

    # Imported lazily so the app still boots if the package isn't installed yet.
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=MODEL,
        max_tokens=700,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Here is the business. Suggest services we could sell them:\n\n"
                    + _lead_summary(lead)
                ),
            }
        ],
    )
    return "".join(block.text for block in message.content if block.type == "text").strip()
