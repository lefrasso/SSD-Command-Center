# Capability: Engagements & Dispatch `CAP-04`

> Proactive Dispatch — move delivery demand from new to complete, assign the best-fit Partner CSA, and
> drive the Day 0–3 outreach cadence, with AI recommendations and draft outreach.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-04` |
| Area | Delivery |
| Primary personas | POD Lead (dispatch), Partner CSA, SDM, DPSM, business-lt |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/engagements.js`, `scripts/store.js` (`assignEngagement`), `scripts/ai.js` (`recommendCSA`, `draftOutreach`) |
| Depends on | [CAP-07 PODs](CAP-07-pods-and-people.md), [CAP-08 Capacity](CAP-08-capacity-and-forecasting.md), [05 AI](../05-ai-and-copilot-platform.md) |

## 1. Problem & outcome

- **Problem:** Demand must reach the right CSA fast and start with a disciplined outreach cadence, today
  spread across Teams/Outlook/forms.
- **Outcome:** A dispatch board that recommends + records assignments, tracks Day 0–3 outreach and
  milestones, and feeds downstream reporting/quality/escalations.
- **Value:** Faster, better-matched dispatch; proactive starts; fewer at-risk engagements.

## 2. Functional requirements

- **FR-DISPATCH-1** — Present a dispatch board (New / Assigned / In delivery / Complete) with cards
  showing customer, at-risk flag, track·program, dispatch stage and assignee.
- **FR-DISPATCH-2** — Present an engagement detail with customer, CSAM, track/program, assigned CSA, due
  date, **Day 0–3 outreach** status and **milestones**.
- **FR-DISPATCH-3** — Provide an AI **best-fit CSA recommendation** (ranked, with rationale) respecting
  capacity, skills, language, TZ and track.
- **FR-DISPATCH-4** — Allow one-click **assignment** from the recommendation (requires `edit:dispatch`),
  persisted and audited.
- **FR-DISPATCH-5** — Provide AI **draft outreach** (editable) and, in production, **send** it and
  **schedule the Day-1 sync** via Graph.
- **FR-DISPATCH-6** — Surface an **at-risk** signal for engagements trending late.
- **FR-DISPATCH-7** — Advance `dispatchStage` from real outreach signals (production).

## 3. Business rules

- **BR-DISPATCH-1** — On assign → `status: assigned`, `dispatchStage: Day 1` (if was Day 0); audit the change.
- **BR-DISPATCH-2** — Best-fit score (prototype): `headroom×2 + cpe + quality − utilization/50`, top 3;
  `headroom = capacity − open assignments`. Production adds language/TZ/skill/outcome features.
- **BR-DISPATCH-3** — At-risk: not complete and not new, and (past due OR early outreach incomplete OR
  operational risk factor).
- **BR-DISPATCH-4** — Status lifecycle: new → assigned → in-delivery → complete.
- **BR-DISPATCH-5** — Assignment respects capacity (do not over-allocate).

## 4. User stories & acceptance criteria

### Story: Best-fit dispatch
- **As a** POD Lead **I want** a ranked best-fit CSA with rationale **so that** I assign the right person
  fast.
- **AC:**
  - Given an unassigned engagement on a track, When I request a recommendation, Then I see ranked active
    CSAs on that track with headroom/CPE/quality/utilization and a rationale.
  - Given a recommendation, When I click Assign, Then the engagement moves to Assigned, the CSA is set,
    and the change is audited.

### Story: Proactive start
- **As a** Partner CSA **I want** AI-drafted Day-1 outreach **so that** I start consistently.
- **AC:** Given an assigned engagement, When I request draft outreach, Then I get an editable draft; When
  I send (production), Then the email is sent and the Day-1 sync is scheduled.

## 5. Data & system of record

| Entity | Fields | R/W | SoT |
|---|---|---|---|
| Engagement | customer, csamName, track, program, assignedTo, status, dispatchStage, outreach, milestones, dueDate, atRisk | R/W | Dispatch |
| CSA | tracks, skills, capacity, utilization, lifecycle | R | Operations |

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Best-fit CSA | engagement + data | ranked CSAs + rationale | advisory/human-assigns | [05](../05-ai-and-copilot-platform.md) |
| Draft outreach | engagement | editable email | advisory/human-sends | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Dispatch system (SoT), Microsoft Graph (send mail, schedule Day-1 sync), SSD IQ (CSA capacity/skills).
See [03](../03-integrations.md).

## 8. NFR & security notes

`edit:dispatch` gate; transactional + audited assignments; deep-linkable engagements.

## 9. KPIs

Time-to-dispatch, outreach completion, at-risk rate, on-time delivery.

## 10. Open questions & assumptions

- **Q:** Can non-POD-Lead roles dispatch? **A (assumption):** no — POD-Lead action.
- **Q:** Auto-assignment (rules) with approval? **A:** P2+ candidate.
