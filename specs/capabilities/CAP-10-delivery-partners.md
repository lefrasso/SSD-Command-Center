# Capability: Delivery Partners `CAP-10`

> Delivery Partner (provider) management — scorecards, contracts, onboarding and profiles, governed
> under MOSA.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-10` |
| Area | Workforce |
| Primary personas | Operations Manager, CSA Manager, POD Lead, SDM, leadership |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/views/partners.js` |
| Depends on | [CAP-09 Lifecycle](CAP-09-partner-csa-lifecycle.md), [02 Data](../02-data-and-system-of-record.md) |

## 1. Problem & outcome

- **Problem:** Providers (Delivery Partners) must be governed — contracts, health, onboarding, roster —
  in one place.
- **Outcome:** Provider scorecards with contract refs, health metrics, onboarding checklist and
  drill-through to CSAs/escalations, feeding MBRs.
- **Value:** Clear provider governance and health.

## 2. Functional requirements

- **FR-DP-1** — Show KPIs: Delivery Partners, Partner CSAs, Avg partner CPE, Onboarding count.
- **FR-DP-2** — Show a **scorecard** table (partner, region, status, CPE, deliveries, CSAs, PODs, contract).
- **FR-DP-3** — Show a partner **profile** (region, CPE, deliveries, CSAs, open escalations, utilization)
  + **DP onboarding** checklist.
- **FR-DP-4** — Integrate MOSA contract data (terms, dates, renewal) (production).
- **FR-DP-5** — Provide provider **risk scoring** (CPE trend + escalations + utilization) (production).
- **FR-DP-6** — Show per-partner **Active HC** and **open requisitions** (from HC consolidation) on the
  scorecard, linking to HC Tracking ([CAP-08](CAP-08-capacity-and-forecasting.md)).
- **FR-DP-7** — Expose the partner as the CSA's **Supplier** (vendor) filter/dimension across operational
  reporting (e.g. Avanade, Cognizant, Concentrix), and show per-partner **S500-ready CSA** count plus any
  **S500 customers served by non-S500-ready CSAs** for that partner.

## 3. Business rules

- **BR-DP-1** — Partner CPE = mean of the partner's CSAs' CPE.
- **BR-DP-2** — Status: active / onboarding.
- **BR-DP-3** — DP onboarding: MOSA signed → security & compliance review → tooling & access → POD
  alignment & ramp → first CSA cohort → go-live sign-off.
- **BR-DP-4** — Partner **S500 readiness** = share of its active CSAs marked S500-ready (reconciled);
  delivery to an S500 customer by a non-ready CSA is a partner-health flag (see [CAP-11](CAP-11-enablement.md)).

## 4. User stories & acceptance criteria

### Story: Govern a provider
- **As an** Operations Manager **I want** a scorecard per Delivery Partner **so that** I govern health and contracts.
- **AC:** Given a partner, When I open the profile, Then I see CPE, deliveries, CSAs, open escalations,
  utilization and the onboarding checklist.

### Story: Onboard a provider
- **As an** Operations Manager **I want** a provider onboarding checklist with gate approvals **so that** new partners
  reach go-live safely.
- **AC:** Given an onboarding partner, When I view onboarding, Then gates (security/compliance) must be
  approved before go-live sign-off (production).

## 5. Data & system of record

| Entity | Fields | R/W | SoT |
|---|---|---|---|
| Partner | name, type, region, cpe, deliveries, status, contractRef, podIds | R | MOSA/Operations |
| CSA / Escalation | via partner's CSAs | R | Operations / ADO |

## 6. AI touchpoints

None in prototype; partner MBR narratives generated in [CAP-17](CAP-17-reporting-and-mbr.md). Candidate:
partner risk scoring.

## 7. Integrations

MOSA/contracting (contract, status), SSD IQ (CSAs, deliveries, escalations, PODs), procurement/vendor
mgmt (onboarding gates). See [03](../03-integrations.md).

## 8. NFR & security notes

Contract data access-controlled (MOSA/NDA); health reconciled with SSD IQ; onboarding gates enforced.

## 9. KPIs

Avg partner CPE (≥4.4), deliveries per partner, open escalations per partner, S500 readiness per partner,
onboarding cycle time.

## 10. Open questions & assumptions

- **Q:** "Provider" distinct from "partner"? **A (assumption):** same entity (Delivery Partner);
  provider/DP management are facets.
- **Q:** Who owns go-live sign-off? **A (assumption):** Operations Manager with security/compliance approval.
