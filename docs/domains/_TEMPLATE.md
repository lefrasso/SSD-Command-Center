# Domain: <Name>

> One-sentence description of the domain and the outcome it delivers.

<!--
HOW TO USE THIS TEMPLATE
- Copy this file to `NN-domain-name.md` and fill every section.
- Keep prototype facts and production intent clearly separated.
- The "User stories" and "Backlog" sections feed the implementation backlog directly.
- Delete this comment block in the finished doc.
-->

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `<id>` |
| Module route | `#/<route>` |
| Prototype status | Implemented / Partial / Planned |
| Primary personas | <roles> |
| Source-of-truth systems (target) | <systems> |
| Upstream domains (depends on) | <domains> |
| Downstream domains (consumed by) | <domains> |
| Prototype source | `scripts/views/<file>.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — the operational problem it solves.
- **Who cares** — the personas and the decisions they make here.
- **Definition of done for the real product** — the outcome that means "built".

## 3. Personas & permissions

| Persona | Can do | Cannot do |
|---|---|---|
| <persona> | <capabilities> | <restrictions> |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| <term> | <definition> |

## 5. Data model

Entities owned or heavily used by this domain. Mark the **source of truth** for each.

| Entity | Key fields | Source of truth | Notes |
|---|---|---|---|
| <entity> | <fields> | <system> | <notes> |

**Relationships:** <describe the important joins / cardinalities>.

## 6. Features (current prototype)

Numbered list of what the prototype does today, grouped by sub-feature. Each item should be verifiable in the running app.

1. **<Feature>** — <what it does>.

## 7. User stories

Written as backlog-ready stories. Group by epic.

### Epic: <name>
- As a **<persona>**, I want **<capability>**, so that **<value>**.

## 8. Business rules & logic

- **Thresholds / bands:** <e.g. utilization healthy band 80–90%>.
- **Formulas:** <how derived metrics are computed>.
- **State machines:** <valid states and transitions>.
- **SLAs / timing:** <time-based rules>.

## 9. AI capabilities

| AI feature | Input | Output | Prototype implementation | Production seam |
|---|---|---|---|---|
| <feature> | <input> | <output> | `ai.js → fn()` (deterministic mock) | Azure OpenAI grounded on SSD IQ |

**Guardrails:** AI is advisory; a human decides. Every AI surface is labelled.

## 10. Screens & UI

- **Views / tabs:** <list>.
- **Drawers / dialogs:** <list>.
- **Charts / visuals:** <list>.
- **Key interactions:** <list>.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| <system> | <role> | inbound / outbound | <notes> |

## 12. KPIs & metrics

| Metric | Definition / formula | Target |
|---|---|---|
| <metric> | <formula> | <target> |

## 13. Non-functional requirements

- **Security & access:** <RBAC, data classification>.
- **Privacy:** <PII, confidentiality>.
- **Auditability:** <what must be logged>.
- **Performance:** <expectations>.
- **Accessibility:** <expectations>.

## 14. Prototype → production gaps

What is mocked today and what must be built for the real product. These are backlog seeds.

- [ ] <gap>

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| <D>-1 | <epic> | <story> | Must / Should / Could | <notes> |

## 16. Open questions & assumptions

- **Q:** <question>
- **A (assumption):** <assumption made in the prototype>

## 17. References

- Prototype source: `scripts/views/<file>.js`, `scripts/…`
- Related domains: <links>
