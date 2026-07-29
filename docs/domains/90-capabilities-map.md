# Domain: Capabilities Map

> The SSD delivery **capability map** — a traceability view of what Compass covers, grouped by area,
> each capability linking to its live module. Useful as a backlog cross-reference and coverage tracker.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `capabilities` |
| Module route | `#/capabilities` |
| Prototype status | Implemented (35/35 Live) |
| Primary personas | All |
| Source-of-truth systems (target) | This documentation set + delivery-of-record backlog |
| Upstream domains (depends on) | All modules (it links to them) |
| Downstream domains (consumed by) | Planning / roadmap |
| Prototype source | `scripts/views/capabilities.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Stakeholders need a single map of the delivery capabilities the console
  provides, their status, and where each lives — for coverage, gap analysis and roadmap conversations.
- **Who cares** — Product/leadership (coverage), engineering (traceability), new joiners (orientation).
- **Definition of done** — A living capability catalog whose status reflects real implementation and
  links to each capability's module (and, ideally, to these specs and the backlog).

## 3. Personas & permissions

All roles can view. It is informational; no data mutation.

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Capability | A named delivery capability (e.g. Delivery Management, Forecasting). |
| Status | Live / Partial / Planned (prototype: all **Live**). |
| Group | A capability area (Delivery, Quality, People & capacity, …). |
| Open link | Deep-link from a capability to its module. |

## 5. Data model

Reference data only (prototype constant `CAPS`): groups → items `{ name, status, to?, note }`. No SSD
IQ entity.

## 6. Features (current prototype)

1. **Summary KPIs** — total capabilities and counts by status (Live / Partial / Planned). Currently
   **35 Live, 0 Partial, 0 Planned**.
2. **Grouped capability cards** — 8 groups, each listing capabilities with a status pill, a note, and an
   **Open** deep-link to the owning module.

### Capability groups → modules

| Group | Capabilities | Module(s) |
|---|---|---|
| Delivery | Delivery Management, Scheduler / Sender, Planning, Agentic Delivery, Delivery Agent | Engagements, Capacity, Agentic |
| Quality | Quality Management, Delivery Quality, Deliverables Quality, Feedback Management | Quality & CPE |
| Escalation & risk | Escalation Management, Reports Pending (T-3W) | Escalations, Reports Pending |
| AI & agentic | Compass Copilot, Cortana, Deliverables Generation, IP | AI/Copilot, Agentic |
| Comms & enablement | Comms, Email Template Manager, Shadowing Management, Accreditations, User Voice | Messages, Enablement |
| People & capacity | Headcount Management, Capacity Management, POD Lead Tools, Coverage Analysis, Forecasting, Headcount Mapping, Headcount Assignment | PODs, Capacity, Home |
| Partner & provider | Partner Management, Profile Management, DP Onboarding, Provider Management, DP Management | SSD IQ, Delivery Partners |
| Programs & governance | Performance & PIPs, S500 Eligibility, SDM Onboarding | Performance, Enablement |

## 7. User stories

### Epic: Coverage & traceability
- As **a product owner**, I want a capability map with status, so that I can see coverage and gaps at a
  glance.
- As **any user**, I want to jump from a capability to its module, so that I can explore it.
- As **a planner**, I want capabilities linked to specs/backlog, so that the map drives the roadmap.

## 8. Business rules & logic

- **Status values:** Live / Partial / Planned; summary counts derive from the items.
- **Deep link:** a capability with `to` navigates to that module route.
- **Single source:** the map should be generated from a shared registry (ideally the same one behind
  `MODULES` + these domain docs) so it never drifts.

## 9. AI capabilities

None. (It catalogs AI capabilities but implements none.)

## 10. Screens & UI

- Summary KPI row + grouped capability cards with status pills, notes and Open buttons.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Backlog (ADO/Planner) | Link capability → epics/stories | outbound | Traceability. |
| This docs set | Link capability → domain spec | outbound | Single source. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Live coverage | Live / total capabilities | Track toward goal |
| Traceability | Capabilities linked to spec + backlog | 100% |

## 13. Non-functional requirements

- **Freshness:** status must reflect reality (avoid stale "Live").
- **Single source of truth:** generate from the module/spec registry.

## 14. Prototype → production gaps

- [ ] Generate the map from a **shared capability registry** (not a hand-maintained constant).
- [ ] Link each capability to its **domain spec** (this folder) and **backlog** items.
- [ ] Track **real** status (Live/Partial/Planned) per environment/release.
- [ ] Show ownership and target release per capability.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| CAPS-1 | Registry | Drive map from shared capability registry | Should | No drift |
| CAPS-2 | Traceability | Link capability → spec + backlog | Should | Roadmap |
| CAPS-3 | Status | Real per-release status | Could | Accuracy |
| CAPS-4 | Ownership | Owner + target release per capability | Could | Planning |

## 16. Open questions & assumptions

- **Q:** Is "Cortana" a distinct capability or the Copilot surface? **A (assumption):** it is the
  assistant surface delivered via Compass Copilot.
- **Q:** Should the map be external-facing? **A (assumption):** internal roadmap/coverage tool.

## 17. References

- Prototype source: `scripts/views/capabilities.js`, `scripts/nav.js` (module registry).
- Related: **all** domain docs (this map links to each module); [README index](README.md).
