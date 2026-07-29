# Domain: Partner CSA Lifecycle

> The end-to-end journey of a Partner CSA — sourcing → selection → onboarding → active delivery →
> offboarding — with a structured onboarding plan, readiness scoring and offboarding checklist.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `lifecycle` |
| Module route | `#/lifecycle` |
| Prototype status | Implemented |
| Primary personas | POD Lead, DPSM, business-lt |
| Source-of-truth systems (target) | Operations/HR, SSD IQ |
| Upstream domains (depends on) | Delivery Partners (23), PODs (20), SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Quality (Mock Deliveries) (30), Enablement (Shadowing) (24), Capacity (21) |
| Prototype source | `scripts/views/lifecycle.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Getting a Partner CSA productive (and offboarding cleanly) is a
  multi-stage process with clear owners and tasks. This domain makes the pipeline visible and tracks
  onboarding readiness so CSAs reach unsupervised delivery safely.
- **Who cares** — DPSMs (sourcing/onboarding), POD Leads (bootcamp/ramp/sign-off), leaders (pipeline).
- **Definition of done** — A pipeline board with per-CSA onboarding tracking (owners, tasks, readiness)
  and offboarding risk management, integrated with mock deliveries and shadowing.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| DPSM | Manage sourcing/selection/onboarding; provision access |
| POD Lead | Own bootcamp, ramp, shadowing and readiness sign-off |
| business-lt | View pipeline health |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Lifecycle stage | sourcing → selection → onboarding → active → offboarding. |
| Onboarding plan | 5 phases / 17 tasks with owners. |
| Readiness | % of onboarding tasks complete; ≥ 80% = ready for unsupervised delivery. |
| Offboarding checklist | Reassign, KT, access removal, vendor sign-off. |

## 5. Data model

Uses **CSA** entity `lifecycle` field plus derived onboarding/offboarding progress. Onboarding plan
(prototype `ONBOARDING_PLAN`) and offboarding tasks (`OFFBOARD_TASKS`) are reference data.

### Onboarding plan (5 phases, 17 tasks)

| Phase | Owner | Tasks |
|---|---|---|
| Pre-boarding | DPSM / Ops | Vendor validation & MOSA confirmation; Background & NDA verification; Provision Microsoft account & MFA |
| Tools & access | Ops | Delivery workspace & SharePoint; Azure DevOps & Power BI; Teams channels & DLs; CPE tooling & Forms |
| Bootcamp | POD Lead | Delivery fundamentals; Success Programs track deep-dive; Proactive Dispatch & Day 0–3 cadence; CPE Recommended Practices |
| Ramp & shadowing | POD Lead | Role guidance & POD orientation; Shadow an active engagement; Mock delivery & QC review; First supervised delivery |
| Sign-off | POD Lead | Onboarding review with POD Lead; Readiness sign-off for unsupervised delivery |

### Offboarding checklist

Reassign open engagements → Knowledge transfer → Access removal → Vendor validation & sign-off.

## 6. Features (current prototype)

1. **Pipeline kanban** — five columns (sourcing → offboarding); cards show name, vendor, POD and top
   tracks.
2. **Profile drawer** — vendor, partner, POD (TZ), tracks, tenure, CPE/quality, and a **lifecycle
   timeline** marking the current stage.
3. **Onboarding tracker** — grouped by phase with per-task checkboxes and owner badges; **AI onboarding
   readiness** meter with guidance.
4. **Offboarding view** — checklist + **AI offboarding risk** (flags open engagements still assigned;
   KT status).

## 7. User stories

### Epic: Pipeline
- As **a DPSM**, I want a stage-based pipeline board, so that I manage sourcing → onboarding at a
  glance.
- As **a leader**, I want to see how many CSAs are onboarding/offboarding, so that I anticipate
  capacity.

### Epic: Onboarding
- As **a POD Lead**, I want a structured onboarding plan with owners and tasks, so that every CSA ramps
  consistently.
- As **a POD Lead**, I want a readiness score, so that I only sign off unsupervised delivery when ready.

### Epic: Offboarding
- As **a DPSM/POD Lead**, I want an offboarding checklist and risk flags, so that we reassign work and
  remove access safely.

## 8. Business rules & logic

- **Readiness %** = onboarding tasks done / 17; ≥ 80% ready, 40–79% on track, < 40% early.
- **Stage inference (prototype):** active/offboarding CSAs treated as fully onboarded; otherwise a
  deterministic partial count.
- **Offboarding risk:** open engagements still assigned ⇒ reassign before access removal; KT status
  reported.
- **Owners:** Pre-boarding/Tools = DPSM/Ops; Bootcamp/Ramp/Sign-off = POD Lead.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Onboarding readiness | onboarding progress | readiness % + guidance | inline in `lifecycle.js` | Grounded model + real task status |
| Offboarding risk | open engagements + KT | risk narrative | inline in `lifecycle.js` | Grounded model |

## 10. Screens & UI

- Kanban (5 stages); profile drawer with timeline, phase-grouped onboarding checklist, readiness meter;
  offboarding checklist + risk card.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Operations/HR | Lifecycle stage, vendor validation | in/out | SoT. |
| Access provisioning (Entra, ADO, Power BI, Teams, SharePoint, Forms) | Grant/remove access | outbound | Onboarding/offboarding tasks. |
| Quality (Mock Deliveries) | Ramp gate | in | See [Quality](30-quality-and-cpe.md). |
| Enablement (Shadowing) | Ramp step | in | See [Enablement](24-enablement.md). |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Time-to-ready | Onboarding start → sign-off | Minimise |
| Onboarding readiness | Avg readiness of onboarding CSAs | Increase |
| Offboarding compliance | Checklists completed on exit | 100% |

## 13. Non-functional requirements

- **Security:** access provisioning/removal must be auditable and timely.
- **Data integrity:** lifecycle stage synced with Operations.
- **Compliance:** NDA/background verification tracked.

## 14. Prototype → production gaps

- [ ] Real **task tracking** (owners, due dates, completion) vs deterministic progress.
- [ ] **Automated access** provisioning/removal integrations tied to checklist items.
- [ ] Gate stage transitions on **mock-delivery pass** and **shadowing** completion.
- [ ] Offboarding **reassignment** workflow (pull open engagements into Dispatch).
- [ ] Notifications/SLA on stalled onboarding tasks.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| LC-1 | Onboarding | Real task tracking with owners/dates | Must | Accuracy |
| LC-2 | Access | Automate provisioning/removal | Must | Security |
| LC-3 | Gates | Require mock-pass + shadowing for sign-off | Should | Quality gate |
| LC-4 | Offboarding | Reassignment workflow to Dispatch | Should | Continuity |
| LC-5 | Alerts | SLA/nudges on stalled tasks | Could | Throughput |

## 16. Open questions & assumptions

- **Q:** Who signs off readiness — POD Lead only? **A (assumption):** POD Lead.
- **Q:** Are sourcing/selection managed here or upstream in recruiting? **A:** visible here; managed
  with DPSM tooling in production.

## 17. References

- Prototype source: `scripts/views/lifecycle.js`.
- Related: [Delivery Partners](23-delivery-partners.md), [Quality (Mock Deliveries)](30-quality-and-cpe.md),
  [Enablement (Shadowing)](24-enablement.md), [Capacity](21-capacity-and-forecasting.md).
