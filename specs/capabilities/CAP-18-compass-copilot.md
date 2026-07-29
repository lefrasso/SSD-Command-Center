# Capability: Compass Copilot `CAP-18`

> The docked, contextual AI assistant available on every screen — grounded on SSD IQ, labelled and
> advisory. The in-app face of the [AI platform](../05-ai-and-copilot-platform.md).

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-18` |
| Area | Foundation |
| Primary personas | All (role-aware) |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/copilot.js`, `scripts/ai.js` (`ask`, `askData`, `dailyBriefing`) |
| Depends on | [05 AI Platform](../05-ai-and-copilot-platform.md), [CAP-03 SSD IQ](CAP-03-ssd-iq-explorer.md) |

## 1. Problem & outcome

- **Problem:** Users need answers about what they're looking at without leaving the screen or building a
  report.
- **Outcome:** A contextual Copilot that answers grounded questions and drafts, everywhere, with sources.
- **Value:** Faster insight; consistent, trustworthy AND labelled assistance.

## 2. Functional requirements

- **FR-COPILOT-1** — Provide a **docked, collapsible Copilot** on every screen, toggled from the command
  bar, contextual to the current view.
- **FR-COPILOT-2** — Answer **natural-language questions** grounded on SSD IQ, returning **cited sources**.
- **FR-COPILOT-3** — Offer a role-specific **briefing** and context-aware suggested prompts.
- **FR-COPILOT-4** — Label every response as **AI-generated / advisory**.
- **FR-COPILOT-5** — Respect the caller's **permissions** (never surface confidential data to
  unauthorised roles).
- **FR-COPILOT-6** — Capture **feedback** (thumbs up/down) on responses (production).

## 3. Business rules

- **BR-COPILOT-1** — Routing: briefing-style prompts → briefing; otherwise ask-your-data (prototype:
  `ask()`).
- **BR-COPILOT-2** — Output contract per [05 §7](../05-ai-and-copilot-platform.md): `{ text, sources[], generatedAt }`.
- **BR-COPILOT-3** — Guardrails per [05 §4](../05-ai-and-copilot-platform.md) (safety, groundedness, PII, confidentiality).

## 4. User stories & acceptance criteria

### Story: Ask in context
- **As a** POD Lead **I want** to ask "CPE trend for <partner>" from any screen **so that** I get a
  grounded answer with citations.
- **AC:**
  - Given I open Copilot and ask a data question, When it answers, Then the answer is labelled and lists
    the SSD IQ records it used.
  - Given I lack `view:pip`, When I ask about PIPs, Then Copilot declines and surfaces no confidential
    data.

## 5. Data & system of record

Reads SSD IQ (all permitted entities) for grounding; persists feedback (production).

## 6. AI touchpoints

Entire capability; see [05](../05-ai-and-copilot-platform.md). Services: ask-your-data, briefing, and
context handoffs to capability-specific services.

## 7. Integrations

Azure OpenAI + retrieval over SSD IQ; content safety. See [03](../03-integrations.md), [05](../05-ai-and-copilot-platform.md).

## 8. NFR & security notes

Latency within UX budget (`NFR-PERF`); permission-aware; observability + cost controls (`NFR-OBS`).

## 9. KPIs

Groundedness, helpfulness (thumbs-up rate), latency p95, cost/interaction.

## 10. Open questions & assumptions

- **Q:** Voice/actions (beyond Q&A)? **A (assumption):** text Q&A + drafting first; actions later.
- **Q:** Model tiering per task? **A:** right-size per [05](../05-ai-and-copilot-platform.md).
