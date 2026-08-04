# Capability: Messages Console `CAP-16`

> Threaded communication with Partner CSAs — every thread tied to an engagement — with templates and AI
> assist (suggested replies, tone check, thread summaries).

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-16` |
| Area | Comms & Insight |
| Primary personas | POD Lead, Partner CSA, SDM |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/views/messages.js`, `scripts/store.js` (`addMessage`), `scripts/ai.js` |
| Depends on | [CAP-04 Dispatch](CAP-04-engagements-and-dispatch.md), [03 Integrations](../03-integrations.md) |

## 1. Problem & outcome

- **Problem:** Delivery coordination happens in scattered conversations, disconnected from engagements.
- **Outcome:** Teams-backed threads tied to engagements, with templates and AI assistance, feeding
  sentiment and escalations.
- **Value:** Faster, consistent communication; conversation as a first-class signal.

## 2. Functional requirements

- **FR-MSG-1** — Present a **threaded console**: thread list (customer, last message, sentiment) +
  conversation pane + composer.
- **FR-MSG-2** — Tie every thread to an **engagement**.
- **FR-MSG-3** — Provide **templates** (Dispatch, Reminder, Escalation ack).
- **FR-MSG-4** — Provide AI **suggest reply**, **tone check**, **thread summary**.
- **FR-MSG-5** — **Send** persists to Microsoft **Teams** (SoT) in production; support attachments,
  delivery/read state.
- **FR-MSG-6** — Allow raising an **escalation** from a thread (production).
- **FR-MSG-7** — **Assign & track action items** from a thread or a specific message: capture title, owner,
  due date and status (open / in-progress / done), with an AI **suggest-from-thread** prefill. Open
  actions surface on the Delivery Cockpit ([CAP-02](CAP-02-delivery-cockpit.md)) and can be marked done
  from either surface.

## 3. Business rules

- **BR-MSG-1** — Threads without a resolvable engagement are hidden.
- **BR-MSG-2** — Thread sentiment: negative if >1/3 messages negative; else positive if positive ≥
  negative; else neutral.
- **BR-MSG-3** — Suggest-reply: if last message mentions blocker/escalation/permission → escalation-
  oriented; else status-confirmation.
- **BR-MSG-4** — Tone check flags urgent/firm words and suggests softening.
- **BR-MSG-5** — A thread/message **action item** is tied to the thread's engagement; it carries `threadId`
  + `engagementId` (and no `escalationId`), distinguishing it from an escalation action while sharing the
  same Action Item model. Marking done writes through to the Action Item source of truth.

## 4. User stories & acceptance criteria

### Story: In-context comms
- **As a** POD Lead **I want** per-engagement threads with CSAs **so that** conversation stays in context.
- **AC:** Given an engagement thread, When I open it, Then I see its messages and can reply; When I use a
  template, Then the composer is pre-filled.

### Story: AI assist
- **As a** CSA **I want** an AI-suggested reply and tone check **so that** I respond quickly and
  professionally.
- **AC:** Given the latest message, When I request a suggested reply, Then a context-appropriate draft
  appears; When I run tone check, Then I get an assessment with softening advice if firm.

## 5. Data & system of record

| Entity | Fields | R/W | SoT |
|---|---|---|---|
| Message | threadId, engagementId, from, to, body, timestamp, sentiment | R/W | Teams/Graph |
| Action Item | id, threadId, engagementId, title, ownerName, due, status, source | R/W | Azure DevOps / SSD IQ |

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Suggest reply | last message | drafted reply | advisory | [05](../05-ai-and-copilot-platform.md) |
| Tone check | composer text | tone assessment | advisory | [05](../05-ai-and-copilot-platform.md) |
| Summarize thread | messages | recap + sentiment | advisory | [05](../05-ai-and-copilot-platform.md) |
| Suggest action | thread messages | suggested action title | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Microsoft Teams/Graph (threads, send/receive), SSD IQ (engagement/CSA context), sentiment/NLP (feeds
[CAP-15](CAP-15-sentiment.md)). See [03](../03-integrations.md).

## 8. NFR & security notes

Message content governed (privacy/retention); reliable send to SoT; conversation keyboard/SR-friendly.

## 9. KPIs

Response time (down), template usage, negative-thread rate (down), open actions per thread, action
follow-through (done / assigned).

## 10. Open questions & assumptions

- **Q:** Teams as transport or in-app store synced to Teams? **A (assumption):** Teams/Graph is SoT.
- **Q:** Customers ever in-thread? **A (assumption):** no — internal POD ↔ CSA (+ SDM).
