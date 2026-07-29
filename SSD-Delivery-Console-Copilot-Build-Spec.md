# SSD Delivery Console — Compass · Copilot Build Specification

**Companion to:** *SSD Delivery Console — Compass · Technical Specification and Prototype Design Brief (Draft v1.0)*
**Purpose:** A build brief written to be executed directly by GitHub Copilot. It turns the vision document into a runnable, clickable prototype.
**Product codenames:** **Compass** (the console) · **SSD IQ** (the System of Records)
**Status:** Prototype build spec — front-end only, mock data, simulated AI.

> **Implementation note (stack pivot).** The delivery organization blocks the public npm registries (a corporate network restriction), so the prototype ships as **vanilla JavaScript ES modules with no build step and no dependencies to install** — Chart.js is vendored locally and the app is served by a tiny zero-dependency Node static server. The **architecture, data model, personas, module specs, and acceptance criteria below remain fully valid** — only the implementation technology changed (see §2, §4, §12). The TypeScript interfaces in §6 describe the record *shape*; the vanilla build implements them as plain JavaScript objects.

---

## 1. Goal & guardrails

Build a **clickable, front-end-only prototype** of Compass that demonstrates all **11 modules** across **5 personas**, driven entirely by **rich mock data**, with **AI features simulated** by deterministic, data-driven responses that are clearly labelled as AI-generated.

**Out of scope (documented as production vision, mocked in build):** live integrations, authentication, persistence, real customer/partner data. All names and figures are fictional.

**Responsible-AI guardrails (load-bearing, not decoration):**
- Every AI output carries an **"AI-generated" chip** and, where possible, links to the source record(s) it summarized.
- **Human-in-the-loop:** AI drafts, scores, and flags; the user decides. No AI output auto-commits an adverse action.
- **Performance & PIPs** is **confidential and role-gated** (POD Lead + HR-equivalent only). It uses fictional data only.

---

## 2. Technology stack

Chosen for a **locked-down environment**: no package install, no build tooling, no runtime CDN dependency.

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | **Vanilla JavaScript (ES modules)** | Runs directly in the browser — no bundler, no transpile, no `npm install` |
| Design system | **Hand-written CSS design tokens (Fluent 2 look)** | Segoe UI, Microsoft blue, 8px cards, WCAG-minded — M365 feel without a component library |
| Routing | **Native hash router** | Deep-linkable single-page shell (`#/module?...`) |
| Charts | **Chart.js (UMD, vendored locally)** | Donut / line / bar; downloaded once to `assets/vendor/` — **no runtime CDN dependency** |
| State | **Small in-memory store module** | Loads mock data once, mutates + re-renders via a lightweight change listener |
| Serving | **`serve.mjs` (Node built-ins only)** | Zero-dependency static server so ES modules load over http |

**Run model:** `node serve.mjs` → open `http://localhost:5173`. No install, no build, no backend. (`npm start` is an alias; it does **not** install anything.)

---

## 3. Logical architecture (shape preserved, layers mocked)

```
Experience layer      →  Compass console (Fluent shell: command bar, nav rail, module views, docked Copilot panel)
AI Services layer     →  src/services/ai/*  (deterministic, templated mocks; Azure OpenAI stub commented)
System of Records     →  SSD IQ = Zustand store hydrated from src/data/*  (single source of truth for all entities)
Integration layer     →  mocked (each field carries a source-of-truth badge)
Source systems        →  Graph, Azure DevOps, Power BI, Forms, MOSA data — represented only as source badges
```

In production these become Dataverse/Fabric (SSD IQ), Azure OpenAI (AI), and federated Graph/ADO/Power BI/Forms integrations. The prototype preserves the *shape* so the path to production is obvious.

---

## 4. Repository structure

```
SSD-Command-Center/
├─ index.html                     # shell: command bar / nav / content / copilot containers; loads Chart.js + bootstrap.js
├─ serve.mjs                      # zero-dependency static server (Node built-ins)
├─ package.json                   # no dependencies; scripts: start/serve = node serve.mjs
├─ SSD-Delivery-Console-Copilot-Build-Spec.md
├─ README.md
├─ styles/
│  ├─ tokens.css                  # design tokens (Microsoft blue, Segoe UI, radii, status colors)
│  ├─ base.css                    # shell layout: command bar, nav rail, content, copilot
│  └─ components.css              # cards, pills, chips, tables, drawer, menus, charts
├─ assets/
│  ├─ compass.svg
│  └─ vendor/chart.umd.min.js     # Chart.js vendored locally (no runtime CDN)
├─ data/
│  └─ generate.js                 # seeded deterministic mock data → exports `dataset`, `TRACKS`
└─ scripts/
   ├─ bootstrap.js                # assembles shell, wires routing / roles / copilot
   ├─ router.js                   # hash router (parseHash / navigate / onRoute)
   ├─ store.js                    # in-memory store + computeKpis + selectors + change listener
   ├─ roles.js                    # 5 personas + can(role, permission)
   ├─ nav.js                      # MODULES registry (path/label/icon/roles/requires/ai/built)
   ├─ icons.js                    # inline SVG icon set (no icon font)
   ├─ components.js               # render helpers: pills, KPI cards, AI chip, source badge, Chart.js wrappers
   ├─ ai.js                       # deterministic AI generators per capability
   ├─ azureOpenAiStub.js          # commented real Azure OpenAI call (documented, unused)
   ├─ copilot.js                  # docked, contextual Copilot panel
   └─ views/
      ├─ home.js                  # Delivery Cockpit (built)
      ├─ ssdiq.js                 # System of Records catalog (built)
      └─ placeholder.js           # the other 9 modules + role-locked Performance & PIPs
```

---

## 5. Design system

- **Layout:** 48px top command bar · 260px collapsible left rail · content column capped ~1440px on a 12-col grid · 8px card radius · subtle shadow.
- **Palette:** Microsoft blue on white + light-grey surfaces. Green / amber / red reserved for **status, severity, and the CPE/sentiment scale** — and **never the only signal** (always pair with icon + label).
- **Type:** Segoe UI throughout (Fluent default), clear heading→body scale.
- **Accessibility (WCAG 2.1 AA):** full keyboard nav, visible focus rings, ≥4.5:1 contrast, aria labelling, no color-only status. Target sub-2s first view.

Implement via a custom Fluent theme in `theme/compassTheme.ts` (brand ramp + semantic status tokens), applied through `<FluentProvider theme={compassTheme}>` in `main.tsx`.

---

## 6. SSD IQ data model (TypeScript)

Every record carries lightweight governance metadata. Define in `store/types.ts`:

```ts
export type Track = 'Scoping (P&E)' | 'Customer Health' | 'ESA' | 'AI Innovation' | 'Cloud';
export type Vendor = 'Concentrix' | 'Convergys' | 'Avanade' | 'Cognizant' | 'Penta' | 'HCL';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Severity = 'sev1' | 'sev2' | 'sev3' | 'sev4';
export type SourceSystem = 'MOSA' | 'Operations' | 'Graph' | 'SSD IQ' | 'Dispatch'
  | 'Azure DevOps' | 'CPE/Forms' | 'Teams' | 'Confidential/HR' | 'AI Services' | 'Power BI';

export interface AuditEntry { at: string; who: string; action: string; field?: string; }
export interface Governed { sourceOfTruth: SourceSystem; updatedAt: string; audit: AuditEntry[]; }

export interface Partner extends Governed {
  id: string; name: string; type: string; region: string;
  cpe: number; deliveries: number; status: 'active' | 'onboarding' | 'exiting';
  contractRef: string; podIds: string[];
}
export interface CSA extends Governed {
  id: string; name: string; vendor: Vendor; partnerId: string; podId: string;
  tracks: Track[]; skills: string[]; capacity: number; utilization: number; // %
  tenureMonths: number;
  lifecycle: 'sourcing' | 'selection' | 'onboarding' | 'active' | 'offboarding';
  cpe: number; quality: number; sentiment: Sentiment;
}
export interface POD extends Governed {
  id: string; name: string; leadName: string; region: string;
  tracks: Track[]; capacity: number; utilization: number;
}
export interface Milestone { label: string; due: string; done: boolean; }
export interface Engagement extends Governed {
  id: string; customer: string; csamName: string; track: Track; program: string;
  assignedTo: string | null; // csa id
  status: 'new' | 'assigned' | 'in-delivery' | 'complete';
  dispatchStage: 'Day 0' | 'Day 1' | 'Day 2' | 'Day 3' | 'engaged';
  outreach: { day0: boolean; day1: boolean; day2: boolean; day3: boolean };
  milestones: Milestone[]; dueDate: string; atRisk: boolean;
}
export interface Escalation extends Governed {
  id: string; engagementId: string; severity: Severity;
  status: 'new' | 'investigating' | 'mitigating' | 'resolved';
  ownerName: string; sdmName: string; adoRef: string;
  opened: string; slaHours: number; actionIds: string[]; summary: string;
}
export interface ActionItem extends Governed {
  id: string; escalationId: string; title: string; ownerName: string;
  due: string; status: 'open' | 'in-progress' | 'done';
}
export interface CPEFeedback extends Governed {
  id: string; engagementId: string; score: number; track: Track;
  verbatim: string; date: string; sentiment: Sentiment;
}
export interface Message extends Governed {
  id: string; threadId: string; engagementId: string | null;
  from: string; to: string; body: string; timestamp: string; sentiment: Sentiment;
}
export interface PIP extends Governed {           // confidential
  id: string; csaId: string; status: 'draft' | 'active' | 'closed';
  opened: string; objectives: string[];
  checkIns: { date: string; note: string }[];
  outcome: 'in-progress' | 'met' | 'not-met';
}
export interface SentimentRollup {
  scope: string; period: string; net: number;
  positive: number; neutral: number; negative: number; themes: string[];
}
export interface Delivery extends Governed {
  id: string; engagementId: string; type: string; completedDate: string; track: Track;
}
```

**Relationships to wire in `data/index.ts`:** `Partner.podIds → POD`, `POD ← CSA.podId`, `Partner ← CSA.partnerId`, `CSA ← Engagement.assignedTo`, `Engagement ← Escalation.engagementId`, `Engagement ← CPEFeedback.engagementId`, `Escalation ← ActionItem.escalationId`, `Engagement ← Delivery.engagementId`, `CSA ← PIP.csaId`, `Message.threadId` groups threads.

---

## 7. Mock data plan (rich & realistic)

Generate interlinked, believable data (fictional names/figures):

- **6 partners:** Concentrix, Convergys, Avanade, Cognizant, Penta, HCL — each with CPE, delivery counts, contract refs, status.
- **8–12 PODs** across regions, aligned to tracks, each with a lead and utilization.
- **40–60 Partner CSAs** distributed across partners/PODs, each with tracks, skills, capacity, utilization (cluster in the 80–90% band), tenure, lifecycle stage, CPE, quality, sentiment.
- **60–100 engagements** across statuses/dispatch stages with milestones, due dates, outreach flags, some `atRisk`.
- **~40 deliveries**, **20–30 escalations** (mixed severity/status, some SLA-breaching) with **action items**, **CPE feedback with verbatims**, **message threads**, **3–5 PIPs**, and **sentiment rollups** by partner/POD/track/period.

Make numbers reconcile with the KPI targets so the cockpit reads true: on-time ≥90%, rolling CPE ≈4.4, utilization 80–90%, open escalations trending down.

---

## 8. Shared component library

`KpiCard` · `StatusPill` · `SeverityPill` · `SentimentPill` · `AiChip` · `SourceBadge` · `DataGrid` (Fluent DataGrid) · `KanbanBoard` (columns + draggable/movable cards) · `Timeline` · `Scorecard` · `DetailPanel` (tabbed) · `IntakeModal` (Fluent Dialog) · `EmptyState` · `charts/{Donut,Line,Bar}` (Recharts) · `CopilotPanel` (docked, collapsible, contextual).

All status/severity/sentiment pills pair **color + icon + text** (never color-only).

---

## 9. AI mock layer

`services/ai/aiMock.ts` exposes deterministic, data-driven generators — realistic output, simulated intelligence:

| Capability | Function (input → output) |
|---|---|
| Daily briefing | `dailyBriefing(role, store)` → prioritized narrative + anomaly callouts |
| Best-fit dispatch | `recommendCSA(engagement, store)` → ranked CSAs by skills/capacity/track + reason |
| Outreach draft | `draftOutreach(engagement)` → email body |
| Suggested reply / tone | `suggestReply(thread)`, `toneCheck(text)` |
| Thread/summary | `summarizeThread(thread)`, `summarize(record)` |
| Quality auto-score | `scoreQuality(engagement)` → score + checklist rationale |
| Escalation triage | `classifySeverity(text)`, `similarCases(esc, store)`, `extractActions(notes)`, `draftResolution(esc)` |
| Performance summary | `performanceSummary(csa, store)` → evidence-linked, **advisory** |
| MBR narrative | `mbrNarrative(partner, period, store)` → deliveries/CPE/escalations/highlights/risks/next steps |
| Ask-your-data | `askData(question, store)` → templated answer (e.g., CPE trend last 3 periods) |
| Sentiment | `scoreSentiment(text)`, `clusterThemes(items)`, `earlyWarnings(store)` |
| Record search / DQ | `nlSearch(query, store)`, `dataQualityFlags(store)` |

Each returns `{ text, sources, generatedAt }`; the UI wraps it with `<AiChip/>`. `azureOpenAiStub.ts` shows the equivalent real call, commented, so the production seam is visible.

---

## 10. Personas & role-based views

`context/RoleContext.tsx` holds the current persona and a `can(permission)` helper. Command-bar **role switcher** changes nav visibility, cockpit content, and permissions.

| Persona | Emphasis | Notable gating |
|---|---|---|
| **POD Lead** (primary) | Everything | Full access incl. Performance & PIPs |
| **Partner CSA** | Own engagements, dispatch, messages, own CPE/quality, onboarding | **No** PIP/Performance of others; no portfolio |
| **SDM** | Escalations & action items, partner health, MBRs | No PIP authoring |
| **DPSM / Operations** | Sourcing, headcount, onboarding/offboarding, capacity | No PIP |
| **Business LT** | Portfolio dashboards, CPE/delivery trends, sentiment, escalation heatmap, MBR roll-ups | Read-mostly; no PIP |

**PIP rule:** `Performance & PIPs` route + nav entry render only when `can('view:pip')` (POD Lead + HR-equivalent). Otherwise a locked/confidential state.

---

## 11. Module specifications

Each module reads/writes SSD IQ via the store and exposes its signature AI capability through the Copilot panel and inline chips.

1. **Home — Delivery Cockpit** — role-aware landing. KPI strip (active engagements, on-time delivery, rolling CPE, open escalations, utilization), AI daily-briefing card, POD health tiles, prioritized action list; quick filters (POD/partner/track); drill-through to any module.
2. **PODs & People** — roster grid (CSA by POD/vendor/tracks/capacity/utilization/tenure/status), capacity heatmap, skills matrix. Assign CSAs, set capacity, view utilization vs target. *AI:* capacity balancing + skill-gap vs demand.
3. **Partner CSA Lifecycle** — Kanban (sourcing→selection→onboarding→active→offboarding) + per-CSA profile with lifecycle timeline. Onboarding task tracker (owners/due); offboarding checklist (access removal, KT, vendor validation). *AI:* onboarding readiness score + offboarding-risk flags.
4. **Engagements & Dispatch** — dispatch board (new→assigned→in-delivery→complete) + engagement detail (customer, CSAM, track, milestones, artifacts, Day 0–3 outreach). Assignment respects capacity. *AI:* best-fit CSA + outreach draft; at-risk signal.
5. **Messages Console** — threaded comms tied to engagement/escalation/CSA. Template library. *AI:* suggested replies, tone check, thread summary, per-thread sentiment badge.
6. **Quality & CPE** — score engagements vs Proactive Delivery CPE Recommended Practices checklist; record/trend CPE by CSA/partner/track. *AI:* auto-score from artifacts, explain score movers, coaching tips.
7. **Escalations & Actions** — intake form → triage board (new→investigating→mitigating→resolved) + detail (severity, owner, SDM, timeline, ADO cross-link, action items). SLA timers. *AI:* auto-severity, similar-case retrieval, action extraction, resolution draft.
8. **Performance & PIPs** *(confidential, role-gated)* — composite scorecard (delivery/CPE/quality/escalations/sentiment), coaching log, structured PIP workflow (objectives, milestones, check-ins, evidence). *AI:* evidence-linked summaries + suggested objectives — **advisory only, never an automated decision**.
9. **Reporting & AI** — MBR generator: pick partner + period → draft narrative (deliveries, CPE, escalations, highlights, risks, next steps). Ask-your-data box. Trend/outlier detection.
10. **Sentiment** — cross-channel analysis over messages/CPE verbatims/escalation notes/CSAM feedback; breakdown by partner/POD/track/time; theme extraction; alert feed for negative shifts, correlated with CPE/escalations.
11. **SSD IQ — System of Records** — catalog: browse/search any entity, inspect record + relationships, source-of-truth badges, audit trail. *AI:* natural-language record search + data-quality flags.

---

## 12. Build sequence (phased)

**Phase 0 — Foundation**
1. Scaffold Vite + React + TS; install Fluent UI v9, react-router-dom, recharts, zustand; add `compassTheme`; build the shell (CommandBar 48px, NavRail 260px collapsible, content area, docked CopilotPanel) with HashRouter + 11 route stubs.
2. Define `store/types.ts` + `useStore.ts`; generate rich interlinked mock data in `data/`; hydrate store on boot.
3. Build shared component library (section 8).
4. `RoleContext` + role switcher + `can()` gating.
5. AI mock service (section 9) + Copilot panel wiring + `AiChip`.

**Phase 1 — First slice**
6. Home — Delivery Cockpit.
7. SSD IQ — System of Records catalog.

**Phase 2 — Remaining modules (one at a time)**
8. PODs & People · 9. Partner CSA Lifecycle · 10. Engagements & Dispatch · 11. Messages Console · 12. Quality & CPE · 13. Escalations & Actions · 14. Performance & PIPs (role-gated) · 15. Reporting & AI · 16. Sentiment.

**Phase 3 — Polish**
17. Contextual Copilot per view, accessibility pass, empty states, toasts, responsive behavior.

---

## 13. Acceptance criteria ("done" for the prototype)

- All **11 modules** reachable from the nav rail and via deep links (`#/module/...`); no dead ends.
- **Role switcher** changes views and permissions; **Performance & PIPs** is hidden/locked for non-authorized personas.
- KPIs, grids, boards, and charts render **from mock data** and reconcile with stated targets.
- **MBR generator** produces a full narrative for a chosen partner + period; **ask-your-data** answers sample questions (e.g., a partner's CPE trend across the last three periods).
- Every AI output shows an **"AI-generated" chip**; performance/sentiment outputs are framed as **advisory**.
- **Accessibility:** keyboard navigable, visible focus, no color-only status, aria labels present.
- Runs with `npm run dev`; builds with `npm run build`.

---

## 14. Notes for the builder

- Keep AI outputs deterministic and sourced so demos are repeatable.
- Prefer Fluent components and tokens over custom CSS; extend the theme rather than overriding it.
- Keep the production seam visible: mocked layers mirror the logical architecture, and `azureOpenAiStub.ts` documents the real call.
- No real personal data; all partners/CSAs are fictional.

*Compass and SSD IQ — a prototype specification built to show the SSD Leadership Team the art of the possible.*
