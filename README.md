# Compass — SSD Delivery Console

An AI-native, single-pane console that unifies the Delivery Partner lifecycle for Success
Services Delivery (SSD), reading and writing **SSD IQ**, a governed System of Records.

This repository is the **prototype** (phase 0): a clickable, front-end-only console driven
entirely by **fictional mock data**, with AI features **simulated** by deterministic,
data-driven responses that are clearly labelled as AI-generated. No integrations, auth,
persistence, or real data.

## Run it

No install and no build step. You need Node.js only to run the tiny static server.

```powershell
node serve.mjs
```

Then open http://localhost:5173. (`npm start` is an alias and installs nothing.)

## What's built

The prototype is **feature-complete** across all modules (no dead ends):

- **Shell** — Fluent 2 / Microsoft 365 look: 48px command bar (SSD IQ search, Ask Copilot,
  notifications, **light/dark theme toggle**, role switcher), 260px collapsible nav rail, and a docked
  contextual **Copilot** panel on every screen.
- **Role switcher — 11 personas across three orgs:** SSD (WW Lead, TZ Lead, CSA Manager, POD Lead,
  Business Manager, CSA), CSAM Innovation (IP Lead, Adoption Lead), and Delivery Partner (Partner CSA,
  SDM, Operations Manager). Nav and permissions change per persona; Performance & PIPs is confidential
  and role-gated.
- **Delivery Cockpit (Home)** — role-aware KPIs, AI daily briefing, needs-attention list, charts,
  SSD Leadership org and POD health tiles.
- **Delivery** — Engagements & Dispatch (best-fit CSA + Day 0–3 outreach), Reports Pending / T-3W
  proactive tracking, Agentic Delivery (AI-drafted deliverables + IP library).
- **Workforce & partners** — PODs & People (202 FTC records; 34 POD Leads — ATZ 15, EMEA 12, ASIA 7;
  org hierarchy WW→TZ→CSA Manager→POD Lead), Capacity &
  Forecasting (forecast, coverage, **HC Tracking** and **Hiring Progress**), Partner CSA Lifecycle,
  Delivery Partners, Enablement (accreditations, Service Catalogue, S500, SDM onboarding, User Voice,
  shadowing).
- **Quality & risk** — Quality & CPE (checks + mock deliveries), Escalations & Actions, Performance &
  PIPs (confidential), D365-inspired seven-level Sentiment monitoring with topics and supervisor alerts.
- **Comms & insight** — Messages Console, engagement/VSAT-linked **Success Stories** with official
  SDM/POD/leadership review, SharePoint metadata, LT approval and PowerPoint-template export,
  Reporting (1,300 delivered engagements across the latest five months; native SSD MBR health
  scorecard, execution/readiness/quality/financials/strategy,
  Territory/OU Ops, partner + internal MBRs, ask-your-data).
- **SSD IQ — System of Records** — catalog of all governed entities (partners, PODs, CSAs, engagements,
  success stories, deliveries, escalations, actions, CPE, messages, PIPs, sentiment, hiring requisitions) with record
  drawers, relationships, source-of-truth badges, audit trail, NL search and data-quality flags.
- **Capabilities** — a live map of delivery capabilities and their coverage.

### Domain model
Services are organised as **Families (Tracks) → Programs** (each Program = one accreditation): Health,
AI Innovation, Cloud Deployment, Foundations. CSAs carry **accreditations** and **languages** and can
deliver in **any territory** (language is the coverage constraint). Territories roll up to **time zones**
globally and to **OUs** in the US.

## Stack

Vanilla JavaScript ES modules · hand-written CSS with light **and dark** themes (Fluent 2 look) ·
Chart.js (vendored) · zero-dependency Node static server. Chosen so the prototype runs in a locked-down
environment with no package install — a **phase-0 constraint, not the production stack**.

## Production specifications

Build-ready, reverse-engineered specs live in **[`specs/`](specs/README.md)** (product overview,
architecture, data & system of record, integrations, security, AI, NFRs, KPIs, roadmap, and one file
per capability). They supersede the earlier `docs/domains/` set.

## Responsible AI

Every AI output is labelled and, where possible, links to the source records. AI is advisory
and human-in-the-loop — it never makes an automated adverse decision about a person. In
production, `scripts/ai.js` is replaced by Azure OpenAI grounded over SSD IQ (see
[`specs/05-ai-and-copilot-platform.md`](specs/05-ai-and-copilot-platform.md)).