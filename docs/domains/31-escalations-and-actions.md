# Domain: Escalations & Actions

> Escalation management for all delivery concerns — intake → triage → resolution — with SDM
> co-ownership, SLA timers, action items and AI triage.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `escalations` |
| Module route | `#/escalations` |
| Prototype status | Implemented |
| Primary personas | POD Lead, SDM, business-lt (edits require `edit:escalation`) |
| Source-of-truth systems (target) | Azure DevOps, SSD IQ |
| Upstream domains (depends on) | Engagements (11), SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Cockpit (10), Reporting/MBR (41), Delivery Partners (23) |
| Prototype source | `scripts/views/escalations.js`, `scripts/store.js` (mutations), `scripts/ai.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery concerns (blockers, at-risk milestones, security findings) need
  a disciplined, time-bound process co-owned by the POD Lead and SDM. This domain runs that process:
  capture, classify, act, resolve — against SLAs.
- **Who cares** — POD Leads + SDMs (co-owners), leaders (risk), partners (their escalations).
- **Definition of done** — A triage board with SLA timers, action-item tracking, real ADO integration
  and AI assistance for classification, similar-case retrieval and resolution.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| POD Lead | Raise, triage, own, resolve escalations; manage actions (`edit:escalation`) |
| SDM | Co-own; triage; decide on SLA-breaching cases (`edit:escalation`) |
| business-lt | View escalation portfolio |
| Partner CSA / DPSM | *No module access* (CSAs raise via Messages/engagement) |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Escalation | A tracked delivery concern with severity, owner, SDM and SLA. |
| Severity | sev1 (highest) → sev4; sets the SLA. |
| SLA | Time to act by severity: 8/24/48/72 h. |
| Action item | A task under an escalation (owner, due, status). |
| Triage | Moving through new → investigating → mitigating → resolved. |

## 5. Data model

- **Escalation** (SoT = Azure DevOps): `engagementId`, `severity`, `status`, `ownerName` (POD Lead),
  `sdmName`, `adoRef` (`AB#`), `opened`, `slaHours`, `actionIds[]`, `summary`.
- **Action Item**: `escalationId`, `title`, `ownerName`, `due`, `status` (open/in-progress/done).
- **SLA map:** sev1 = 8h, sev2 = 24h, sev3 = 48h, sev4 = 72h.

## 6. Features (current prototype)

1. **Triage board (kanban)** — New / Investigating / Mitigating / Resolved; cards show severity, SLA
   countdown or **breach** badge, customer, summary, ADO ref + owner.
2. **Escalation drawer** — full detail, **triage buttons** to advance status, **action-item** list with
   done toggles, and **AI triage**: similar cases, extract actions, draft resolution.
3. **Intake** — "New escalation": pick engagement, describe, **AI classify severity**, set severity,
   create (owner/SDM auto-filled from the engagement's POD).
4. **Mutations** — `setEscalationStatus`, `setActionStatus`, `addEscalation` (all update SSD IQ +
   notify).

## 7. User stories

### Epic: Intake & classification
- As **a POD Lead/CSA**, I want to log an escalation and get an AI severity suggestion, so that it's
  triaged correctly from the start.
- As **an owner**, I want owner/SDM auto-assigned from the engagement, so that co-ownership is
  immediate.

### Epic: Triage & SLA
- As **an SDM**, I want SLA timers and breach flags, so that I prioritise the right cases.
- As **an owner**, I want to move an escalation through triage states, so that status is transparent.

### Epic: Actions & resolution
- As **an owner**, I want AI to extract action items and draft a resolution, so that mitigation is fast
  and well-documented.
- As **an owner**, I want similar past cases, so that I reuse proven fixes.

## 8. Business rules & logic

- **SLA:** `slaHours` by severity; **breach** when `hoursSince(opened) > slaHours` and not resolved.
- **State machine:** new → investigating → mitigating → resolved.
- **Severity classification** (`classifySeverity`): keywords → sev1 (down/breach/security/data
  loss/outage), sev2 (blocker/at risk/milestone), sev3 (delay/scheduling), else sev4.
- **Action extraction** (`extractActions`): notes → suggested tasks (stakeholder sync, access,
  re-baseline, customer comms, or mitigation).
- **Co-ownership:** POD Lead owner + named SDM.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Classify severity | intake notes | suggested severity + rationale | `ai.js → classifySeverity` | Grounded model |
| Similar cases | escalation id | matching past escalations | `ai.js → similarCases` | Semantic retrieval |
| Extract actions | notes | action-item list | `ai.js → extractActions` | Model |
| Draft resolution | escalation id | resolution summary | `ai.js → draftResolution` | Grounded model |

## 10. Screens & UI

- Kanban (4 states); escalation drawer (detail, triage, actions, AI triage); intake drawer (engagement,
  notes, classify, severity, create).

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Azure DevOps | Escalations + action items (`AB#`) | in/out | SoT; bi-directional sync. |
| SSD IQ | Engagement/CSA/POD context | inbound | Auto owner/SDM. |
| Teams/email | Notify owner/SDM, updates | outbound | Collaboration. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Open escalations | status ≠ resolved | Minimise |
| SLA breaches | Open past `slaHours` | 0 |
| Time to resolve | opened → resolved | Minimise |
| Actions open | Action items not done | Minimise |

## 13. Non-functional requirements

- **Security:** `edit:escalation` for changes; audit state/action changes.
- **Reliability:** ADO sync must not lose updates.
- **Timeliness:** SLA timers accurate; breach alerts prompt.

## 14. Prototype → production gaps

- [ ] **Bi-directional ADO** sync (create/update work items; pull status).
- [ ] Real **SLA clock** with notifications/paging on approaching breach.
- [ ] **Similar cases** via semantic retrieval over resolved escalations.
- [ ] Auto-create **action items** in ADO from AI extraction.
- [ ] Link escalations to **partner** and **sentiment** for early warning.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| ESC-1 | ADO | Bi-directional work-item sync | Must | SoT |
| ESC-2 | SLA | Real timers + breach alerts/paging | Must | Ops |
| ESC-3 | AI | Semantic similar-case retrieval | Should | Reuse fixes |
| ESC-4 | Actions | Push extracted actions to ADO | Should | Automation |
| ESC-5 | Links | Partner/sentiment correlation | Could | Early warning |

## 16. Open questions & assumptions

- **Q:** Do CSAs raise escalations directly here? **A (assumption):** they flag via engagement/messages;
  POD Lead/SDM own the record.
- **Q:** SLA start — on open or on triage? **A (assumption):** on open.

## 17. References

- Prototype source: `scripts/views/escalations.js`, `scripts/store.js` (`setEscalationStatus`,
  `setActionStatus`, `addEscalation`), `scripts/ai.js` (`classifySeverity`, `similarCases`,
  `extractActions`, `draftResolution`).
- Related: [Engagements](11-engagements-and-dispatch.md), [Delivery Cockpit](10-delivery-cockpit.md),
  [Sentiment](33-sentiment.md), [Reporting/MBR](41-reporting-and-analytics.md).
