# Capability: Delivery Cockpit (Home) `CAP-02`

> The role-personalised landing page — "what needs me today" — combining live KPIs, an AI daily
> briefing, a prioritised needs-attention list, portfolio charts and POD health.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-02` |
| Area | Foundation |
| Primary personas | All (content adapts by role) |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/home.js`, `scripts/store.js` |
| Depends on | [CAP-03 SSD IQ](CAP-03-ssd-iq-explorer.md), [05 AI](../05-ai-and-copilot-platform.md), [CAP-01](CAP-01-identity-and-access.md) |

## 1. Problem & outcome

- **Problem:** Users open the console asking "what needs me now?" but must assemble that from many tools.
- **Outcome:** One prioritised, role-aware starting point that deep-links to the right place to act.
- **Value:** Faster triage; less context-switching.

## 2. Functional requirements

- **FR-COCKPIT-1** — Display a role-personalised header (greeting) with **track** and **partner** filters.
- **FR-COCKPIT-2** — Display a KPI grid: Active engagements, On-time %, Rolling CPE, Open escalations
  (+SLA breaches), Utilization, Net sentiment — each colour-toned to its target.
- **FR-COCKPIT-3** — Display an AI **daily briefing** (headline, bullets, anomaly callouts) specific to
  the role.
- **FR-COCKPIT-4** — Display a **needs-attention** list merging SLA-breaching escalations, at-risk
  engagements and new demand, prioritised, each deep-linking to the record.
- **FR-COCKPIT-5** — Display charts: Engagements by status, Sentiment mix, Avg CPE by track.
- **FR-COCKPIT-6** — Display **POD health** tiles: region · TZ · active CSAs, utilization, avg CPE,
  at-risk/open escalations.
- **FR-COCKPIT-7** — Filters shall scope KPIs, attention and charts; leadership sees the SSD Leadership
  org card.
- **FR-COCKPIT-8** — KPIs shall be **server-side aggregated/materialised** in production (not client-computed).
- **FR-COCKPIT-9** — Display an **Action items** card listing **open actions** (assigned from Messages or
  Escalations) with owner, due date, source and status; allow **marking done** in place and
  **deep-linking** to the source thread/escalation. Include an **Open actions** KPI (with overdue count).

## 3. Business rules

- **BR-COCKPIT-1** — Needs-attention priority: 1 = SLA-breaching escalation, 2 = at-risk engagement,
  3 = new demand; ascending; cap 9.
- **BR-COCKPIT-2** — KPI formulas per [07 §1](../07-kpis-and-reporting.md).
- **BR-COCKPIT-3** — Content/scoping adapts to role (Partner CSA → own outreach; SDM → escalations;
  Operations Manager → capacity/onboarding; leadership → portfolio; POD Lead → at-risk + demand).
- **BR-COCKPIT-4** — Open actions = status ≠ done; **overdue** when `due < today`; the Action items card
  respects the track/partner filter and marking done writes through to the Action Item SoT.

## 4. User stories & acceptance criteria

### Story: Situational awareness
- **As a** POD Lead **I want** a prioritised needs-attention list **so that** I act on the highest-risk
  items first.
- **AC:**
  - Given open SLA-breaching escalations exist, When the cockpit loads, Then they appear at the top of
    needs-attention.
  - Given I click an attention item, When it opens, Then I land on that record (deep link).

### Story: Role framing
- **As a** Partner CSA **I want** a briefing about my outreach **so that** I know what to do today.
- **AC:** Given I am a Partner CSA, When the briefing renders, Then it references my assigned
  engagements and pending outreach.

## 5. Data & system of record

Read-only aggregates over SSD IQ (engagements, escalations, deliveries, cpe, csas, sentiment, pods) +
leadership config. No entities owned.

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Daily briefing | role + data | headline/bullets/anomalies + sources | advisory/labelled | [05](../05-ai-and-copilot-platform.md) |
| Sentiment mix | cpe+messages | pos/neu/neg | labelled | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Consumes SSD IQ aggregates; leadership org from config. No external writes.

## 8. NFR & security notes

`NFR-PERF-1/3` (sub-2s, materialised aggregates); role scoping; no confidential data on home.

## 9. KPIs

Surfaces the six headline KPIs plus **Open actions** (with overdue count); targets per [07](../07-kpis-and-reporting.md).

## 10. Open questions & assumptions

- **Q:** Default TZ scope for TZ Leads? **A (assumption):** their TZ; global for WW lead.
- **Q:** Additional attention sources (pending reports, failed QC, sentiment spikes)? **A:** candidates
  for P2.
