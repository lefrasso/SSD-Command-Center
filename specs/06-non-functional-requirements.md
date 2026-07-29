# 06 — Non-Functional Requirements

> Cross-cutting quality attributes every capability must meet. IDs are referenceable (e.g. `NFR-PERF-1`).
> Security NFRs live in [04 — Security, Privacy & Compliance](04-security-privacy-compliance.md).

## 1. Performance (`NFR-PERF`)

- **NFR-PERF-1** — First meaningful view renders in **< 2 seconds** on a warm cache (brief baseline).
- **NFR-PERF-2** — Module route transitions < 1s on warm cache.
- **NFR-PERF-3** — KPI aggregates are **materialised/cached** (not computed client-side at scale);
  the prototype computes them in `scripts/store.js → computeKpis` — production moves this server-side.
- **NFR-PERF-4** — Large entity lists paginate (prototype caps at 60 rows) with server-side sort/filter.
- **NFR-PERF-5** — Charts render without blocking interaction; virtualise long tables.

## 2. Scalability (`NFR-SCALE`)

- **NFR-SCALE-1** — Support all PODs and partners at Phase 2 (10s of PODs, hundreds of CSAs, thousands
  of engagements) without UX degradation.
- **NFR-SCALE-2** — Analytics scale via Fabric/Power BI, decoupled from transactional SSD IQ.
- **NFR-SCALE-3** — AI throughput scales with caching, batching and model right-sizing (see [05](05-ai-and-copilot-platform.md)).

## 3. Availability & reliability (`NFR-REL`)

- **NFR-REL-1** — Target **99.9%** availability for the console (production SLA to confirm).
- **NFR-REL-2** — Graceful degradation: if a source system is down, show cached reads with a staleness
  indicator; never hard-fail the whole console.
- **NFR-REL-3** — Integration resilience: retries, idempotency, backoff, circuit-breaking ([03](03-integrations.md)).
- **NFR-REL-4** — No data loss on writes; write-through to owning systems is transactional/auditable.

## 4. Accessibility (`NFR-A11Y`)

- **NFR-A11Y-1** — **WCAG 2.1 AA**: full keyboard navigation, visible focus, ARIA labelling.
- **NFR-A11Y-2** — Contrast ≥ 4.5:1; **status/severity/sentiment never conveyed by colour alone**
  (labels always present) — honoured in the prototype's pills.
- **NFR-A11Y-3** — Drawers/modals manage focus; charts have text/table equivalents.
- **NFR-A11Y-4** — Light **and** dark themes both meet contrast (dark mode added in the prototype).

## 5. Usability & UX consistency (`NFR-UX`)

- **NFR-UX-1** — Microsoft **Fluent 2** idiom; consistent shell (48px command bar, 260px rail, ~1440px
  content, 8px cards).
- **NFR-UX-2** — Reusable component library (KPI cards, grids, kanban, timelines, scorecards, pills,
  charts, tabs, drawers, toasts, Copilot dock) — see `scripts/components.js`.
- **NFR-UX-3** — Every screen deep-linkable; back/forward native.

## 6. Internationalisation (`NFR-I18N`)

- **NFR-I18N-1** — UI localisable; externalised strings.
- **NFR-I18N-2** — **Language** is a first-class delivery attribute (coverage requires ≥1 CSA per
  program, per language, per TZ — see [CAP-08](capabilities/CAP-08-capacity-and-forecasting.md)).
- **NFR-I18N-3** — Locale-aware dates/numbers; time-zone-aware displays (Americas/EMEA/ASIA + US OUs).

## 7. Observability (`NFR-OBS`)

- **NFR-OBS-1** — Application telemetry (page/feature usage, errors, RUM) via App Insights.
- **NFR-OBS-2** — AI observability: prompt/response/eval/cost/latency logging with privacy controls
  ([05](05-ai-and-copilot-platform.md)).
- **NFR-OBS-3** — Integration health + freshness dashboards; data-quality flag trends ([02](02-data-and-system-of-record.md)).

## 8. Maintainability & delivery (`NFR-MAINT`)

- **NFR-MAINT-1** — Build/bundle with per-route **code-splitting** (prototype has no build step).
- **NFR-MAINT-2** — **Config over code**: leadership org, TZ/OU maps, thresholds and targets are
  configuration, editable without a deploy.
- **NFR-MAINT-3** — IaC + CI/CD; environment-scoped config; progressive rollout by POD/TZ.
- **NFR-MAINT-4** — Automated tests incl. acceptance criteria from capability specs.

## 9. Compliance & data residency (`NFR-COMP`)

- **NFR-COMP-1** — Honour MOSA/NDA classification and workplace/customer data policies ([04](04-security-privacy-compliance.md)).
- **NFR-COMP-2** — Data residency per Microsoft policy; region-appropriate storage.
- **NFR-COMP-3** — Retention + deletion policies per data class.

## 10. References

- Prototype: `styles/*` (design tokens/base/components), `scripts/components.js`, `scripts/store.js`.
- Related: [01 Architecture](01-solution-architecture.md), [04 Security](04-security-privacy-compliance.md),
  [05 AI](05-ai-and-copilot-platform.md).
