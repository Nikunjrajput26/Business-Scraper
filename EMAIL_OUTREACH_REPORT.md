# Automated Email Outreach — Feasibility & Build Report

## 1. What's being asked

For each scraped lead that has an email, generate a personalized message (using business name,
category, city, rating, etc.) and send it automatically — turning the scraper into a full
prospecting → outreach pipeline.

This is buildable. It is also the part of the product most likely to get you in legal or
deliverability trouble if done carelessly, so this report front-loads those constraints before
the architecture.

## 2. Compliance constraints (read this first)

- **CAN-SPAM (US)**, **India IT Act / 2011 SPDI rules**, and **GDPR (if any EU lead)** all apply
  depending on where leads are located. Common baseline requirements across all of them:
  - Accurate sender identity (real company name, real reply-to address, physical address in
    footer for CAN-SPAM).
  - A working, honored **unsubscribe/opt-out** mechanism — and you must suppress that address
    going forward.
  - No deceptive subject lines or forged headers.
  - B2B cold email is broadly tolerated in the US/India if it's relevant and easy to opt out of;
    it is *not* safe in the EU/UK (GDPR treats this as direct marketing requiring a legal basis —
    "legitimate interest" is a thin defense for cold outreach to scraped contacts).
- **Recommendation:** scope v1 to leads in India/US, add a country/region filter before sending,
  and require an explicit unsubscribe link in every email.
- **Deliverability risk:** sending from your own app server's IP via raw SMTP will get flagged as
  spam almost immediately (no sending reputation, no SPF/DKIM/DMARC history). You need a
  transactional/marketing ESP (SendGrid, Mailgun, Amazon SES, Postmark) with your domain's SPF/
  DKIM/DMARC records configured, and you need to warm up sending volume gradually (don't blast
  all 60-100 leads from a new domain in one batch).
- **Reputation risk to the underlying business:** if you're sending on behalf of users of this
  SaaS, one user's bad campaign (high spam-complaint rate) can damage deliverability for everyone
  sharing the sending domain. Plan for per-user dedicated subdomains or a 3rd-party ESP's
  multi-tenant reputation isolation (e.g., SendGrid subuser model).

## 3. Recommended architecture

```
Leads (existing)                Outreach module (new)
─────────────────                ───────────────────────
Run → Lead[] with email   ───►   Campaign (template + filters)
                                       │
                                       ▼
                                  Recipient queue (per-lead, status: pending/sent/failed/bounced/unsubscribed)
                                       │
                                       ▼
                                  Send worker (rate-limited, via ESP API)
                                       │
                                       ▼
                                  ESP webhook → update status (delivered/opened/bounced/complained/unsubscribed)
```

### New data model
- `Campaign`: id, user_id, name, subject_template, body_template, status, created_at.
- `CampaignRecipient`: id, campaign_id, lead_id, status, sent_at, opened_at, error_message,
  unsubscribe_token.
- `SuppressionList`: email (unique), reason (unsubscribed/bounced/complained), created_at —
  checked before every send, persists across campaigns.

### Personalization
Simple Jinja2-style template with variables already in your `Lead` model: `{{business_name}}`,
`{{category}}`, `{{city}}`, `{{rating}}`. No need for an LLM to "write" each email unless you
want subject-line or opening-line variation — a templated approach is safer, more predictable,
and avoids hallucinated claims about the business.

### Sending
- Use an ESP SDK (e.g., `sendgrid` or `boto3` for SES) from a background job (extend your
  existing `BackgroundTasks` pattern in `app/jobs.py`).
- Rate-limit sends (e.g., 1 every 2-3 seconds, batched) to mimic human sending patterns and avoid
  provider throttling.
- Skip any lead whose email is in `SuppressionList` or whose domain bounced previously.
- Every email includes a one-click unsubscribe link (`/unsubscribe/{token}`) that adds the email
  to `SuppressionList` — no login required.

### Tracking
- ESP webhooks (delivered, bounced, complained, opened) hit a new `/webhooks/esp` endpoint that
  updates `CampaignRecipient.status`.
- Surface campaign stats (sent / opened / bounced / unsubscribed) in the dashboard, same visual
  language as the existing stat cards.

## 4. Phased build plan

1. **Phase 1 — Manual-send MVP**: Campaign + template builder UI, recipient queue built from a
   Run's leads, "Send" button triggers a background job using SES/SendGrid, includes unsubscribe
   link and suppression list. No tracking yet.
2. **Phase 2 — Compliance & deliverability hardening**: SPF/DKIM/DMARC setup docs, country filter,
   physical address footer, bounce/complaint webhook handling, per-user send-rate caps.
3. **Phase 3 — Tracking & iteration**: open/click tracking, campaign stats dashboard, A/B subject
   lines.
4. **Phase 4 (optional)** — LLM-assisted copy variation per lead (e.g., one line referencing their
   category/rating), with a human-in-the-loop preview step before send, not full autopilot.

## 5. What I'd build first if you give the go-ahead

Phase 1, scoped down further: a "Send Campaign" action on a completed Run that takes a
subject/body template with `{{business_name}}` style placeholders, sends via a single ESP
(recommend **SendGrid** — generous free tier, simple API, built-in suppression management so you
get a lot of Phase 2 for free), and shows a simple sent/failed count. I'd skip building your own
bounce/suppression handling initially and lean on SendGrid's built-in suppression groups instead
— much less to get wrong.

## 6. Decisions for this build

- **ESP**: SendGrid (no existing account — you'll need to sign up and get an API key before
  sending works; verification steps in section 7).
- **Domain**: you own a domain, so we'll configure SPF/DKIM/DMARC for it during setup — this is
  required for SendGrid to authenticate sends as coming from you, not just deliverability polish.
- **Send approval**: defaulting to manual review (Phase 1 shows a preview of each generated email
  before any send goes out) — safer while we validate template output and compliance. Tell me if
  you'd rather skip straight to fully automatic sends.
- **Region scope**: defaulting to India/US leads only for now per the compliance notes in
  section 2 — flag if you need EU leads included.

## 7. What you'll need to do before sending works

1. Create a SendGrid account (free tier covers early testing) and generate an API key.
2. Add the SPF/DKIM/DMARC DNS records SendGrid gives you to your domain's DNS — I can give you
   the exact record format once you share the domain.
3. Give me the API key as an environment variable (`SENDGRID_API_KEY` in `.env`) — never paste it
   directly into chat.

## 8. Next step

Say "build it" and I'll implement Phase 1: the `Campaign`/`CampaignRecipient`/`SuppressionList`
models, the SendGrid integration, the template editor + preview UI, and the unsubscribe endpoint.
