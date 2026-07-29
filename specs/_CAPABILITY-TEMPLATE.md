# Capability: <Name> `CAP-NN`

> One-sentence outcome this capability delivers.

<!-- Copy to capabilities/CAP-NN-<slug>.md and fill every section. Delete this comment. -->

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-NN` |
| Area | Foundation / Delivery / Workforce / Quality & Risk / Comms & Insight |
| Primary personas | <roles> |
| Priority | Must / Should / Could |
| Target phase | P1 / P2 / P3 (see [roadmap](../08-roadmap-and-phasing.md)) |
| Prototype reference | `scripts/views/<file>.js` |
| Depends on | <capabilities / platform docs> |

## 1. Problem & outcome

- **Problem:** <the operational pain today>.
- **Outcome:** <the target end-state when built>.
- **Value:** <why it matters / who benefits>.

## 2. Functional requirements

Testable statements. `FR-<AREA>-n`.

- **FR-<AREA>-1** — The system shall …
- **FR-<AREA>-2** — …

## 3. Business rules

Exact thresholds, formulas, state machines. `BR-<AREA>-n`.

- **BR-<AREA>-1** — …

## 4. User stories & acceptance criteria

### Story: <title>
- **As a** <persona> **I want** <capability> **so that** <value>.
- **AC (Given/When/Then):**
  - Given … When … Then …

## 5. Data & system of record

Entities/fields touched; SoT per the [data model](../02-data-and-system-of-record.md).

| Entity | Fields used | Read/Write | Source of truth |
|---|---|---|---|
| <entity> | <fields> | R / W | <system> |

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Platform ref |
|---|---|---|---|---|
| <feature> | <input> | <output> | advisory/labelled/human-in-loop | [AI platform](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Systems this capability reads/writes (contracts in [integrations](../03-integrations.md)).

## 8. NFR & security notes

Reference [NFRs](../06-non-functional-requirements.md) and
[security](../04-security-privacy-compliance.md); note capability-specific constraints.

## 9. KPIs

Metrics this capability produces/affects (see [KPIs](../07-kpis-and-reporting.md)).

## 10. Open questions & assumptions

- **Q:** … **A (assumption):** …
