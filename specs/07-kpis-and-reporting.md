# 07 — KPIs & Reporting

> The KPI catalog (definitions, formulas, targets) and the reporting surfaces: Executive View,
> Territory Ops (inclusive of time zones **and** US OUs), and the two MBRs (Delivery Partner + internal
> SSD Business). These double as the console's headline metrics.

## 1. KPI catalog

Formulas from the prototype (`scripts/store.js → computeKpis`), "now" pinned in the prototype to
`2026-07-28T09:00:00Z`. Production computes these server-side over SSD IQ / Fabric.

| KPI | Definition / formula | Target |
|---|---|---|
| **Global deliveries completed** | Count of completed deliveries per partner/period | Growth period-over-period |
| **On-time delivery %** | deliveries with `completedDate ≤ dueDate` / total deliveries | ≥ 90% |
| **Rolling CPE** | mean(`cpe.score`), 1 dp | ≥ 4.4 / 5 |
| **Active engagements** | count(status ∈ {assigned, in-delivery}) | — (volume) |
| **Open escalations** | count(status ≠ resolved) | Trending down |
| **SLA breaches** | open escalations where `hoursSince(opened) > slaHours` | 0 |
| **Mean time to resolve** | mean(resolved − opened) | Within track SLA |
| **Utilization** | mean(active CSA `utilization`) | 80–90% band |
| **Net sentiment** | mean(net) of partner sentiment rollups (period) | ≥ 0 and rising |
| **Onboarding time-to-productive** | onboarding start → readiness sign-off | Trending down |
| **Proactive coverage (T-3W)** | in-window engagements with outreach started / in-window | ≥ 80% |
| **QC pass rate** | QCs ≥ 4/5 / total QCs | ≥ 80% |
| **S500 eligibility rate** | eligible / active CSAs | Increase |
| **Coverage gaps** | program × time-zone cells with 0 CSAs | 0 |

## 2. Reporting surfaces

### 2.1 Executive View
Portfolio scorecard for Success Programs (the FY-scope executive dashboard). KPI grid + AI executive
summary + charts: deliveries by month, CPE trend, deliveries by program/time-zone/partner, escalations
by severity. **Bind to the real Power BI executive dataset** in production (the prototype view is
representative). Spec: [CAP-17](capabilities/CAP-17-reporting-and-mbr.md).

### 2.2 Territory Ops (operational, inclusive)
Group operations by **Time Zone**, **Territory (Region / OU)**, **Partner**, or **Success Program**,
with combinable filters (TZ, program, partner, status). Per-group operational metrics (engagements,
active, at-risk, on-time, open esc, SLA breach, CSAs, utilization, CPE) + AI operational summary.
**US territories roll up to OUs** — the grouping is inclusive of both TZ and OU. Requirement source:
the explicit ask to "add the perspective of the Territory… in the US territories are OUs, be inclusive…
flexibility to select any filter… the perspective should be operational."

### 2.3 Delivery Partner MBR (external)
Per-partner, per-period Monthly Business Review: executive summary (KPIs + AI narrative), delivery
volume by program, CPE, escalations/risk, highlights, next steps. **Export to PowerPoint** is a
committed production requirement (top User Voice ask). Template source: the partner MBR proposal
provided by the business.

### 2.4 SSD Business MBR (internal)
Internal monthly review: portfolio KPIs + AI executive summary, delivery performance, delivery by
territory (TZ), escalations/operational risk, workforce & capacity, priorities. Template source: the
internal FY MBR deck provided by the business.

### 2.5 Ask-your-data
NL questions answered from SSD IQ with sources (e.g. "CPE trend for <partner>", "open escalations",
"utilization", "on-time delivery"). Production: RAG with citations. See [05 — AI](05-ai-and-copilot-platform.md).

## 3. Reporting requirements

- **FR-REPORT-1** — Executive View binds to the real Power BI/warehouse dataset (RLS aligned to RBAC/TZ/OU).
- **FR-REPORT-2** — Territory Ops supports grouping by TZ / Region-OU / Partner / Program with combinable filters.
- **FR-REPORT-3** — US OU hierarchy is first-class (not only region-as-proxy).
- **FR-REPORT-4** — Partner MBR and internal Business MBR generate as sectioned, presentation-quality
  documents; **export to PowerPoint/PDF**.
- **FR-REPORT-5** — Ask-your-data returns grounded answers with citations.
- **FR-REPORT-6** — All figures reconcile to the Power BI source of truth.
- **FR-REPORT-7** — Reports/MBRs are role-scoped; partner MBRs contain only that partner's data.

## 4. Prototype → production gaps

- [ ] Bind Executive View to the **real** Power BI dataset (remove "representative").
- [ ] First-class **US OU** hierarchy for Territory Ops.
- [ ] **MBR export to PowerPoint** + save/share.
- [ ] Scheduled/subscribable reports and MBRs.
- [ ] Server-side KPI aggregation (materialised) for scale.

## 5. References

- Prototype: `scripts/store.js` (`computeKpis`), `scripts/views/reporting.js` (exec/territory/MBR/ask),
  `scripts/ai.js` (`execSummary`, `mbrNarrative`, `askData`).
- Related: [CAP-17 Reporting/Territory/MBR](capabilities/CAP-17-reporting-and-mbr.md),
  [CAP-05 Reports Pending](capabilities/CAP-05-reports-pending-t3w.md), [05 AI](05-ai-and-copilot-platform.md).
