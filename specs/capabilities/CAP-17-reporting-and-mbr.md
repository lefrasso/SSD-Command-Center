# Capability: Reporting, Territory & MBR `CAP-17`

> Executive Success Programs insights, an operational Territory view (inclusive of time zones **and** US
> OUs), AI-assisted MBRs (Delivery Partner + internal Business), and ask-your-data over SSD IQ.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-17` |
| Area | Comms & Insight |
| Primary personas | WW/TZ Lead, Business Manager, CSA Manager, POD Lead, SDM, Operations Manager, IP/Adoption Lead (MBR requires `run:mbr`) |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/reporting.js`, `scripts/ai.js` (`execSummary`, `mbrNarrative`, `askData`) |
| Depends on | [07 KPIs](../07-kpis-and-reporting.md), [05 AI](../05-ai-and-copilot-platform.md), [03 Integrations](../03-integrations.md) |

## 1. Problem & outcome

- **Problem:** Reporting is manual; MBR decks are hand-built; there's no inclusive operational territory
  read.
- **Outcome:** Live executive + territory views, one-click MBRs (partner + internal) with export, and
  grounded ask-your-data.
- **Value:** Reclaim reporting time; consistent, trustworthy narratives; inclusive territory ops.

## 2. Functional requirements

- **FR-REPORT-1** — **Executive View:** portfolio KPI grid + AI executive summary + charts (deliveries by
  month, CPE trend, by program/TZ/partner, escalations by severity); bind to the real Power BI dataset.
- **FR-REPORT-2** — **Territory Ops:** group by **Time Zone / Territory (Region / OU) / Partner /
  Program** with combinable filters (TZ, program, partner, status); per-group operational metrics + AI
  operational summary.
- **FR-REPORT-3** — First-class **US OU** hierarchy (inclusive of TZ **and** OU).
- **FR-REPORT-4** — **Delivery Partner MBR** (per partner/period): exec summary (KPIs + narrative),
  delivery volume, CPE, escalations/risk, highlights, next steps.
- **FR-REPORT-5** — **SSD Business MBR** (internal): portfolio KPIs + summary, delivery performance,
  delivery by territory, escalations/risk, workforce/capacity, priorities.
- **FR-REPORT-6** — **Export** MBRs to PowerPoint/PDF; save/share.
- **FR-REPORT-7** — **Ask-your-data:** NL questions answered from SSD IQ with sources.
- **FR-REPORT-8** — **POD Lead Report:** a native, POD-Lead-facing operational report (three pages —
  **POD Snapshot**, **CPE/Accreditations/Quality**, **Delivery/Operations**) filterable by POD Lead /
  Date / Supplier / Partner CSA / SDM / RMOT status and default-scoped to the signed-in POD Lead. Fully
  specified in [07 §2.6](../07-kpis-and-reporting.md); surfaces the operational KPIs (requests
  completed/upcoming, reports-pending aging, delivered hours/events, VSAT/DSAT, off-strategy, S500
  readiness, ESXP gaps, 8-week pipeline).

## 3. Business rules

- **BR-REPORT-1** — KPI formulas per [07 §1](../07-kpis-and-reporting.md); on-time = `completedDate ≤ dueDate`.
- **BR-REPORT-2** — Territory grouping metrics filtered by the combined selection; empty groups hidden.
- **BR-REPORT-3** — Partner MBR uses the partner's real records; internal MBR uses portfolio aggregates.
- **BR-REPORT-4** — MBR generation requires `run:mbr`; partner MBRs contain only that partner's data.
- **BR-REPORT-5** — Figures reconcile to the Power BI source of truth.
- **BR-REPORT-6** — **POD Lead Report** fixed-window visuals (rolling 3-month, 8-week pipeline) ignore the
  date filter by design; **RMOT status** is eventually-consistent (it trails the source datasource
  refresh), so pending/complete counts may briefly lag reality and must not be treated as real-time.

## 4. User stories & acceptance criteria

### Story: One-click MBR
- **As a** POD Lead **I want** one-click partner and internal MBRs **so that** I stop building decks by
  hand.
- **AC:**
  - Given a partner + period, When I generate the Delivery Partner MBR, Then a sectioned review is
    produced from that partner's real records; When I export, Then a PowerPoint/PDF is produced.
  - Given I lack `run:mbr`, When I try to generate, Then the action is unavailable.

### Story: Inclusive territory ops
- **As a** TZ/WW lead **I want** to group operations by TZ **or** US OU with any filters **so that** I
  get an inclusive, operational read.
- **AC:** Given I choose "Territory (Region / OU)", When the view renders, Then groups reflect regions/OUs
  with operational metrics (at-risk, SLA breach, on-time, utilization, CPE) per group.

## 5. Data & system of record

Read-only aggregates over SSD IQ + Power BI (executive dataset). MBR outputs persisted with provenance
(production).

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Executive summary | portfolio KPIs | narrative | advisory | [05](../05-ai-and-copilot-platform.md) |
| Operational summary | filtered scope | narrative + SLA pressure | advisory | [05](../05-ai-and-copilot-platform.md) |
| Partner MBR narrative | partner + period | MBR text | advisory | [05](../05-ai-and-copilot-platform.md) |
| Ask-your-data | question | grounded answer + sources | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Power BI (embedded exec/territory, RLS aligned to RBAC/TZ/OU), SSD IQ (aggregates), Office/Graph (MBR
export). See [03](../03-integrations.md).

## 8. NFR & security notes

Figures reconcile to SoT; reports role-scoped; partner MBRs partner-only; export presentation-quality.

## 9. KPIs

Surfaces the full KPI catalog ([07](../07-kpis-and-reporting.md)) sliced by month/program/TZ-OU/partner.

## 10. Open questions & assumptions

- **Q:** Source of the executive dataset? **A (assumption):** the FY Success Programs Power BI/warehouse.
- **Q:** Full US OU tree vs region proxy? **A (assumption):** OU tree needed for the US; regions roll to
  TZ elsewhere.
- **Q:** Is the POD Lead Report rebuilt natively or embedded from Power BI? **A (assumption):** productised
  natively over SSD IQ so it inherits filtering/RBAC/deep-links; the current Power BI report is the
  metric source of truth until then.
