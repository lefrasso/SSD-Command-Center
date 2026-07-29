# Domain: Agentic Delivery

> AI delivery agents that assist every engagement — drafting deliverables from SSD IQ — backed by a
> reusable IP library. **Human-owned: agents draft, the CSA reviews and sends.**

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `agentic` |
| Module route | `#/agentic` |
| Prototype status | Implemented (simulated) |
| Primary personas | All |
| Source-of-truth systems (target) | Azure OpenAI + SSD IQ; IP/asset library |
| Upstream domains (depends on) | Engagements (11), SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Quality (30), Messages (40) |
| Prototype source | `scripts/views/agentic.js`, `scripts/ai.js` (`generateDeliverable`) |

## 2. Purpose & problem statement

- **Why this domain exists** — Much delivery effort is drafting artifacts (assessments, decks,
  runbooks). Agentic Delivery gives each engagement an AI agent that drafts these from the governed
  data, and curates reusable IP so the org stops rebuilding the same assets — while keeping a human
  firmly in control.
- **Who cares** — Partner CSAs (speed/quality), POD Leads/leaders (throughput, consistency, IP reuse).
- **Definition of done** — Per-engagement agents that generate review-ready, grounded deliverables
  from real data and a governed IP library, with human review/approval before anything is sent.

## 3. Personas & permissions

All roles can view agents and generate drafts; the **CSA owns** review and send. AI never sends on a
human's behalf (guardrail).

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Delivery agent | The AI assistant attached to an engagement. |
| Agent status | Queued / In delivery / Drafting deliverable / Complete. |
| Deliverable | A generated, sectioned artifact (exec summary, scope, findings, next steps). |
| IP asset | A reusable playbook/runbook/template/kit/deck by track. |
| Automation coverage | % of engagements that have an agent (not "new"). |

## 5. Data model

- Reuses **Engagement** + **CSA** records; no persisted deliverable in the prototype (drafts are
  transient).
- **IP library** (prototype constant `IP_ASSETS`): `{ name, track, type }` — Landing Zone Playbook,
  Migration Runbook, ESA Template, Copilot Readiness Kit, AI Foundry Enablement Deck, Customer Health
  Scorecard, Plan & Envision Workshop Deck.

## 6. Features (current prototype)

1. **KPIs** — Active delivery agents, Deliverables generated (this session), IP assets, Automation
   coverage %.
2. **Delivery agents table** — active engagements (assigned/in-delivery) with customer, CSA, track,
   program and **agent status**.
3. **Generate deliverable** — per row, produces a sectioned draft in a drawer (Executive summary,
   Scope & success criteria, Findings & recommendations, Next steps & owners) labelled *draft — review
   before sending*; increments the session counter.
4. **IP library** — catalog of reusable assets by type and track.

## 7. User stories

### Epic: Draft with an agent
- As **a Partner CSA**, I want an agent to draft a deliverable from the engagement's data, so that I
  start from 80% instead of a blank page.
- As **a CSA**, I want the draft clearly marked and editable, so that I review and own the final.

### Epic: Reuse IP
- As **a CSA/POD Lead**, I want a governed IP library by track, so that I reuse proven assets instead
  of rebuilding.
- As **a leader**, I want automation-coverage and generation metrics, so that I can see agentic impact.

### Epic: Governance
- As **a risk owner**, I want agents to draft but never send, so that a human always approves.

## 8. Business rules & logic

- **Agent status** (`agentStatus`): Complete if engagement complete; **Drafting deliverable** if
  ≥ half milestones done; **In delivery** if in-delivery; else **Queued**.
- **Automation coverage:** engagements with status ≠ new / total engagements.
- **Deliverable content** (`generateDeliverable`): grounded on customer, track, program, status,
  CSAM, assigned CSA and next milestone due date.
- **Guardrail:** output is a draft; the CSA reviews and sends (no auto-send).

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Generate deliverable | engagement + dataset | sectioned draft + sources | `ai.js → generateDeliverable` | Azure OpenAI grounded on SSD IQ + IP templates |
| Agent orchestration | engagement lifecycle | status + suggested next artifact | modelled by `agentStatus` | Agent framework (tools over SSD IQ) |

## 10. Screens & UI

- KPI grid, delivery-agents table with Generate buttons, deliverable drawer (`pre`-formatted draft),
  IP library catalog tiles.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Azure OpenAI | Drafting/orchestration | outbound | Grounded generation. |
| SSD IQ | Grounding facts | inbound | Customer/engagement/track data. |
| IP/asset repository (SharePoint/Docs) | Reusable templates + generated outputs | in/out | Store approved deliverables. |
| Office/Graph | Export to PPTX/DOCX | outbound | Real artifacts. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Automation coverage | Engagements with an agent | Increase |
| Deliverables generated | Count per period | Track |
| Draft acceptance | % drafts used with minor edits | High |
| IP reuse | Assets reused per engagement | Increase |

## 13. Non-functional requirements

- **Governance:** human review/approval; audit generation + who sent.
- **Grounding/safety:** cite sources; no fabricated facts; content safety.
- **IP governance:** versioning, ownership, access control on assets.

## 14. Prototype → production gaps

- [ ] Real **grounded generation** (Azure OpenAI + retrieval over SSD IQ + IP templates).
- [ ] **Export** to PPTX/DOCX and save to the IP/asset repository with versioning.
- [ ] **Persist** generated deliverables with provenance + review/approval workflow.
- [ ] Manage the **IP library** as real, governed content (CRUD, ownership, access).
- [ ] Multi-step **agent orchestration** (tools: pull data, assemble, QC) with human checkpoints.
- [ ] Tie generated artifacts into **Quality** QC and **Messages** send.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| AG-1 | Generation | Grounded deliverable generation from SSD IQ + templates | Must | Core |
| AG-2 | Export | PPTX/DOCX export + save to repository | Must | Real output |
| AG-3 | Governance | Persist + review/approve + audit | Must | Human-owned |
| AG-4 | IP library | Governed CRUD/versioning/ownership | Should | Reuse |
| AG-5 | Orchestration | Multi-step agent with QC checkpoints | Could | Advanced |

## 16. Open questions & assumptions

- **Q:** Which artifact types are in scope first? **A (assumption):** the IP-library types (ESA
  assessment, Copilot readiness, landing-zone, health scorecard, P&E deck).
- **Q:** Where do approved deliverables live? **A:** the IP/asset repository (SharePoint/Docs).

## 17. References

- Prototype source: `scripts/views/agentic.js`, `scripts/ai.js` (`generateDeliverable`).
- Related: [AI & Copilot](03-ai-and-copilot.md), [Engagements](11-engagements-and-dispatch.md),
  [Quality](30-quality-and-cpe.md).
