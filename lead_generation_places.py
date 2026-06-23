import argparse
import csv
import os
import re
import time
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

GOOGLE_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"
DEFAULT_OUTPUT_FILE = "lead_data.csv"


@dataclass
class LeadRecord:
    business_name: str
    phone_number: str
    website: str
    address: str
    rating: str
    total_reviews: str
    category: str
    city: str
    country: str
    email: str

    def to_row(self) -> Dict[str, str]:
        return {
            "Business Name": self.business_name,
            "Phone Number": self.phone_number,
            "Website": self.website,
            "Address": self.address,
            "Rating": self.rating,
            "Total Reviews": self.total_reviews,
            "Category": self.category,
            "City": self.city,
            "Country": self.country,
            "Email": self.email,
        }


def create_http_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=4,
        backoff_factor=0.8,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "POST"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def normalize_phone(phone: str) -> str:
    return re.sub(r"\D+", "", phone or "")


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", (name or "").strip().lower())


def get_google_api_key(explicit_api_key: Optional[str] = None) -> str:
    if explicit_api_key and explicit_api_key.strip():
        return explicit_api_key.strip()

    env_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
    if env_key:
        return env_key

    try:
        import streamlit as st

        secret_key = str(st.secrets.get("GOOGLE_PLACES_API_KEY", "")).strip()
        if secret_key:
            return secret_key
    except Exception:
        pass

    return ""


def parse_search_terms(raw_terms: str) -> List[str]:
    return [term.strip() for term in raw_terms.split(",") if term.strip()]


def parse_user_prompt(prompt: str) -> Tuple[str, str]:
    text = re.sub(r"\s+", " ", (prompt or "").strip())
    if not text:
        return "", ""

    if " in " in text.lower():
        split_index = text.lower().rfind(" in ")
        keyword = text[:split_index].strip()
        location = text[split_index + 4 :].strip()
        return keyword, location

    parts = text.split(" ", 1)
    if len(parts) == 1:
        return parts[0], ""
    return parts[1], parts[0]


def build_search_query(keyword: str, location_query: str) -> str:
    keyword = keyword.strip()
    location_query = location_query.strip()
    if not keyword:
        return location_query
    if not location_query:
        return keyword
    return f"{keyword} in {location_query}"


def google_headers(api_key: str, field_mask: str) -> Dict[str, str]:
    return {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": field_mask,
    }


def fetch_places(
    session: requests.Session,
    api_key: str,
    keyword: str,
    location_query: str,
    progress_cb: Optional[Callable[[str], None]] = None,
) -> List[Dict]:
    """
    Fetch candidate places from Google Places Text Search with pagination.
    """
    results: List[Dict] = []
    page_token = ""
    page_num = 0
    field_mask = "places.id,places.displayName,nextPageToken"

    while True:
        payload: Dict[str, object] = {
            "textQuery": build_search_query(keyword, location_query),
            "pageSize": 20,
        }
        if page_token:
            payload["pageToken"] = page_token
            time.sleep(2.0)

        try:
            response = session.post(
                GOOGLE_TEXT_SEARCH_URL,
                json=payload,
                headers=google_headers(api_key, field_mask),
                timeout=35,
            )
            response.raise_for_status()
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise RuntimeError(f"Google Text Search failed for '{keyword}': {exc}") from exc

        page_places = data.get("places", [])
        results.extend(page_places)
        page_token = data.get("nextPageToken", "")
        page_num += 1

        if progress_cb:
            progress_cb(
                f"Google Text Search page {page_num} for '{keyword}' returned {len(page_places)} results."
            )

        if not page_token or page_num >= 3:
            break

    return results


def extract_city_country(address_components: List[Dict], fallback_location: str) -> Tuple[str, str]:
    city = ""
    country = ""
    for component in address_components or []:
        types = component.get("types", [])
        long_text = component.get("longText") or component.get("long_name") or ""
        if not city and (
            "locality" in types or "administrative_area_level_2" in types
        ):
            city = long_text
        if "country" in types:
            country = long_text

    if not city:
        city = fallback_location
    return city, country


def fetch_place_details(
    session: requests.Session,
    api_key: str,
    place_id: str,
    fallback_category: str,
    fallback_location: str,
) -> Optional[LeadRecord]:
    field_mask = ",".join(
        [
            "id",
            "displayName",
            "formattedAddress",
            "rating",
            "userRatingCount",
            "types",
            "websiteUri",
            "nationalPhoneNumber",
            "internationalPhoneNumber",
            "addressComponents",
        ]
    )

    try:
        response = session.get(
            GOOGLE_PLACE_DETAILS_URL.format(place_id=place_id),
            headers=google_headers(api_key, field_mask),
            timeout=35,
        )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        print(f"[WARN] Google Place Details failed for {place_id}: {exc}")
        return None

    display_name = data.get("displayName", {})
    business_name = display_name.get("text", "") if isinstance(display_name, dict) else ""
    city, country = extract_city_country(data.get("addressComponents", []), fallback_location)

    return LeadRecord(
        business_name=business_name.strip(),
        phone_number=str(
            data.get("nationalPhoneNumber") or data.get("internationalPhoneNumber") or ""
        ).strip(),
        website=str(data.get("websiteUri", "")).strip(),
        address=str(data.get("formattedAddress", "")).strip(),
        rating=str(data.get("rating", "")).strip(),
        total_reviews=str(data.get("userRatingCount", "")).strip(),
        category=fallback_category or ", ".join(data.get("types", [])[:2]),
        city=city.strip(),
        country=country.strip(),
        email="",
    )


def extract_emails_from_text(text: str) -> Set[str]:
    email_regex = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    matches = re.findall(email_regex, text or "")
    filtered: Set[str] = set()
    for email in matches:
        cleaned = email.strip(".,;:()[]{}<>").lower()
        if cleaned.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")):
            continue
        filtered.add(cleaned)
    return filtered


CONTACT_LINK_KEYWORDS = ("contact", "about", "support", "reach", "get-in-touch", "enquir", "inquir")
CONTACT_PATH_GUESSES = (
    "contact",
    "contact-us",
    "contactus",
    "about",
    "about-us",
    "aboutus",
    "support",
)


def _discover_contact_links(base_url: str, html: str, limit: int = 5) -> List[str]:
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        return []

    found: List[str] = []
    seen: Set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if not href or href.startswith(("javascript:", "#")):
            continue
        link_text = (anchor.get_text() or "").lower()
        haystack = f"{href.lower()} {link_text}"
        if not any(keyword in haystack for keyword in CONTACT_LINK_KEYWORDS):
            continue
        absolute = urljoin(base_url, href)
        if absolute in seen:
            continue
        seen.add(absolute)
        found.append(absolute)
        if len(found) >= limit:
            break
    return found


def _extract_mailto_emails(html: str) -> Set[str]:
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        return set()

    emails: Set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if href.lower().startswith("mailto:"):
            address = href[7:].split("?")[0].strip()
            if address:
                emails.add(address.lower())
    return emails


def scrape_emails_for_website(session: requests.Session, website_url: str) -> str:
    if not website_url:
        return ""

    base = website_url.rstrip("/") + "/"
    found_emails: Set[str] = set()
    visited: Set[str] = set()
    headers = {"User-Agent": "Mozilla/5.0 (compatible; LeadGenBot/1.0)"}

    def fetch(url: str) -> Optional[str]:
        if url in visited:
            return None
        visited.add(url)
        try:
            resp = session.get(url, timeout=8, headers=headers)
            if resp.status_code >= 400:
                return None
            return resp.text
        except requests.RequestException:
            return None

    homepage_html = fetch(website_url)
    discovered_links: List[str] = []
    if homepage_html:
        found_emails.update(extract_emails_from_text(homepage_html))
        found_emails.update(_extract_mailto_emails(homepage_html))
        discovered_links = _discover_contact_links(website_url, homepage_html)

    pages_to_try = (discovered_links + [urljoin(base, path) for path in CONTACT_PATH_GUESSES])[:4]

    for url in pages_to_try:
        html = fetch(url)
        if not html:
            continue
        found_emails.update(extract_emails_from_text(html))
        found_emails.update(_extract_mailto_emails(html))

    return "; ".join(sorted(found_emails))


def save_to_csv(records: List[LeadRecord], output_file: str) -> None:
    if not records:
        return

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "Business Name",
                "Phone Number",
                "Website",
                "Address",
                "Rating",
                "Total Reviews",
                "Category",
                "City",
                "Country",
                "Email",
            ],
        )
        writer.writeheader()
        for record in records:
            writer.writerow(record.to_row())


def run_pipeline(
    search_terms: List[str],
    location_query: str,
    output_file: str = DEFAULT_OUTPUT_FILE,
    include_email_scrape: bool = True,
    api_key: Optional[str] = None,
    save_output: bool = True,
    max_records: int = 1500,
    progress_cb: Optional[Callable[[str], None]] = None,
) -> List[LeadRecord]:
    env_path = ".env" if os.path.exists(".env") else ".env.example"
    load_dotenv(dotenv_path=env_path)
    session = create_http_session()
    resolved_api_key = get_google_api_key(api_key)

    if not resolved_api_key:
        raise RuntimeError("Missing GOOGLE_PLACES_API_KEY.")
    if not search_terms:
        raise RuntimeError("No search terms provided.")
    if not location_query.strip():
        raise RuntimeError("Location is required.")

    if progress_cb:
        progress_cb(f"Using Google Places for location: {location_query}")

    final_records: List[LeadRecord] = []
    seen_names: Set[str] = set()
    seen_phones: Set[str] = set()
    seen_place_ids: Set[str] = set()

    for term in search_terms:
        term_clean = term.strip()
        if not term_clean:
            continue

        if progress_cb:
            progress_cb(f"Fetching places for: {term_clean}")

        places = fetch_places(
            session=session,
            api_key=resolved_api_key,
            keyword=term_clean,
            location_query=location_query,
            progress_cb=progress_cb,
        )

        for place in places:
            if len(final_records) >= max_records:
                break

            place_id = place.get("id", "").strip()
            if not place_id or place_id in seen_place_ids:
                continue

            record = fetch_place_details(
                session=session,
                api_key=resolved_api_key,
                place_id=place_id,
                fallback_category=term_clean,
                fallback_location=location_query,
            )
            if not record or not record.business_name:
                continue

            phone_key = normalize_phone(record.phone_number)
            name_key = normalize_name(record.business_name)
            if phone_key and phone_key in seen_phones:
                continue
            if name_key and name_key in seen_names:
                continue

            if include_email_scrape and record.website:
                record.email = scrape_emails_for_website(session, record.website)

            final_records.append(record)
            seen_place_ids.add(place_id)
            if phone_key:
                seen_phones.add(phone_key)
            if name_key:
                seen_names.add(name_key)

        if len(final_records) >= max_records:
            if progress_cb:
                progress_cb(f"Reached max_records={max_records}, stopping early.")
            break

    if save_output:
        save_to_csv(final_records, output_file)
    return final_records


def main() -> None:
    parser = argparse.ArgumentParser(description="Universal Google Places lead scraper")
    parser.add_argument("--prompt", default="", help="Example: 'vadodara fridge' or 'it company in uae'")
    parser.add_argument("--location", default="", help="City/State/Country, for example 'Vadodara, India'")
    parser.add_argument("--terms", default="", help="Comma separated search terms, e.g. 'fridge, refrigerator repair'")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_FILE, help="CSV output path")
    parser.add_argument("--api-key", default="", help="Google Places API key")
    parser.add_argument("--max-records", type=int, default=1500)
    parser.add_argument("--no-email", action="store_true", help="Disable website email scraping")
    args = parser.parse_args()

    terms = parse_search_terms(args.terms)
    location = args.location.strip()
    if args.prompt:
        parsed_term, parsed_location = parse_user_prompt(args.prompt)
        if parsed_term and not terms:
            terms = [parsed_term]
        if parsed_location and not location:
            location = parsed_location

    if not terms:
        raise RuntimeError("Provide --terms or --prompt with a searchable business keyword.")
    if not location:
        raise RuntimeError("Provide --location or --prompt with location information.")

    run_pipeline(
        search_terms=terms,
        location_query=location,
        output_file=args.output,
        include_email_scrape=not args.no_email,
        api_key=args.api_key,
        save_output=True,
        max_records=args.max_records,
        progress_cb=lambda m: print(f"[INFO] {m}"),
    )

    print(f"[INFO] Done. Output saved to {args.output}")


if __name__ == "__main__":
    main()
