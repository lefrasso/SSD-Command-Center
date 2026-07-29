# 09 — Design Decisions & Learnings

> ADR-style record of the decisions made while building the Phase-0 prototype and mining the working
> sessions. Its most important job is to separate **prototype constraints** (which must **not** carry
> into production) from **product decisions** (which should).

## Prototype constraints — do NOT carry into production

| # | Prototype reality | Why it happened | Production intent |
|---|---|---|---|
| 1 | Vanilla JS ES modules, no build step | Build environment blocked package installs (npm registry unreachable) | Fluent 2 SPA (React/Fluent UI) with build/bundle/code-split — [01](01-solution-architecture.md) |
| 2 | Seeded in-memory mock data | Real sources were inaccessible (auth-gated SharePoint/OneDrive/Power BI; MIP-encrypted spreadsheets) | Governed SSD IQ on Dataverse/Fabric with federation — [02](02-data-and-system-of-record.md), [03](03-integrations.md) |
| 3 | Deterministic, scripted AI | No model access in the prototype; determinism aids demos | Azure OpenAI grounded on SSD IQ with guardrails — [05](05-ai-and-copilot-platform.md) |
| 4 | Role switcher | No auth in a static prototype | Entra ID SSO + group-derived roles — [04](04-security-privacy-compliance.md) |
| 5 | Static Node file server | Simplest way to demo | Azure hosting + API + CI/CD |

---

## Architecture Decision Records

### ADR-001 — Prototype uses vanilla JS; production uses a Fluent 2 SPA
- **Status:** Accepted (prototype); superseded for production.
- **Context:** The intended stack was React + Fluent UI, but the local environment blocked package
  installation, so the prototype was rebuilt in dependency-free vanilla JS + CDN Chart.js.
- **Decision:** Ship the prototype in vanilla JS; **do not** treat this as the production stack.
- **Consequence:** The shell, component library, routing and design tokens are proven and portable;
  production re-implements them on React/Fluent (or Blazor/Fluent).

### ADR-002 — Federate to real systems; the integration layer is a first-class workstream
- **Status:** Accepted.
- **Context:** Real delivery data lives across Graph, ADO, Power BI, Forms, MOSA/Operations, HR — and
  was auth-gated/encrypted during prototyping, so representative data was modelled instead.
- **Decision:** SSD IQ **federates** (per-field source of truth); production invests in a dedicated
  integration layer rather than copying data.
- **Consequence:** Every entity records its source of truth; integration contracts are specified in [03](03-integrations.md).

### ADR-003 — One AI seam; grounded, guarded, advisory
- **Status:** Accepted.
- **Context:** AI must be pervasive but trustworthy.
- **Decision:** All AI goes through a single seam (`ai.js` in the prototype). Production swaps it for
  Azure OpenAI grounded on SSD IQ, with content safety, groundedness, PII redaction, labelling and
  human-in-the-loop. No automated adverse decisions about individuals.
- **Consequence:** UI is model-agnostic; guardrails are centralized — [05](05-ai-and-copilot-platform.md).

### ADR-004 — SSD IQ is the single System of Records
- **Status:** Accepted.
- **Context:** SSD's core gap is the absence of a shared system of records; every tool is a silo.
- **Decision:** Every module is a **view over SSD IQ**; no module owns its own private data store.
- **Consequence:** Consistent model, relationships, lineage and quality — [02](02-data-and-system-of-record.md).

### ADR-005 — Fictional vanity names for all people
- **Status:** Accepted.
- **Context:** The prototype originally used real leadership names; this poses a compliance risk for a
  public prototype.
- **Decision:** Replace all real names with **fictional vanity names**; treat the leadership org as
  **configuration**, not code. Illustrative data is always fictional.
- **Consequence:** No personal data in the prototype or specs — [04](04-security-privacy-compliance.md).

### ADR-006 — Elegant dark mode alongside the default light theme
- **Status:** Accepted.
- **Context:** A modern, elegant dark mode was requested while preserving the existing light palette.
- **Decision:** Theme via CSS design tokens (`:root` + `[data-theme="dark"]`), persisted, charts
  theme-aware; light remains the default.
- **Consequence:** Both themes must meet WCAG AA — [06](06-non-functional-requirements.md).

### ADR-007 — Scope grew beyond the original 11 modules
- **Status:** Accepted.
- **Context:** During prototyping the business added requirements that belong in the product.
- **Decision:** Treat these as first-class capabilities: **Territory Ops** (inclusive of US OUs,
  operational), **Reports Pending + T-3W proactive**, **Partner MBR + internal Business MBR**,
  **Agentic Delivery**, **Capacity & Forecasting** (≥1 CSA per language/event/TZ), **Delivery Partner
  management**, and **Enablement** (accreditations, S500 eligibility, SDM onboarding, User Voice,
  shadowing).
- **Consequence:** Reflected in the capability catalog and roadmap; the console reached full capability
  coverage in the prototype.

### ADR-008 — `specs/` supersedes `docs/domains/`
- **Status:** Accepted.
- **Context:** An earlier `docs/domains/` set framed prototype thinking / backlog seeds; a single
  production source of truth is needed.
- **Decision:** `specs/` is authoritative; `docs/domains/` is marked superseded and retained for
  history (not deleted while decisions are pending review).
- **Consequence:** Contributors work from `specs/`; `docs/domains/` may be removed once accepted.

---

## Learnings

- **The operating model is the spec.** Compass mirrors SSD's real lifecycle (pre-hiring → onboarding →
  proactive dispatch → escalation → offboarding); fidelity to that model is what makes it valuable.
- **Proactivity beats reporting.** The highest-leverage capability is preventing pending reports via
  the T-3W / Day 0–3 cadence, not just reporting them after the fact.
- **AI earns trust through grounding + labelling + human control**, not autonomy.
- **Territory must be inclusive.** Time zones globally, **OUs in the US** — grouping must support both.
- **MBR automation is a concrete, high-value win** (partner-facing and internal), including
  presentation-quality export.
- **A governed system of records is the unlock.** Everything else is a view over it.

## References

- Original brief + scope-expansion requirements (mined from working sessions).
- Prototype source across `scripts/`, `data/`, `styles/`.
