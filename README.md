# Compass — SSD Delivery Console

An AI-native, single-pane console that unifies the Delivery Partner lifecycle for Success
Services Delivery (SSD), reading and writing **SSD IQ**, a governed System of Records.

This repository is the **prototype** (phase 0): a clickable, front-end-only console driven
entirely by **fictional mock data**, with AI features **simulated** by deterministic,
data-driven responses that are clearly labelled as AI-generated. No integrations, auth,
persistence, or real data.

## Run it

No install and no build step. You need Node.js only to run the tiny static server.

```powershell
node serve.mjs
```

Then open http://localhost:5173. (`npm start` is an alias and installs nothing.)

## What's built

- **Shell** — Fluent 2 / Microsoft 365 look: 48px command bar (search, Ask Copilot,
  notifications, role switcher), 260px collapsible nav rail, docked contextual Copilot panel.
- **Role switcher** — experience the console as POD Lead, Partner CSA, SDM, DPSM/Operations
  or Business Leadership. Nav and permissions change per persona; Performance & PIPs is
  confidential and role-gated.
- **Home — Delivery Cockpit** — KPI strip, AI daily briefing, needs-attention list, charts,
  and POD health tiles.
- **SSD IQ — System of Records** — catalog of all 11 entities, record tables, a record detail
  drawer with relationships, source-of-truth badges and audit trail, natural-language search,
  and data-quality flags.
- The other nine modules are specified and stubbed for the next phase (no dead ends).

## Stack

Vanilla JavaScript ES modules · hand-written CSS (Fluent 2 look) · Chart.js (vendored) ·
zero-dependency Node static server. Chosen so the prototype runs in a locked-down environment
with no package install. See `SSD-Delivery-Console-Copilot-Build-Spec.md` for the full brief.

## Responsible AI

Every AI output is labelled and, where possible, links to the source records. AI is advisory
and human-in-the-loop — it never makes an automated adverse decision about a person. In
production, `scripts/ai.js` is replaced by Azure OpenAI grounded over SSD IQ (see
`scripts/azureOpenAiStub.js`).