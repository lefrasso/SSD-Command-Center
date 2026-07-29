# 00 — Product Overview

> Compass is a single, AI-native console that unifies the end-to-end Success Services Delivery (SSD)
> operating model over one governed System of Records (SSD IQ), so delivery leaders spend time coaching
> delivery instead of stitching context across a dozen disconnected tools.

## 1. Vision

Give every POD Lead, Partner CSA, SDM, DPSM and SSD leader **one pane of glass** for the whole
delivery lifecycle — sourcing and onboarding, proactive dispatch and delivery, quality and CPE,
escalations, performance, offboarding, reporting and sentiment — with an AI layer that drafts,
summarizes, scores and flags, while a human stays firmly in control.

## 2. Business context

- **SSD** runs a mature, **partner-led** delivery model: Delivery Partners supply **Partner CSAs**
  who deliver Microsoft Success Programs to customers, alongside Microsoft CSAs, coordinated by **POD
  Leads / CSA Managers**.
- Work is organised into **PODs** — managed groups of CSAs aligned to Success Program tracks and
  regions/territories.
- Delivery is governed contractually via the **MOSA** (Microsoft Outsourced Services Agreement).
- The operating model is strong; the **tooling is fragmented** — SharePoint playbooks, Azure DevOps
  for escalations, Power BI for KPIs, Teams/Outlook for dispatch and outreach, intake forms, and
  hand-built MBR decks. There is **no shared system of records** and reporting is largely manual.

### Problem statement
A POD Lead manages the full Partner CSA lifecycle across many surfaces; context is assembled by hand
and reporting consumes time that should go to coaching delivery. **Compass closes that gap** with one
console and an AI layer, all reading/writing a governed **SSD IQ**.

## 3. Goals & target outcomes

| Goal | Outcome |
|---|---|
| Unify the lifecycle | One console spanning every module; no tool-hopping. |
| Govern the data | SSD IQ as the single source of truth with lineage + quality. |
| Make delivery proactive | Enforce the Day 0–3 / T-3W cadence; prevent pending reports. |
| Automate reporting | One-click MBRs (partner + internal) and ask-your-data. |
| Assist, don't decide | AI drafts/scores/flags; humans decide; confidential data protected. |
| Scale delivery | Capacity/coverage planning; agentic drafting; predictive risk. |

## 4. Personas

| Persona | Role | Primary needs in Compass |
|---|---|---|
| **CSAM** | Customer Success Account Manager | Customer-facing; originates demand. |
| **Partner CSA** | Vendor CSA (Delivery Partner) | Sees assigned engagements, dispatch, messages, own CPE/quality; completes onboarding. |
| **POD Lead / CSA Manager** | Runs the POD | Dispatches, coaches, owns escalations, runs QC, generates MBRs, manages PIPs and offboarding. |
| **SDM** | Service Delivery Manager | Co-owns escalations and action items; monitors partner health; joins MBRs. |
| **DPSM / Operations** | Delivery Partner Service Manager | Sourcing, headcount, onboarding/offboarding, capacity. |
| **CPE Lead** | Experience owner | Experience/quality insight across tracks. |
| **Business LT** | SSD leadership | Portfolio dashboards, CPE/delivery trends, sentiment, escalation heatmap, MBR roll-ups. |

Identity, roles and the full RBAC matrix are in [04 — Security, Privacy & Compliance](04-security-privacy-compliance.md).

## 5. Operating model Compass mirrors

Compass is organised around the lifecycle SSD already operates:

1. **Pre-hiring & strategy** — sourcing, selection, demand strategy, hiring outlook, headcount
   consolidation.
2. **Onboarding** — bootcamp, onboarding plan, role guidance, tools-and-access provisioning, ramp.
3. **Ongoing delivery** — governed by **Proactive Dispatch Management**; a **Day 0–3 outreach cadence**
   owned by the Partner CSA (email primary, Teams courtesy).
4. **Escalation management** — required for all delivery concerns; intake → triage → Azure DevOps
   tracking under KPI/Power BI governance; POD Lead owns.
5. **Offboarding** — vendor validation, access removal, knowledge transfer, key-role coordination.

**Success Programs / tracks:** Scoping (P&E), Customer Health, ESA, AI Innovation, Cloud (governance
moving toward a single dispatch model for AI and Cloud). Experience is measured through **CPE**
(Customer & Partner Experience) with a Proactive Delivery **CPE Recommended Practices** checklist. The
governance heartbeat is the **Delivery Partner MBR** (per partner, per period) plus the internal SSD
Business MBR.

## 6. Capability map

Compass is delivered as the capabilities catalogued in the [README](README.md). Grouped by area:

- **Foundation:** Identity & Access, Delivery Cockpit, SSD IQ Explorer, Compass Copilot.
- **Delivery:** Engagements & Dispatch, Reports Pending & T-3W, Agentic Delivery.
- **Workforce & Partners:** PODs & People, Capacity & Forecasting, Partner CSA Lifecycle, Delivery
  Partners, Enablement.
- **Quality & Risk:** Quality & CPE, Escalations & Actions, Performance & PIPs, Sentiment.
- **Comms & Insight:** Messages Console, Reporting/Territory/MBR.

## 7. Scope

**In scope (production):** the full lifecycle across all capabilities; live integrations; auth; a
governed data platform; grounded AI; RBAC; auditing; accessibility; reporting and MBRs; territory
views inclusive of both time zones and US **OUs**.

**Out of scope (initially):** customer-facing surfaces; automated adverse decisions about individuals
(explicitly prohibited); replacing the systems of record (Compass **federates**, it does not replace
ADO/Power BI/Forms).

**Prototype scope (Phase 0, this repo):** a clickable, front-end-only console with mock data and
simulated AI, to align leadership on the vision. See [09 — Design Decisions & Learnings](09-design-decisions-and-learnings.md)
for which prototype constraints must **not** carry into production.

## 8. Success metrics (summary)

Full catalog with formulas in [07 — KPIs & Reporting](07-kpis-and-reporting.md).

| KPI | Target |
|---|---|
| Global deliveries completed | Growth period-over-period |
| On-time delivery | ≥ 90% |
| CPE (rolling) | ≥ 4.4 / 5 |
| Open escalations | Trending down; none breaching SLA |
| Mean time to resolve | Within track SLA |
| Utilization | 80–90% band |
| Onboarding time-to-productive | Trending down |

## 9. Glossary

| Term | Meaning |
|---|---|
| Compass | The SSD Delivery Console (this product). |
| SSD IQ | The governed System of Records — single source of truth. |
| Partner CSA | Partner Cloud Solution Architect delivering engagements. |
| POD | Managed group of Partner CSAs led by a POD Lead, mapped to region/TZ. |
| Time Zone (TZ) | Americas / EMEA / ASIA — global rollup of regions. |
| OU | US Organizational Unit — inclusive US territory grouping. |
| Track / Success Program | Scoping (P&E), Customer Health, ESA, AI Innovation, Cloud. |
| Day 0–3 outreach | Proactive outreach cadence a CSA runs at engagement start. |
| T-3W | Three-weeks-out proactive window before a report is due. |
| CPE | Customer & Partner Experience score (target ≥ 4.4). |
| Escalation | Tracked delivery concern with severity + SLA, co-owned with an SDM. |
| MBR | Monthly Business Review (partner-facing + internal). |
| PIP | Performance Improvement Plan (confidential). |
| MOSA | Microsoft Outsourced Services Agreement (partner contracting). |
| S500 | Eligibility program (CPE ≥ 4.4, quality ≥ 4.4, tenure ≥ 6 months). |
| DPSM | Delivery Partner Service Manager. |
| SDM | Service Delivery Manager. |

## 10. References

- Original product brief (Phase-0 design brief) — mined from session history.
- Prototype: this repository (`index.html`, `scripts/`, `data/`, `styles/`).
- Superseded prototype specs: [`docs/domains/`](../docs/domains/).
