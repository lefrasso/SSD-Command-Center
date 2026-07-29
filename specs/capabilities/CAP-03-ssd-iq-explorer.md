# Capability: SSD IQ Explorer `CAP-03`

> Browse, search and inspect every SSD IQ entity — with relationships, source-of-truth badges, audit
> trails and data-quality flags — the governed data surfaced as a catalog.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-03` |
| Area | Foundation |
| Primary personas | All (PIP records gated by `view:pip`) |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/ssdiq.js`, `scripts/ai.js` (`nlSearch`, `dataQualityFlags`) |
| Depends on | [02 Data](../02-data-and-system-of-record.md) |

## 1. Problem & outcome

- **Problem:** There is no shared, governed data surface; records are trapped in silos.
- **Outcome:** A catalog to explore any entity, its relationships, lineage and quality.
- **Value:** Trust, traceability and one shared language for every module and AI answer.

## 2. Functional requirements

- **FR-IQ-1** — Present an entity **catalog** with per-entity counts and **source-of-truth badges**.
- **FR-IQ-2** — Present per-entity **record tables** with entity-appropriate columns and status pills
  (paginated in production).
- **FR-IQ-3** — Present a **record drawer**: full fields, **relationships as navigable links**, and the
  **audit trail**.
- **FR-IQ-4** — Provide **natural-language search** across entities (production: semantic), reachable
  from the global command-bar search.
- **FR-IQ-5** — Present **data-quality flags** with severity and a resolve/assign workflow (production).
- **FR-IQ-6** — Gate the `pips` entity behind `view:pip`.

## 3. Business rules

- **BR-IQ-1** — Governance envelope on every record: `sourceOfTruth`, `updatedAt`, `audit[]`.
- **BR-IQ-2** — Data-quality rules per [02 §6](../02-data-and-system-of-record.md).
- **BR-IQ-3** — Derived fields (partner CPE, partner podIds) recomputed on write.

## 4. User stories & acceptance criteria

### Story: Explore a record
- **As a** POD Lead **I want** to open a partner and navigate to its CSAs/escalations **so that** I
  understand context in one place.
- **AC:** Given I open a Partner record, When I click a related CSA chip, Then the CSA record opens with
  its own relationships.

### Story: Trust the data
- **As a** data steward **I want** each field's source of truth and an audit trail **so that** I know
  where to fix issues.
- **AC:** Given any record, When I view it, Then its source-of-truth badge and audit history are shown.

## 5. Data & system of record

All entities (read); see [02](../02-data-and-system-of-record.md). Writes happen in the owning capability;
Explorer is primarily read + DQ workflow.

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| NL record search | query | ranked entity hits | labelled | [05](../05-ai-and-copilot-platform.md) |
| Data-quality flags | dataset | issues + severity | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Reads federated data from all source systems; see [03](../03-integrations.md).

## 8. NFR & security notes

Pagination/sort/filter/export (`NFR-PERF-4`); PII/field classification; confidential gating (`view:pip`).

## 9. KPIs

Data-quality flags open (→0), freshness within SLA, relationship integrity 100%.

## 10. Open questions & assumptions

- **Q:** Federate vs ingest? **A (assumption):** hybrid — ingest for analytics, federate for live status.
- **Q:** Who owns POD structure? **A (assumption):** SSD IQ owns PODs; others ingested.
