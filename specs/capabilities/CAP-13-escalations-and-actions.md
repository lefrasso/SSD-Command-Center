# Capability: Escalations & Actions `CAP-13`

> Escalation management for all delivery concerns — intake → triage → resolution — with SDM
> co-ownership, SLA timers, action items and AI triage, tracked in Azure DevOps.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-13` |
| Area | Quality & Risk |
| Primary personas | POD Lead, SDM, business-lt (edits require `edit:escalation`) |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/escalations.js`, `scripts/store.js`, `scripts/ai.js` |
| Depends on | [CAP-04 Dispatch](CAP-04-engagements-and-dispatch.md), [03 Integrations](../03-integrations.md) |

## 1. Problem & outcome

- **Problem:** Delivery concerns need a disciplined, time-bound process co-owned by POD Lead + SDM,
  currently spread across forms/ADO/Teams.
- **Outcome:** A triage board with SLA timers, action tracking, bi-directional ADO sync and AI triage.
- **Value:** Faster, consistent resolution; visible aging; nothing dropped.

## 2. Functional requirements

- **FR-ESC-1** — Present a **triage board** (New / Investigating / Mitigating / Resolved) with severity,
  SLA countdown/breach, customer, summary, ADO ref + owner.
- **FR-ESC-2** — Present an **escalation detail** with owner (POD Lead), SDM, ADO ref, opened, SLA, and
  **action items** (owner, due, status).
- **FR-ESC-3** — Provide **intake** with AI **severity classification**.
- **FR-ESC-4** — Provide AI triage: **similar cases**, **extract actions**, **draft resolution**.
- **FR-ESC-5** — **Bi-directional Azure DevOps** sync (create/update work items; pull status).
- **FR-ESC-6** — **SLA timers** with breach alerts/paging.

## 3. Business rules

- **BR-ESC-1** — SLA by severity: sev1=8h, sev2=24h, sev3=48h, sev4=72h; breach when
  `hoursSince(opened) > slaHours` and not resolved.
- **BR-ESC-2** — State machine: new → investigating → mitigating → resolved.
- **BR-ESC-3** — Severity classification (keywords): sev1 (down/breach/security/data loss/outage),
  sev2 (blocker/at risk/milestone), sev3 (delay/scheduling), else sev4.
- **BR-ESC-4** — Co-ownership: POD Lead owner + named SDM; owner/SDM auto-filled from the engagement's POD.

## 4. User stories & acceptance criteria

### Story: Triage by SLA
- **As an** SDM **I want** SLA timers and breach flags **so that** I prioritise the right cases.
- **AC:** Given an unresolved escalation past its `slaHours`, When the board renders, Then it shows an SLA
  breach badge and (production) pages the owner/SDM.

### Story: Fast, documented resolution
- **As an** owner **I want** AI to extract actions and draft a resolution **so that** mitigation is fast
  and well-documented.
- **AC:** Given escalation notes, When I extract actions, Then suggested action items appear; When I draft
  resolution, Then a summary referencing the SDM and mitigation is produced.

## 5. Data & system of record

| Entity | Fields | R/W | SoT |
|---|---|---|---|
| Escalation | engagementId, severity, status, ownerName, sdmName, adoRef, opened, slaHours, actionIds, summary | R/W | Azure DevOps |
| Action Item | escalationId, title, ownerName, due, status | R/W | Azure DevOps |

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Classify severity | intake notes | severity + rationale | advisory | [05](../05-ai-and-copilot-platform.md) |
| Similar cases | escalation | matching past cases | advisory | [05](../05-ai-and-copilot-platform.md) |
| Extract actions | notes | action list | advisory | [05](../05-ai-and-copilot-platform.md) |
| Draft resolution | escalation | resolution summary | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Azure DevOps (bi-directional), SSD IQ (engagement/CSA/POD context), Teams/email (notify). See [03](../03-integrations.md).

## 8. NFR & security notes

`edit:escalation` gate; state/action changes audited; ADO sync must not lose updates; SLA accuracy.

## 9. KPIs

Open escalations (down), SLA breaches (0), mean time to resolve (within SLA), actions open (down).

## 10. Open questions & assumptions

- **Q:** Do CSAs raise escalations directly here? **A (assumption):** they flag via engagement/messages;
  POD Lead/SDM own the record.
- **Q:** SLA start on open or triage? **A (assumption):** on open.
