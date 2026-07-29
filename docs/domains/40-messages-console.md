# Domain: Messages Console

> Threaded communication with Partner CSAs — every thread tied to an engagement — with templates and
> AI assist (suggested replies, tone check, thread summaries).

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `messages` |
| Module route | `#/messages` |
| Prototype status | Implemented |
| Primary personas | POD Lead, Partner CSA, SDM |
| Source-of-truth systems (target) | Microsoft Teams / Graph, SSD IQ |
| Upstream domains (depends on) | Engagements (11), SSD IQ (02), AI (03) |
| Downstream domains (consumed by) | Sentiment (33), Escalations (31) |
| Prototype source | `scripts/views/messages.js`, `scripts/store.js` (`addMessage`), `scripts/ai.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Delivery coordination happens in conversations. Anchoring each thread to
  an **engagement** keeps communication in context, and templates + AI make it fast, consistent and
  partner-respectful.
- **Who cares** — POD Leads and CSAs (day-to-day coordination), SDMs (visibility).
- **Definition of done** — Engagement-anchored threads backed by Teams/Graph, with templates and AI
  assistance, feeding sentiment.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| POD Lead | Message CSAs, use templates + AI, summarise |
| Partner CSA | Message POD Lead, use AI replies/tone |
| SDM | Participate/monitor threads |
| DPSM / business-lt | *No module access* |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Thread | A conversation tied to one engagement. |
| Template | A canned message (Dispatch, Reminder, Escalation ack). |
| Tone check | AI assessment of message tone. |
| Thread summary | AI recap of a conversation + sentiment. |

## 5. Data model

**Message** entity (SoT = Teams): `threadId`, `engagementId`, `from`, `to`, `body`, `timestamp`,
`sentiment`. Threads are grouped by `threadId`; thread sentiment is aggregated from messages.

## 6. Features (current prototype)

1. **Split-pane console** — thread list (customer + last message + sentiment) and conversation view.
2. **Templates** — Dispatch, Reminder, Escalation ack pre-fill the composer.
3. **AI assist** — **Suggest reply** (context-aware), **Tone check** (softening advice),
   **Summarize** thread (recap + sentiment).
4. **Send** — appends a message to the thread (`addMessage`); "me" resolves from the active persona.

## 7. User stories

### Epic: Contextual comms
- As **a POD Lead/CSA**, I want threads tied to engagements, so that conversations stay in context.
- As **a POD Lead**, I want templates for common messages, so that dispatch/reminders are fast.

### Epic: AI assist
- As **a CSA**, I want suggested replies and a tone check, so that I respond quickly and respectfully.
- As **a POD Lead**, I want a thread summary, so that I catch up without reading everything.

## 8. Business rules & logic

- **Thread ↔ engagement:** every thread references exactly one engagement.
- **Thread sentiment:** negative if > ⅓ messages negative; else positive if positive ≥ negative; else
  neutral.
- **Suggest reply** (`suggestReply`): blocker/permission language → escalation-oriented reply; else an
  on-track acknowledgement.
- **Tone check** (`toneCheck`): flags urgent/harsh wording and suggests softer phrasing.

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Suggest reply | last message | draft reply | `ai.js → suggestReply` | Grounded model |
| Tone check | draft text | tone assessment + advice | `ai.js → toneCheck` | Model |
| Summarize thread | messages | recap + sentiment | `ai.js → summarizeThread` | Model |

## 10. Screens & UI

- Thread list, conversation bubbles (me/them + meta), composer with template select + AI buttons +
  send; AI note banner.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Microsoft Teams / Graph | Messages/threads | in/out | SoT; real send/receive. |
| SSD IQ | Engagement context | inbound | Thread anchoring. |
| Sentiment service | Score messages | outbound | Feeds [Sentiment](33-sentiment.md). |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Response time | Time to first reply | Minimise |
| Template usage | % messages from templates | Track |
| Negative-thread rate | Threads trending negative | Minimise |

## 13. Non-functional requirements

- **Privacy:** message content governed by workplace policy; access-controlled.
- **Fidelity:** real-time send/receive; delivery/read state (production).
- **Accessibility:** conversation view keyboard/screen-reader friendly.

## 14. Prototype → production gaps

- [ ] **Teams/Graph** integration for real send/receive (vs in-memory append).
- [ ] Real-time updates, delivery/read receipts, attachments.
- [ ] Raise an **escalation** directly from a thread (link to Escalations).
- [ ] Manage **templates** as governed content.
- [ ] Feed message sentiment into the sentiment pipeline.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| MSG-1 | Integration | Teams/Graph send/receive | Must | SoT |
| MSG-2 | Realtime | Live updates + receipts + attachments | Should | Fidelity |
| MSG-3 | Escalate | Raise escalation from thread | Should | Flow |
| MSG-4 | Templates | Governed template management | Could | Consistency |
| MSG-5 | Sentiment | Pipe message sentiment to Sentiment | Should | Early warning |

## 16. Open questions & assumptions

- **Q:** Teams or in-app messaging as SoT? **A (assumption):** Teams/Graph is the SoT; console is a
  focused surface.
- **Q:** Are customers ever in these threads? **A (assumption):** no — internal POD Lead ↔ CSA (+ SDM).

## 17. References

- Prototype source: `scripts/views/messages.js`, `scripts/store.js` (`addMessage`),
  `scripts/ai.js` (`suggestReply`, `toneCheck`, `summarizeThread`).
- Related: [Engagements](11-engagements-and-dispatch.md), [Sentiment](33-sentiment.md),
  [Escalations](31-escalations-and-actions.md).
