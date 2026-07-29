# Capability: PODs & People `CAP-07`

> POD structure, roster, capacity/utilization, skills coverage and time-zone rollup — the operational
> view of the Partner CSA workforce.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-07` |
| Area | Workforce |
| Primary personas | POD Lead, SDM, DPSM, business-lt |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/pods.js` |
| Depends on | [02 Data](../02-data-and-system-of-record.md), [CAP-08 Capacity](CAP-08-capacity-and-forecasting.md) |

## 1. Problem & outcome

- **Problem:** Leaders can't easily see who's in each POD, how loaded they are, and what skills exist.
- **Outcome:** A live roster + capacity + skills view scoped by TZ/POD, with balancing and gap insight.
- **Value:** Better load balancing; visible skill coverage.

## 2. Functional requirements

- **FR-PODS-1** — Show KPIs: Active Partner CSAs, Avg utilization, PODs, Delivery Partners.
- **FR-PODS-2** — Show a **capacity heatmap** by POD (coloured by utilization; TZ, CSA count, TZ lead).
- **FR-PODS-3** — Show a **roster** table (name, vendor, POD, tracks, utilization, tenure, status).
- **FR-PODS-4** — Show **skills coverage** across active CSAs.
- **FR-PODS-5** — Filter by **time zone** and **POD**; scope by the user's role/TZ.
- **FR-PODS-6** — Provide AI **capacity-balancing** and **skill-gap** insight.

## 3. Business rules

- **BR-PODS-1** — Healthy utilization band 80–90%; over = >92%, under = <72%.
- **BR-PODS-2** — POD utilization = mean of active CSAs' utilization (fallback to stored value).
- **BR-PODS-3** — Skill-gap ratio = open demand for a track / active CSAs holding it; highest = watch.
- **BR-PODS-4** — TZ rollup via the region→TZ map.

## 4. User stories & acceptance criteria

### Story: Manage load
- **As a** POD Lead **I want** my roster with utilization **so that** I can manage load.
- **AC:** Given I filter to my POD, When the roster renders, Then each CSA shows utilization vs the
  healthy band.

### Story: Rebalance
- **As a** DPSM **I want** over/under-utilised CSAs flagged **so that** I can rebalance work.
- **AC:** Given a CSA >92% and another <72%, When the insight renders, Then it suggests shifting demand.

## 5. Data & system of record

| Entity | Fields | R/W | SoT |
|---|---|---|---|
| POD | name, leadName, region, tz, tzLead, tracks, capacity, utilization | R | SSD IQ |
| CSA | podId, utilization, tracks, skills, tenureMonths, lifecycle | R | Operations |

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Capacity/skills insight | active CSAs + demand | balancing + gap narrative | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Operations/HR (roster, utilization), SSD IQ (POD structure, TZ map), skilling (skills). See [03](../03-integrations.md).

## 8. NFR & security notes

People data scoped by role/TZ; no confidential performance data here; heatmap colour + numeric labels.

## 9. KPIs

Avg utilization (80–90%), over/under-utilised counts, skill coverage per track/TZ.

## 10. Open questions & assumptions

- **Q:** Utilization self-reported or system-derived? **A (assumption):** system-derived in production.
- **Q:** Do CSAs see their own POD? **A:** not here; their view is Engagements/Quality.
