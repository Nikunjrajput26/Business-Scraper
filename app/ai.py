"""AI-generated sales angles for scraped leads — multi-provider.

Given a scraped business, ask an LLM what services the *user* (an agency /
freelancer / software shop) could realistically pitch to that business — e.g.
"no website found → offer web design", "low review count → reputation
management". Each user brings their own API key and picks their provider
(Anthropic / OpenAI / Google Gemini).
"""

# Default model per provider — edit here to change which model is used.
MODELS = {
    "anthropic": "claude-opus-4-8",
    "openai": "gpt-4o",
    "gemini": "gemini-2.0-flash",
}

PROVIDERS = tuple(MODELS.keys())

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


def normalize_provider(provider: str) -> str:
    p = (provider or "anthropic").strip().lower()
    if p in ("google", "gemini", "google-gemini"):
        return "gemini"
    if p in ("anthropic", "claude"):
        return "anthropic"
    if p in ("openai", "gpt"):
        return "openai"
    return p


def generate_pitch(lead, provider: str, api_key: str) -> str:
    """Return AI-suggested service angles for a lead using the user's own
    API key and chosen provider. Raises RuntimeError on failure."""
    api_key = (api_key or "").strip()
    if not api_key:
        raise RuntimeError("Add your AI API key in Settings to generate suggestions.")

    provider = normalize_provider(provider)
    if provider not in MODELS:
        raise RuntimeError(f"Unsupported AI provider: {provider}")

    user_prompt = (
        "Here is the business. Suggest services we could sell them:\n\n" + _lead_summary(lead)
    )

    if provider == "anthropic":
        return _anthropic(api_key, user_prompt)
    if provider == "openai":
        return _openai(api_key, user_prompt)
    return _gemini(api_key, user_prompt)


def _anthropic(api_key: str, user_prompt: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=MODELS["anthropic"],
        max_tokens=700,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return "".join(b.text for b in message.content if b.type == "text").strip()


def _openai(api_key: str, user_prompt: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model=MODELS["openai"],
        max_tokens=700,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


def _gemini(api_key: str, user_prompt: str) -> str:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODELS["gemini"], system_instruction=SYSTEM_PROMPT)
    resp = model.generate_content(user_prompt)
    return (resp.text or "").strip()
