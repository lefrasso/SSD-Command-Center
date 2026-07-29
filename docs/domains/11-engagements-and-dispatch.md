# Domain: Engagements & Dispatch

> Proactive Dispatch — move delivery demand from **new** to **complete**, assign the best-fit Partner
> CSA, and drive the Day 0–3 outreach cadence, with AI recommendations and draft outreach.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `engagements` |
| Module route | `#/engagements` |
| Prototype status | Implemented |
| Primary personas | All (dispatch edits require `edit:dispatch` — POD Lead) |
| Source-of-truth systems (target) | Dispatch system, SSD IQ |
| Upstream domains (depends on) | SSD IQ (02), PODs/People (20), Capacity (21), AI (03) |
| Downstream domains (consumed by) | Reports Pending (12), Quality (30), Escalations (31), Messages (40), Agentic (13) |
| Prototype source | `scripts/views/engagements.js`, `scripts/store.js` (`assignEngagement`), `scripts/ai.js` (`recommendCSA`, `draftOutreach`) |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery demand must reach the **right** CSA quickly and start with a
  disciplined outreach cadence. Dispatch is the operational heart of the console: it assigns work and
  sets the tone for every engagement.
- **Who cares** — POD Leads (dispatch), Partner CSAs (their queue), SDMs/leaders (flow health).
- **Definition of done** — A dispatch board that recommends and records assignments, tracks the
  Day 0–3 cadence and milestones, and feeds downstream reporting/quality/escalations.

## 3. Personas & permissions

| Persona | Can do | Cannot do |
|---|---|---|
| POD Lead | View board, recommend & **assign** CSAs (`edit:dispatch`), draft outreach | — |
| Partner CSA | View engagements, see own assignments, use outreach drafts | Assign to others |
| SDM / DPSM / business-lt | View flow and details | Assign (prototype: assign is a POD-Lead action) |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Engagement | A unit of delivery demand for a customer on a track/program. |
| Dispatch | Assigning an engagement to a best-fit CSA and starting outreach. |
| Dispatch stage | `Day 0` → `Day 1` → `Day 2` → `Day 3` → `engaged`. |
| Day 0–3 outreach | Proactive outreach flags the CSA completes at start. |
| Milestone | A delivery step (Kickoff, Discovery, Design, Build, Handover) with due/done. |
| At risk | Engagement trending late or with incomplete early outreach. |

## 5. Data model

Primary entity **Engagement** (owned here; SoT = Dispatch):

| Field | Type | Notes |
|---|---|---|
| `id` | `ENG###` | |
| `customer`, `csamName` | string | Customer + Microsoft CSAM contact |
| `track`, `program` | enum | Success Program + specific program |
| `assignedTo` | CSA id \| null | The Partner CSA |
| `status` | new / assigned / in-delivery / complete | Board columns |
| `dispatchStage` | Day 0–3 / engaged | Outreach progress |
| `outreach` | {day0,day1,day2,day3: bool} | Cadence flags |
| `milestones` | [{label, due, done}] | Delivery plan |
| `dueDate` | date | Drives at-risk + reports pending |
| `atRisk` | bool | Derived risk flag |

## 6. Features (current prototype)

1. **Dispatch board (kanban)** — columns New / Assigned / In delivery / Complete; cards show customer
   (at-risk warning icon), track · program, dispatch-stage badge and assignee (or "Unassigned").
2. **Engagement drawer** — status + at-risk, customer, CSAM, track/program, assigned CSA, due date,
   **Day 0–3 outreach** badges, **milestones** checklist.
3. **AI dispatch** — **Recommend best-fit CSA** (ranked, with rationale) and one-click **Assign**;
   **Draft outreach** email (editable).
4. **Assignment mutation** — assigning sets status `assigned` and advances `dispatchStage` from
   Day 0 → Day 1 (`store.js → assignEngagement`).

## 7. User stories

### Epic: Dispatch
- As **a POD Lead**, I want a best-fit CSA recommendation with rationale, so that I assign the right
  person fast.
- As **a POD Lead**, I want to assign from the recommendation in one click, so that dispatch is quick.
- As **a POD Lead**, I want the board to show unassigned and at-risk demand, so that nothing stalls.

### Epic: Proactive cadence
- As **a Partner CSA**, I want AI-drafted Day-1 outreach, so that I start engagements consistently.
- As **a Partner CSA**, I want to track Day 0–3 outreach and milestones per engagement, so that I stay
  on the proactive cadence.

### Epic: Flow health
- As **a leader**, I want to see engagements move new → complete, so that I understand delivery flow.

## 8. Business rules & logic

- **Assignment:** on assign → `status: assigned`, `dispatchStage: Day 1` (if was Day 0).
- **Best-fit scoring** (`recommendCSA`): active CSAs on the track ranked by
  `headroom×2 + cpe + quality − utilization/50`; headroom = `capacity − open assignments`.
- **At-risk (modelled):** not complete and not new, and (past due, or early outreach incomplete, or a
  small random operational factor) → `atRisk = true`.
- **Outreach cadence:** Day 0–3 booleans; "engaged" implies the cadence largely done. This cadence is
  the prevention mechanism tracked by [Reports Pending](12-reports-pending.md).
- **Status lifecycle:** new → assigned → in-delivery → complete.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Recommend best-fit CSA | engagement + dataset | ranked CSAs + rationale + sources | `ai.js → recommendCSA` | Grounded model + capacity/skills features |
| Draft outreach | engagement | editable Day-1 email | `ai.js → draftOutreach` | Grounded model + templates |

## 10. Screens & UI

- Kanban board (4 columns), engagement drawer with outreach badges, milestone checklist, AI dispatch
  actions and output cards; assign buttons inside the recommendation.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Dispatch system | Engagement demand + assignments | in/out | SoT for engagements. |
| SSD IQ | CSA capacity/skills/lifecycle | inbound | Feeds recommendations. |
| Email/Teams/Calendar | Send outreach, schedule Day-1 sync | outbound | Prototype drafts only. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Time-to-dispatch | New → assigned duration | Minimise |
| Outreach completion | % engagements with Day 0–3 complete | High |
| At-risk rate | % active engagements at risk | Minimise |
| On-time delivery | completed ≤ due | ≥ 90% |

## 13. Non-functional requirements

- **Security:** only `edit:dispatch` may assign; audit assignments.
- **Reliability:** assignment must be transactional and reflected in SSD IQ.
- **Accessibility:** kanban operable by keyboard; drawer focus management.

## 14. Prototype → production gaps

- [ ] Persist assignments to the **Dispatch system**; audit who/when.
- [ ] **Actually send** outreach + schedule the Day-1 sync (Graph/Calendar) vs draft-only.
- [ ] Automate **dispatch-stage advancement** from real outreach signals.
- [ ] Recommendation model using real **skills, language, TZ, capacity** and outcomes.
- [ ] **Bulk dispatch** and rules-based auto-assignment with human approval.
- [ ] Enforce **language/TZ coverage** (link to [Capacity](21-capacity-and-forecasting.md)).

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| ENG-1 | Dispatch | Persist + audit assignments to Dispatch system | Must | SoT |
| ENG-2 | Outreach | Send outreach + schedule Day-1 sync via Graph | Must | Beyond draft |
| ENG-3 | Recommend | Best-fit model (skills/lang/TZ/capacity/outcomes) | Should | Quality of match |
| ENG-4 | Automation | Rules-based auto-assign with approval | Could | Scale |
| ENG-5 | Cadence | Auto-advance stages from real signals | Should | Accuracy |

## 16. Open questions & assumptions

- **Q:** Can non-POD-Lead roles dispatch? **A (assumption):** no — dispatch is a POD-Lead action.
- **Q:** Is Day-1 sync scheduling in scope? **A:** yes for production (User Voice + spec imply it).

## 17. References

- Prototype source: `scripts/views/engagements.js`, `scripts/store.js` (`assignEngagement`),
  `scripts/ai.js` (`recommendCSA`, `draftOutreach`).
- Related: [Reports Pending](12-reports-pending.md), [Capacity](21-capacity-and-forecasting.md),
  [Quality](30-quality-and-cpe.md), [Messages](40-messages-console.md), [Agentic](13-agentic-delivery.md).
