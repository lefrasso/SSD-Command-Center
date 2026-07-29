# 08 — Roadmap & Phasing

> A staged path from the Phase-0 prototype to a production operating system for delivery. Phases are
> from the original brief; the capability→phase mapping tells the team what to build when.

## 1. Phases

| Phase | Focus | Outcome |
|---|---|---|
| **P0 — Prototype** (done) | Clickable console, all modules, mock data, simulated AI | Leadership alignment on the vision (this repo) |
| **P1 — Pilot** | Real SSD IQ schema on Dataverse/Fabric; live Azure DevOps, Power BI, Graph; 1–2 PODs | A working system on real MBRs |
| **P2 — Scale** | All PODs and partners; Azure OpenAI for reporting/sentiment/quality; workflow automation | An operating system for delivery at scale |
| **P3 — Intelligence** | Predictive at-risk detection, capacity optimization, closed-loop CPE | Proactive, data-driven delivery management |

## 2. MVP (Phase 1) definition

The pilot is "done" when, for 1–2 PODs on **real data**:

- **Identity:** Entra ID SSO + role-based nav ([CAP-01](capabilities/CAP-01-identity-and-access.md)).
- **SSD IQ:** governed records federated from ADO/Power BI/Graph/Operations ([02](02-data-and-system-of-record.md)).
- **Cockpit:** live role-aware KPIs + briefing + needs-attention ([CAP-02](capabilities/CAP-02-delivery-cockpit.md)).
- **Dispatch:** assign engagements, track Day 0–3 outreach ([CAP-04](capabilities/CAP-04-engagements-and-dispatch.md)).
- **Reports Pending / T-3W:** real pending-report + proactive tracking ([CAP-05](capabilities/CAP-05-reports-pending-t3w.md)).
- **Escalations:** bi-directional ADO sync + SLA timers ([CAP-13](capabilities/CAP-13-escalations-and-actions.md)).
- **Quality & CPE:** real CPE ingestion + QC ([CAP-12](capabilities/CAP-12-quality-and-cpe.md)).
- **Lifecycle:** onboarding/offboarding tracking ([CAP-09](capabilities/CAP-09-partner-csa-lifecycle.md)).
- **Messages:** Teams-backed threads ([CAP-16](capabilities/CAP-16-messages-console.md)).
- **Reporting/MBR:** partner + internal MBR on real data, Power BI executive view ([CAP-17](capabilities/CAP-17-reporting-and-mbr.md)).
- **PODs & People:** roster/capacity from Operations ([CAP-07](capabilities/CAP-07-pods-and-people.md)).

## 3. Capability → phase mapping

| Capability | Phase | Notes |
|---|---|---|
| CAP-01 Identity & Access | **P1** | Foundation for everything |
| CAP-02 Delivery Cockpit | **P1** | Landing page |
| CAP-03 SSD IQ Explorer | **P1** | Governed data surface |
| CAP-04 Engagements & Dispatch | **P1** | Core delivery engine |
| CAP-05 Reports Pending / T-3W | **P1** | Proactive prevention |
| CAP-07 PODs & People | **P1** | Workforce visibility |
| CAP-09 Partner CSA Lifecycle | **P1** | Onboarding/offboarding |
| CAP-12 Quality & CPE | **P1** | Experience |
| CAP-13 Escalations & Actions | **P1** | Risk (ADO sync) |
| CAP-16 Messages Console | **P1** | Comms (Teams) |
| CAP-17 Reporting/Territory/MBR | **P1** | MBRs + exec/territory |
| CAP-08 Capacity & Forecasting | **P2** | Planning + coverage |
| CAP-10 Delivery Partners | **P2** | Provider governance |
| CAP-11 Enablement | **P2** | Accreditations/S500/onboarding |
| CAP-14 Performance & PIPs | **P2** | Confidential (HR integration) |
| CAP-15 Sentiment | **P2** | NLP across channels |
| CAP-18 Compass Copilot | **P2** | Grounded assistant |
| CAP-06 Agentic Delivery | **P3** | Agent-generated deliverables |
| Predictive at-risk / capacity optimization / closed-loop CPE | **P3** | Intelligence layer |

## 4. Cross-cutting workstreams (parallel to capabilities)

| Workstream | Phase | Ref |
|---|---|---|
| Integration layer (federation, ADO/Graph/Power BI/Forms) | P1→P2 | [03](03-integrations.md) |
| Security & RBAC (Entra ID, confidential gating, audit) | P1 | [04](04-security-privacy-compliance.md) |
| AI platform (Azure OpenAI seam, grounding, guardrails, eval) | P2 | [05](05-ai-and-copilot-platform.md) |
| NFRs (perf/scale/a11y/observability) | P1→P2 | [06](06-non-functional-requirements.md) |
| Data platform (Dataverse/Fabric, MDM, DQ) | P1→P2 | [02](02-data-and-system-of-record.md) |

## 5. Sequencing rationale

- **Data + identity first (P1):** nothing is trustworthy without the governed model and real auth.
- **Delivery + risk + reporting next (P1):** these deliver the daily value and the MBR automation the
  business asked for.
- **AI hardening (P2):** move from simulated to grounded once data is real.
- **Agentic + predictive (P3):** highest value, highest risk — build on a proven, grounded base.

## 6. References

- Original brief roadmap + success metrics (mined from session history).
- Related: all capability specs; [00 Overview](00-product-overview.md), [09 Decisions](09-design-decisions-and-learnings.md).
