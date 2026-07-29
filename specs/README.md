# Compass — Production Specifications

**Compass** is the SSD Delivery Console: a single, AI-native operational console for **Success
Services Delivery (SSD)**, built over **SSD IQ**, a governed System of Records. This folder is the
**production source of truth** — a reverse-engineered specification set derived from the clickable
prototype in this repository and the original product brief.

> **Status:** Reverse-engineered from Phase-0 prototype · Target: production build
> **Codenames:** *Compass* (the console) · *SSD IQ* (the System of Records)

---

## Why this folder exists

The prototype in this repo (`index.html`, `scripts/`, `data/`, `styles/`) was built to crystallize
thinking and align leadership on the vision. These specs lift the **learnings** out of that prototype
and restate them as **build-ready requirements** for a production-grade solution — split into
capabilities/features at a granularity a delivery team (or an AI coding agent) can implement against.

### Relationship to `docs/domains/`
This `specs/` set **supersedes** the earlier [`docs/domains/`](../docs/domains/) folder. `docs/domains/`
was framed as *prototype-thinking / backlog seeds*; `specs/` is the authoritative **production**
specification (PRD + functional + technical/architecture + roadmap). `docs/domains/` is retained for
history and marked as superseded — it can be removed once this set is accepted.

---

## How to read these specs

Start with the **foundation** docs, then dive into **capabilities**:

| # | Document | What it defines |
|---|---|---|
| 00 | [Product Overview](00-product-overview.md) | Vision, business context, personas, scope, success metrics, glossary |
| 01 | [Solution Architecture](01-solution-architecture.md) | Layered architecture + **recommended** target stack, environments |
| 02 | [Data & System of Record](02-data-and-system-of-record.md) | SSD IQ canonical model, entities, MDM, lineage, data quality |
| 03 | [Integrations](03-integrations.md) | Source-system catalog + integration contracts |
| 04 | [Security, Privacy & Compliance](04-security-privacy-compliance.md) | Identity, RBAC, data classification, audit, responsible AI |
| 05 | [AI & Copilot Platform](05-ai-and-copilot-platform.md) | AI service catalog, grounding, guardrails, evaluation, cost |
| 06 | [Non-Functional Requirements](06-non-functional-requirements.md) | Performance, scale, availability, accessibility, i18n, SLAs |
| 07 | [KPIs & Reporting](07-kpis-and-reporting.md) | KPI catalog (definitions/formulas/targets), reporting surfaces, MBRs |
| 08 | [Roadmap & Phasing](08-roadmap-and-phasing.md) | Phase 0→3, capability→phase mapping, MVP definition |
| 09 | [Design Decisions & Learnings](09-design-decisions-and-learnings.md) | ADR-style decisions; prototype constraints **not** to carry forward |

**Capabilities** live in [`capabilities/`](capabilities/), one file per capability, using
[`_CAPABILITY-TEMPLATE.md`](_CAPABILITY-TEMPLATE.md).

---

## Capability catalog

Each capability has a stable ID (`CAP-NN`). Requirements inside are numbered
`FR-<area>-n` (functional), `BR-<area>-n` (business rule), `AC` (acceptance criteria, Given/When/Then).

| ID | Capability | Area | Phase | Spec |
|---|---|---|---|---|
| CAP-01 | Identity & Access | Foundation | P1 | [file](capabilities/CAP-01-identity-and-access.md) |
| CAP-02 | Delivery Cockpit (Home) | Foundation | P1 | [file](capabilities/CAP-02-delivery-cockpit.md) |
| CAP-03 | SSD IQ Explorer | Foundation | P1 | [file](capabilities/CAP-03-ssd-iq-explorer.md) |
| CAP-18 | Compass Copilot | Foundation | P2 | [file](capabilities/CAP-18-compass-copilot.md) |
| CAP-04 | Engagements & Dispatch | Delivery | P1 | [file](capabilities/CAP-04-engagements-and-dispatch.md) |
| CAP-05 | Reports Pending & T-3W Proactive | Delivery | P1 | [file](capabilities/CAP-05-reports-pending-t3w.md) |
| CAP-06 | Agentic Delivery | Delivery | P3 | [file](capabilities/CAP-06-agentic-delivery.md) |
| CAP-07 | PODs & People | Workforce | P1 | [file](capabilities/CAP-07-pods-and-people.md) |
| CAP-08 | Capacity & Forecasting | Workforce | P2 | [file](capabilities/CAP-08-capacity-and-forecasting.md) |
| CAP-09 | Partner CSA Lifecycle | Workforce | P1 | [file](capabilities/CAP-09-partner-csa-lifecycle.md) |
| CAP-10 | Delivery Partners | Workforce | P2 | [file](capabilities/CAP-10-delivery-partners.md) |
| CAP-11 | Enablement | Workforce | P2 | [file](capabilities/CAP-11-enablement.md) |
| CAP-12 | Quality & CPE | Quality & Risk | P1 | [file](capabilities/CAP-12-quality-and-cpe.md) |
| CAP-13 | Escalations & Actions | Quality & Risk | P1 | [file](capabilities/CAP-13-escalations-and-actions.md) |
| CAP-14 | Performance & PIPs | Quality & Risk | P2 | [file](capabilities/CAP-14-performance-and-pips.md) |
| CAP-15 | Sentiment | Quality & Risk | P2 | [file](capabilities/CAP-15-sentiment.md) |
| CAP-16 | Messages Console | Comms & Insight | P1 | [file](capabilities/CAP-16-messages-console.md) |
| CAP-17 | Reporting, Territory & MBR | Comms & Insight | P1 | [file](capabilities/CAP-17-reporting-and-mbr.md) |

---

## Spec conventions

- **Requirement IDs** are stable and referenceable: `FR-DISPATCH-3`, `BR-QUALITY-2`, `NFR-PERF-1`.
- **Acceptance criteria** use Given/When/Then so they are directly testable.
- **Priority** uses MoSCoW (Must/Should/Could/Won't-yet). **Phase** maps to the [roadmap](08-roadmap-and-phasing.md).
- **Prototype references** point to the source that demonstrates the behaviour (e.g. `scripts/views/engagements.js`).
- **Source of truth (SoT)** is named for every entity/field so production **federates rather than copies**.
- **Responsible AI:** every AI capability is advisory, labelled, evidence-linked, and human-in-the-loop.

## Decision summary (see [09](09-design-decisions-and-learnings.md) for full ADRs)

1. `specs/` supersedes `docs/domains/` as the production source of truth.
2. Specs are **technology-agnostic**; [01-solution-architecture](01-solution-architecture.md) carries the
   **recommended** concrete stack.
3. The prototype's vanilla-JS build and mock data are **Phase-0 constraints only** — not production
   requirements. Production targets a Fluent 2 SPA on a governed data platform with Azure OpenAI.
4. Specs reference concrete target systems (Entra ID, Microsoft Graph, Azure DevOps, Power BI, Microsoft
   Forms, Teams, Viva, Azure OpenAI, Dataverse/Fabric) but contain **no personal names** or confidential
   org specifics; illustrative names are fictional.
