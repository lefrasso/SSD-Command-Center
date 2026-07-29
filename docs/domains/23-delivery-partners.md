# Domain: Delivery Partners

> Delivery Partner (provider) management — scorecards, contracts, onboarding and profiles, governed
> under MOSA.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `delivery-partners` |
| Module route | `#/delivery-partners` |
| Prototype status | Implemented |
| Primary personas | POD Lead, SDM, DPSM, business-lt |
| Source-of-truth systems (target) | MOSA/contracting, SSD IQ |
| Upstream domains (depends on) | SSD IQ (02), Escalations (31), Quality (30) |
| Downstream domains (consumed by) | Lifecycle (22), Enablement (24), Reporting/MBR (41) |
| Prototype source | `scripts/views/partners.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery is executed through **Delivery Partners** (providers such as
  Avanade, Cognizant, HCL). The org must manage each provider's contract, health (CPE, deliveries,
  escalations, utilization), onboarding and roster in one place.
- **Who cares** — DPSMs (provider governance), POD Leads/SDMs (partner health), leaders (portfolio).
- **Definition of done** — Provider scorecards with contract references, health metrics, an onboarding
  checklist per partner, and drill-through into their CSAs and escalations — feeding MBRs.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| DPSM | Manage providers, contracts, onboarding |
| POD Lead / SDM | View partner health, escalations, roster |
| business-lt | View portfolio of partners |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Delivery Partner (DP) | A provider org employing Partner CSAs. |
| MOSA | The contracting vehicle (`contractRef`). |
| Scorecard | Partner health: CPE, deliveries, CSAs, PODs, status. |
| DP onboarding | 6-step provider onboarding checklist. |

## 5. Data model

Primary entity **Partner** (SoT = MOSA/contracting): `name`, `type` (Delivery Partner), `region`,
`cpe` (derived from CSAs), `deliveries`, `status` (active/onboarding), `contractRef`, `podIds[]`.
Related: **CSA** (`partnerId`), **Escalation** (via engagements of the partner's CSAs).

### DP onboarding checklist

MOSA contract signed → Security & compliance review → Tooling & access provisioned → POD alignment &
ramp plan → First CSA cohort onboarded → Go-live sign-off.

## 6. Features (current prototype)

1. **KPIs** — Delivery Partners, Partner CSAs, Avg partner CPE, Onboarding count.
2. **Partner scorecards table** — partner, region, status, CPE, deliveries, CSAs, PODs, contract ref,
   Profile action.
3. **Profile drawer** — status, type, contract; region, CPE, deliveries, partner CSAs (active),
   open escalations, utilization meter; **DP onboarding** checklist.

## 7. User stories

### Epic: Provider governance
- As **a DPSM**, I want a scorecard per Delivery Partner, so that I govern provider health and
  contracts.
- As **a leader**, I want average partner CPE and delivery volume, so that I assess the provider mix.

### Epic: Onboarding
- As **a DPSM**, I want a provider onboarding checklist, so that new partners reach go-live safely.

### Epic: Drill-through
- As **a POD Lead/SDM**, I want to open a partner and see CSAs, utilization and open escalations, so
  that I manage the relationship.

## 8. Business rules & logic

- **Partner CPE** = mean of the partner's CSAs' CPE.
- **Status:** active / onboarding (prototype seeds one partner as onboarding).
- **DP onboarding progress:** complete for active partners; otherwise a deterministic partial count.
- **Health inputs:** deliveries, active CSA count, open escalations, mean utilization.

## 9. AI capabilities

No dedicated AI surface in the prototype; partner **MBR narratives** are generated in
[Reporting](41-reporting-and-analytics.md) (`mbrNarrative`). Candidate future AI: partner risk scoring.

## 10. Screens & UI

- KPI grid, scorecard table with Profile buttons, profile drawer with metrics + onboarding checklist.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| MOSA/contracting | Contract, status, terms | inbound | SoT for partner + `contractRef`. |
| SSD IQ | CSAs, deliveries, escalations, PODs | inbound | Health aggregation. |
| Procurement/vendor mgmt | Onboarding gates, compliance | in/out | Security review, go-live. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Avg partner CPE | Mean of partner CPE | ≥ 4.4 |
| Deliveries per partner | Completed deliveries | Track |
| Open escalations per partner | Unresolved escalations | Minimise |
| Onboarding cycle time | Sign → go-live | Minimise |

## 13. Non-functional requirements

- **Security:** contract data access-controlled.
- **Accuracy:** health metrics reconciled with SSD IQ.
- **Governance:** onboarding gates (security/compliance) enforced.

## 14. Prototype → production gaps

- [ ] Real **contract/MOSA** integration (terms, dates, renewal).
- [ ] Partner **onboarding workflow** with real gate approvals (security/compliance).
- [ ] Partner **risk scoring** (CPE trend + escalations + utilization).
- [ ] Contract **renewal/expiry** alerts.
- [ ] Provider-level **SLA/OLA** tracking.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| DP-1 | Contracts | MOSA integration (terms/dates/renewal) | Must | SoT |
| DP-2 | Onboarding | Provider onboarding with gate approvals | Must | Governance |
| DP-3 | Risk | Partner risk score | Should | Proactive |
| DP-4 | Alerts | Renewal/expiry notifications | Should | Continuity |
| DP-5 | SLA | Provider SLA/OLA tracking | Could | Accountability |

## 16. Open questions & assumptions

- **Q:** Is "provider" distinct from "partner" here? **A (assumption):** same entity (Delivery
  Partner) — provider/DP management are facets of it.
- **Q:** Who owns go-live sign-off? **A (assumption):** DPSM with security/compliance approval.

## 17. References

- Prototype source: `scripts/views/partners.js`.
- Related: [Partner CSA Lifecycle](22-partner-csa-lifecycle.md), [Enablement](24-enablement.md),
  [Reporting/MBR](41-reporting-and-analytics.md), [SSD IQ](02-ssd-iq-system-of-records.md).
