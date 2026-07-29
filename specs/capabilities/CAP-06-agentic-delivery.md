# Capability: Agentic Delivery `CAP-06`

> AI delivery agents that assist every engagement — drafting deliverables from SSD IQ — backed by a
> reusable IP library. Human-owned: agents draft, the CSA reviews and sends.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-06` |
| Area | Delivery |
| Primary personas | All personas |
| Priority | Should |
| Target phase | P3 |
| Prototype reference | `scripts/views/agentic.js`, `scripts/ai.js` (`generateDeliverable`) |
| Depends on | [CAP-04 Dispatch](CAP-04-engagements-and-dispatch.md), [05 AI](../05-ai-and-copilot-platform.md) |

## 1. Problem & outcome

- **Problem:** Much delivery effort is drafting artifacts; the org rebuilds the same assets repeatedly.
- **Outcome:** Per-engagement agents that draft review-ready, grounded deliverables from real data, plus
  a governed IP library — with a human firmly in control.
- **Value:** Faster, more consistent delivery; IP reuse; measurable agentic throughput.

## 2. Functional requirements

- **FR-AGENT-1** — Present a **delivery-agents** view of active engagements with an agent status.
- **FR-AGENT-2** — **Generate a deliverable** per engagement: a sectioned draft (executive summary,
  scope & success criteria, findings & recommendations, next steps & owners), labelled *draft — review
  before sending*.
- **FR-AGENT-3** — Provide a governed **IP library** of reusable assets by track (playbooks, runbooks,
  templates, kits, decks).
- **FR-AGENT-4** — **Export** generated deliverables to PPTX/DOCX and save to the IP/asset repository
  with versioning (production).
- **FR-AGENT-5** — **Persist** deliverables with provenance and a review/approval workflow (production).
- **FR-AGENT-6** — Show KPIs: active agents, deliverables generated, IP assets, automation coverage.

## 3. Business rules

- **BR-AGENT-1** — Agent status: Complete if engagement complete; **Drafting deliverable** if ≥ half
  milestones done; **In delivery** if in-delivery; else **Queued**.
- **BR-AGENT-2** — Automation coverage = engagements with an agent (status ≠ new) / total.
- **BR-AGENT-3** — **Guardrail:** output is a draft; the CSA reviews and sends. No auto-send.
- **BR-AGENT-4** — Generation is **grounded** on the engagement's SSD IQ data + IP templates; cite sources.

## 4. User stories & acceptance criteria

### Story: Draft with an agent
- **As a** Partner CSA **I want** an agent to draft a deliverable from the engagement's data **so that**
  I start from 80% not a blank page.
- **AC:**
  - Given an active engagement, When I click Generate deliverable, Then a sectioned, labelled draft opens
    grounded on that engagement's data with cited sources.
  - Given a generated draft, When I review it, Then I can edit/export; nothing is sent automatically.

### Story: Reuse IP
- **As a** POD Lead **I want** a governed IP library by track **so that** we reuse proven assets.
- **AC:** Given the IP library, When I browse by track, Then I see reusable assets with type and owner.

## 5. Data & system of record

Reuses **Engagement** + **CSA**; **IP asset** library (SharePoint/Docs SoT); persisted deliverables with
provenance (production).

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Generate deliverable | engagement + data + IP templates | sectioned draft + sources | advisory/human-sends | [05](../05-ai-and-copilot-platform.md) |
| Agent orchestration | engagement lifecycle | status + next artifact | human checkpoints | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Azure OpenAI (generation), SSD IQ (grounding), SharePoint/Docs (IP + outputs), Office/Graph (export).
See [03](../03-integrations.md).

## 8. NFR & security notes

Governance: review/approval + audit of generation and send; grounding + content safety; IP versioning +
access control.

## 9. KPIs

Automation coverage, deliverables generated, draft acceptance rate, IP reuse.

## 10. Open questions & assumptions

- **Q:** Which artifact types first? **A (assumption):** IP-library types (ESA assessment, Copilot
  readiness, landing zone, health scorecard, P&E deck).
- **Q:** Where do approved deliverables live? **A:** the IP/asset repository (SharePoint/Docs).
