import os
from datetime import datetime

import pandas as pd
import streamlit as st

from lead_generation_places import get_google_api_key, parse_search_terms, parse_user_prompt, run_pipeline

st.set_page_config(page_title="Universal Lead Scraper", page_icon="??", layout="wide")
st.title("Universal Lead Scraper")
st.caption("Google Places based lead generation for any business niche + any city/country")

with st.sidebar:
    st.subheader("Run Settings")
    has_api_key = bool(get_google_api_key())
    st.caption(
        "Google API key is loaded from the hosting environment."
        if has_api_key
        else "Google API key is not configured on this server."
    )
    include_email = st.checkbox("Scrape emails from website/contact pages", value=True)
    max_records = st.number_input("Max records", min_value=50, max_value=5000, value=1200, step=50)

col1, col2 = st.columns(2)
with col1:
    location = st.text_input("Location (required)", placeholder="Vadodara, India or UAE")
with col2:
    st.write("")

terms_raw = st.text_area(
    "Business keywords (comma-separated)",
    placeholder="electrical contractor, electrical supplier OR fridge repair, refrigerator dealer",
    height=120,
)
prompt = st.text_input(
    "OR quick prompt",
    placeholder="vadodara fridge  OR  it company in uae",
)

run_btn = st.button("Run Scraper", type="primary")

if "results_df" not in st.session_state:
    st.session_state["results_df"] = None
if "export_name" not in st.session_state:
    st.session_state["export_name"] = f"lead_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

if run_btn:
    terms = parse_search_terms(terms_raw)
    parsed_term = ""
    parsed_location = ""
    if prompt.strip():
        parsed_term, parsed_location = parse_user_prompt(prompt)
    if parsed_term and not terms:
        terms = [parsed_term]
    if parsed_location and not location.strip():
        location = parsed_location

    if not location.strip():
        st.error("Location is required.")
    elif not terms:
        st.error("Provide at least one keyword.")
    elif not has_api_key:
        st.error("GOOGLE_PLACES_API_KEY is not configured on this deployment.")
    else:
        log_box = st.empty()
        logs = []

        def log(msg: str) -> None:
            logs.append(msg)
            log_box.code("\n".join(logs[-20:]))

        with st.spinner("Scraping leads..."):
            try:
                records = run_pipeline(
                    search_terms=terms,
                    location_query=location,
                    output_file=st.session_state["export_name"],
                    include_email_scrape=include_email,
                    save_output=False,
                    max_records=int(max_records),
                    progress_cb=log,
                )

                if not records:
                    st.warning(
                        "No records found for that Google Places search."
                    )
                else:
                    df = pd.DataFrame([r.to_row() for r in records])
                    st.session_state["results_df"] = df
                    st.session_state["export_name"] = f"lead_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            except RuntimeError as exc:
                st.error(str(exc))
            except Exception as exc:
                st.exception(exc)

st.markdown("---")
st.subheader("Results")

if st.session_state["results_df"] is not None:
    results_df = st.session_state["results_df"]
    st.success(f"Scraped {len(results_df)} records.")
    st.dataframe(results_df, use_container_width=True)
    st.download_button(
        label="Export as CSV",
        data=results_df.to_csv(index=False).encode("utf-8"),
        file_name=st.session_state["export_name"],
        mime="text/csv",
    )
else:
    st.info("Run a search to see results here, then export as CSV.")
