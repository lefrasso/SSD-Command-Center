# Domain: Capacity & Forecasting

> Demand forecasting, headcount mapping & assignment, and coverage analysis — ensuring **at least one
> CSA per program, per language and per time zone**.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `capacity` |
| Module route | `#/capacity` |
| Prototype status | Implemented |
| Primary personas | POD Lead, SDM, DPSM, business-lt (edits require `edit:capacity`) |
| Source-of-truth systems (target) | Operations, Dispatch (demand), SSD IQ |
| Upstream domains (depends on) | PODs (20), Engagements (11), SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Lifecycle (22), Delivery Partners (23), Reporting (41) |
| Prototype source | `scripts/views/capacity.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery must have enough of the *right* people in the *right* place.
  This domain forecasts demand, maps it to headcount by Success Program, and analyses coverage across
  time zones and languages so gaps are found before they hurt delivery.
- **Who cares** — DPSMs (sourcing/headcount), POD Leads, TZ/WW leads, SDMs.
- **Definition of done** — A planning view that forecasts required headcount from live demand, shows
  gaps by track, and proves coverage per program × language × time zone, feeding hiring/assignment.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| DPSM / POD Lead | View + drive headcount decisions (`edit:capacity`) |
| SDM / business-lt | View forecast, gaps and coverage |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Demand | Open engagements per Success Program. |
| Required headcount | `ceil(demand / capacity-per-CSA)` (prototype: 4 per CSA). |
| Gap | Required − current headcount for a track. |
| Coverage | ≥ 1 active CSA present for a program × time zone (and language). |
| Coverage gap | A program × time-zone cell with **zero** CSAs. |

## 5. Data model

Derived from **CSA** (active, `tracks`, `podId`→`tz`/`region`) and **Engagement** (open, `track`).
Reference: `REGION_LANG` map (region → language), `CAP_PER_CSA = 4`.

## 6. Features (current prototype)

1. **KPIs** — Active CSAs, Avg utilization, Headcount gap (to meet demand), Coverage gaps
   (track × time zone).
2. **AI forecast & planning insight** — required vs active CSAs, where the gap concentrates, and the
   count of zero-coverage cells (target ≥ 1 per program, per time zone).
3. **Headcount mapping & assignment table** — per Success Program: headcount, demand, required, gap,
   recommendation (Assign/hire N, or Balanced).
4. **Coverage analysis matrix** — Program × Time Zone grid, cells coloured (0 = red, 1 = amber, 2+ =
   green).
5. **Language coverage** — per-TZ language badges (from region→language mapping).
6. **Demand chart** — open demand by Success Program.

## 7. User stories

### Epic: Forecast
- As **a DPSM**, I want required headcount computed from live demand, so that I plan hiring on facts.
- As **a leader**, I want the headcount gap by track, so that I fund the right skills.

### Epic: Coverage
- As **a TZ Lead**, I want a program × time-zone coverage matrix, so that I ensure every program is
  covered in my TZ.
- As **an operator**, I want language coverage per TZ, so that we can serve customers in-language.
- As **a DPSM**, I want zero-coverage cells flagged, so that I prioritise sourcing there.

### Epic: Assignment
- As **a POD Lead/DPSM**, I want per-track assign/hire recommendations, so that I act on the gap.

## 8. Business rules & logic

- **Required headcount:** `ceil(open demand for track / 4)`.
- **Gap:** `required − current active headcount on track`; positive = need to assign/hire.
- **Coverage cell:** count of active CSAs whose POD TZ = TZ and who hold the track.
- **Coverage gap:** cells where count = 0. Target: **≥ 1 per program, per time zone** (and per
  language).
- **Language by TZ:** distinct languages of the TZ's regions (region→language map).

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Forecast & coverage insight | demand + active CSAs + coverage | narrative + prescribed action | inline in `capacity.js` | Grounded model + forecasting/optimisation |

## 10. Screens & UI

- KPI grid, AI insight card, headcount mapping table, demand chart, coverage matrix (colour-coded),
  language badges.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Dispatch/pipeline | Forward demand (not just current opens) | inbound | Better forecast. |
| Operations/HR | Headcount, skills, languages, TZ | inbound | Coverage inputs. |
| Hiring/sourcing | Requisitions from gaps | outbound | Close the loop. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Headcount gap | Σ positive per-track gaps | 0 |
| Coverage gaps | Zero-coverage program×TZ cells | 0 |
| Utilization | Mean active CSA utilization | 80–90% |
| Forecast accuracy | Predicted vs actual demand | Improve |

## 13. Non-functional requirements

- **Accuracy:** capacity-per-CSA and demand must reflect real delivery norms.
- **Security:** `edit:capacity` for changes; view scoped by role/TZ.
- **Accessibility:** matrix colour paired with numbers.

## 14. Prototype → production gaps

- [ ] Use **pipeline/forecast** demand (not only current opens); real capacity-per-CSA by program.
- [ ] Add **language** as a first-class coverage dimension (matrix + gaps), not only badges.
- [ ] Generate **hiring requisitions / assignment tasks** from gaps.
- [ ] Scenario planning ("what if we add N CSAs in EMEA?").
- [ ] Time-phased forecast (by month/quarter).

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| CAP-1 | Forecast | Pipeline-based demand forecast | Must | Accuracy |
| CAP-2 | Coverage | Program×TZ×language coverage + gaps | Must | Full inclusivity |
| CAP-3 | Assignment | Create hire/assign tasks from gaps | Should | Action |
| CAP-4 | Scenario | What-if capacity planning | Could | Planning |
| CAP-5 | Time-phasing | Month/quarter forecast | Should | Horizon |

## 16. Open questions & assumptions

- **Q:** Capacity per CSA — is 4 concurrent right? **A (assumption):** placeholder; make configurable
  per program.
- **Q:** Language source? **A (assumption):** derived from region today; should come from CSA profile.

## 17. References

- Prototype source: `scripts/views/capacity.js`.
- Related: [PODs & People](20-pods-and-people.md), [Engagements](11-engagements-and-dispatch.md),
  [Lifecycle](22-partner-csa-lifecycle.md), [Delivery Partners](23-delivery-partners.md).
