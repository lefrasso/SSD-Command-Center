# Domain: PODs & People

> POD structure, roster, capacity/utilization, skills coverage and time-zone rollup — the operational
> view of the Partner CSA workforce.

> **Source alignment — POD Lead Report.** This domain is the operational home of the production **POD
> Lead Report** (*Success Programs Insights & Operations*). Its **POD Snapshot** page adds a per-CSA
> actionable view (Quality Checks, Reports Pending, Completed & Upcoming Requests, Survey CPE, Open
> Escalations) plus a **Supplier** (vendor) and **SDM** dimension. Canonical spec:
> [specs/07 §2.6](../../specs/07-kpis-and-reporting.md) · [CAP-07](../../specs/capabilities/CAP-07-pods-and-people.md).

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `pods` |
| Module route | `#/pods` |
| Prototype status | Implemented |
| Primary personas | POD Lead, SDM, DPSM, business-lt |
| Source-of-truth systems (target) | Operations (roster/utilization), SSD IQ (POD structure) |
| Upstream domains (depends on) | SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Capacity (21), Lifecycle (22), Performance (32), Cockpit (10) |
| Prototype source | `scripts/views/pods.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery is run through **PODs** (managed groups of Partner CSAs led by
  a POD Lead, mapped to a region and time zone). Leaders need to see who is in each POD, how loaded
  they are, and what skills exist — to balance work and spot gaps.
- **Who cares** — POD Leads, DPSMs, SDMs, TZ/WW leads.
- **Definition of done** — A live roster + capacity + skills view, scoped by TZ/POD, with actionable
  balancing and skill-gap insight.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| POD Lead | View PODs (esp. own), roster, capacity, skills |
| DPSM | View capacity/headcount for sourcing decisions |
| SDM / business-lt | View POD health and skills coverage |
| Partner CSA | *No access* (not in module roles) |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| POD | Managed group of CSAs; has lead, region, TZ, tracks, capacity, utilization. |
| Utilization | % of a CSA's/POD's capacity in use (healthy band 80–90%). |
| Capacity heatmap | POD tiles coloured by utilization. |
| Skills coverage | Count of active CSAs holding each skill/accreditation. |

## 5. Data model

Uses **POD** and **CSA** entities (see [SSD IQ](02-ssd-iq-system-of-records.md)). POD: `leadName`,
`region`, `tz`, `tzLead`, `tracks[]`, `capacity`, `utilization`. CSA: `podId`, `utilization`,
`tracks[]`, `skills[]`, `tenureMonths`, `lifecycle`.

## 6. Features (current prototype)

1. **Filters** — time zone and POD.
2. **KPIs** — Active Partner CSAs, Avg utilization (healthy band hint), PODs, Delivery Partners.
3. **AI capacity & skills insight** — flags CSAs over 92% / under 72% utilization and suggests shifting
   demand; identifies the track with the highest demand-to-supply ratio as a skill-gap watch.
4. **Capacity heatmap by POD** — tiles coloured by utilization, showing TZ, CSA count and TZ lead.
5. **Roster table** — name, vendor, POD, tracks, utilization meter, tenure, lifecycle status.
6. **Skills coverage** — top 12 skills/accreditations across active CSAs with coverage meters.

## 7. User stories

### Epic: Workforce visibility
- As **a POD Lead**, I want my POD roster with utilization and tracks, so that I can manage load.
- As **a TZ Lead**, I want to filter PODs by time zone, so that I see my territory.

### Epic: Balance & gaps
- As **a POD Lead/DPSM**, I want AI to flag over/under-utilised CSAs, so that I can rebalance work.
- As **a DPSM**, I want a skill-gap watch, so that I prioritise hiring/enablement where demand exceeds
  supply.

### Epic: Skills
- As **a leader**, I want skills coverage across the workforce, so that I know our delivery strengths.

## 8. Business rules & logic

- **Utilization band:** healthy 80–90%; over = 92%+, under = <72% (AI thresholds).
- **POD utilization:** mean of active CSAs' utilization (fallback to POD's stored value).
- **Skill-gap ratio:** open demand for a track / active CSAs holding that track; highest = watch.
- **TZ rollup:** region → TZ via the TZ map (Americas/EMEA/ASIA).

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Capacity balancing + skill gap | active CSAs + open demand | narrative with over/under CSAs + gap track | inline in `pods.js` | Grounded model + optimisation |

## 10. Screens & UI

- Filters (TZ, POD), KPI grid, AI insight card, capacity heatmap, roster table, skills coverage panel.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Operations/HR | Roster, tenure, utilization, lifecycle | inbound | SoT for people data. |
| SSD IQ | POD structure + TZ map | in/out | SoT for PODs. |
| Skilling/accreditation | Skills per CSA | inbound | See [Enablement](24-enablement.md). |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Avg utilization | Mean active CSA utilization | 80–90% |
| Over/under-utilised | Count > 92% / < 72% | Minimise extremes |
| Skill coverage | CSAs per key skill | ≥ threshold per track/TZ |

## 13. Non-functional requirements

- **Security:** people data scoped by role/TZ; no confidential performance data here.
- **Accuracy:** utilization/roster synced from Operations.
- **Accessibility:** heatmap colour paired with numeric labels.

## 14. Prototype → production gaps

- [ ] Live **roster/utilization** from Operations (vs seeded).
- [ ] **TZ/POD scoping** tied to the signed-in user.
- [ ] Actionable **rebalancing** (move demand / suggest reassignment) not just narrative.
- [ ] Unify **skills** with the Enablement accreditation source.
- [ ] Trend utilization and coverage over time.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| POD-1 | Data | Live roster + utilization from Operations | Must | Accuracy |
| POD-2 | Scoping | TZ/POD scoping by identity | Must | Real orgs |
| POD-3 | Balancing | Actionable rebalancing suggestions | Should | Beyond insight |
| POD-4 | Skills | Single accreditation source (link Enablement) | Should | Consistency |
| POD-5 | Trend | Utilization/coverage trends | Could | Insight |

## 16. Open questions & assumptions

- **Q:** Is utilization self-reported or system-derived? **A (assumption):** system-derived from
  assignments/timesheets in production.
- **Q:** Do CSAs see their own POD? **A:** not in this module today; their view is Engagements/Quality.

## 17. References

- Prototype source: `scripts/views/pods.js`.
- Related: [Capacity](21-capacity-and-forecasting.md), [Lifecycle](22-partner-csa-lifecycle.md),
  [Enablement](24-enablement.md), [Performance](32-performance-and-pips.md).
