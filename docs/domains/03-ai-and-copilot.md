# Domain: AI & Copilot

> The simulated AI services layer and the contextual Copilot. Every AI surface is deterministic and
> labelled today; the production seam is Azure OpenAI grounded over SSD IQ. **AI is advisory — a human
> always decides.**

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `ai` |
| Module route | Copilot dock (all routes) + inline AI in most modules |
| Prototype status | Implemented (simulated / deterministic) |
| Primary personas | All (role-aware outputs) |
| Source-of-truth systems (target) | Azure OpenAI + SSD IQ (grounding) |
| Upstream domains (depends on) | SSD IQ (02), Identity/RBAC (01) |
| Downstream domains (consumed by) | Home, Engagements, Reports Pending, Agentic, Quality, Escalations, Performance, Sentiment, Messages, Reporting |
| Prototype source | `scripts/ai.js`, `scripts/copilot.js`, `aiChip()` in `scripts/components.js` |

## 2. Purpose & problem statement

- **Why this domain exists** — Compass promises AI assistance on every screen: briefings,
  recommendations, drafting, classification, summarisation and Q&A. This domain centralises those
  capabilities behind one interface so the UI never calls a model directly and so guardrails
  (labelling, "human decides") are consistent.
- **Who cares** — All personas benefit; risk/compliance care about guardrails and grounding.
- **Definition of done** — A production AI service that grounds Azure OpenAI on SSD IQ, returns
  cited/sourced answers, enforces guardrails, and is observable and cost-controlled.

## 3. Personas & permissions

AI outputs are **role-aware** (e.g. the daily briefing differs per persona) and respect the same data
permissions as the caller. AI never surfaces confidential data (PIPs) to roles lacking `view:pip`,
and never makes personnel decisions.

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| AI Services layer | `ai.js` — all AI functions; the single production seam. |
| Copilot dock | `copilot.js` — the docked, contextual assistant panel. |
| `aiChip` | The "AI-generated / advisory" label stamped on every AI output. |
| Grounding | Constraining model output to SSD IQ facts (production). |
| Source citation | The record ids/labels an answer is based on (`sources[]`). |

## 5. Data model

AI holds no records; it **reads** SSD IQ and returns transient results shaped as:

```
{ text | headline/bullets/anomalies | severity | score, sources: [{id,label}], generatedAt }
```

The only persisted AI-derived data is the **Sentiment Rollup** entity in SSD IQ.

## 6. Features (current prototype)

The AI Services layer (`ai.js`) exposes these functions. All are deterministic and data-driven.

| Function | Purpose | Consumed by |
|---|---|---|
| `dailyBriefing(role, d)` | Role-specific headline, bullets, anomaly callouts, sources | Home / Cockpit |
| `ask(prompt, role, d)` | Router: briefing-style answer or `askData` | Copilot dock |
| `askData(question, d)` | NL Q&A over KPIs (CPE, escalations, utilization, on-time, sentiment) | Reporting (Ask), Copilot |
| `recommendCSA(engagement, d)` | Best-fit CSA ranking with rationale | Engagements & Dispatch |
| `draftOutreach(engagement, d)` | Draft Day-1 outreach email | Engagements & Dispatch |
| `generateDeliverable(engagement, d)` | Draft a sectioned delivery artifact | Agentic Delivery |
| `scoreQuality(engagement)` | Auto-score vs CPE Recommended Practices | Quality & CPE |
| `classifySeverity(notes)` | Suggest escalation severity from text | Escalations (intake) |
| `similarCases(escId, d)` | Retrieve similar past escalations | Escalations |
| `extractActions(notes)` | Extract action items from notes | Escalations |
| `draftResolution(escId, d)` | Draft an escalation resolution summary | Escalations |
| `suggestReply(lastBody)` | Suggest a message reply | Messages Console |
| `toneCheck(text)` | Assess tone / suggest softening | Messages Console |
| `summarizeThread(msgs)` | Summarise a conversation thread | Messages Console |
| `performanceSummary(csa, d)` | Advisory performance summary (evidence-linked) | Performance & PIPs |
| `mbrNarrative(partner, period, d)` | Partner MBR narrative | Reporting (MBR) |
| `execSummary(d)` | Executive narrative over portfolio KPIs | Reporting (Exec) + Business MBR |
| `earlyWarnings(d)` | Detect negative-sentiment concentration | Sentiment |
| `nlSearch(query, d)` | Entity search | SSD IQ + global search |
| `dataQualityFlags(d)` | Data-quality rule checks | SSD IQ |

**Copilot dock** (`copilot.js`): a docked, contextual panel toggled from the command bar, backed by
`ask()`; every response is stamped with `aiChip`.

## 7. User stories

### Epic: Copilot everywhere
- As **any user**, I want a contextual Copilot on every screen, so that I can ask about what I'm
  looking at without leaving it.
- As **any user**, I want each AI answer clearly labelled and sourced, so that I know it is advisory
  and where it came from.

### Epic: Grounded answers
- As **a POD Lead**, I want to ask "CPE trend for Avanade" and get a grounded answer with citations,
  so that I can trust and trace it.
- As **a leader**, I want a role-specific daily briefing, so that I see what matters to me first.

### Epic: Drafting & classification
- As **a Partner CSA**, I want AI to draft outreach/replies and check tone, so that I communicate
  faster and better.
- As **a POD Lead/SDM**, I want AI to classify severity, extract actions and draft resolutions, so
  that escalation handling is quicker and more consistent.

## 8. Business rules & logic

- **Guardrail:** every output is advisory and labelled (`aiChip`); a human decides. No automated
  personnel or dispatch decisions.
- **Role-awareness:** `dailyBriefing` branches per persona; outputs respect the caller's data scope.
- **Determinism (prototype):** outputs derive from seeded data + rules, so demos are reproducible.
- **Sources:** functions return `sources[]` (record ids/labels) to model production citations.
- **Recommendation scoring (example):** `recommendCSA` ranks active CSAs on the track by
  `headroom×2 + cpe + quality − utilization/50`, top 3.

## 9. AI capabilities → production seam

| Concern | Prototype | Production |
|---|---|---|
| Model | Deterministic functions in `ai.js` | Azure OpenAI (chat/completions) |
| Grounding | Direct reads of seeded data | Retrieval over SSD IQ (RAG / tools) |
| Citations | `sources[]` from matched records | Cited records + confidence |
| Guardrails | `aiChip` label, advisory copy | Content filters, groundedness checks, PII redaction |
| Observability | none | Prompt/response logging, evals, cost + latency metrics |

## 10. Screens & UI

- **Copilot dock** (right side), toggle in command bar.
- **Inline AI cards** in modules (briefing, insight, recommendations, drafts) — always with
  `aiChip`.
- **AI note banners** (e.g. tone check, thread summary in Messages).

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Azure OpenAI | LLM inference | outbound | Chat + embeddings. |
| SSD IQ | Grounding data | inbound | Retrieval / tool calls. |
| Azure AI Content Safety | Guardrails | outbound | Filtering. |
| Telemetry store | Prompt/response + eval logging | outbound | Cost, quality, safety. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Groundedness | % answers supported by cited SSD IQ records | High; monitored |
| Helpfulness | Thumbs-up rate on AI outputs | Trend up |
| Latency | p95 response time | Within UX budget |
| Cost / interaction | Token cost per answer | Within budget |

## 13. Non-functional requirements

- **Safety:** content filtering, groundedness checks, no leakage of confidential data.
- **Privacy:** redact PII in prompts/logs; honour data classification.
- **Transparency:** label every AI surface; show sources; keep "human decides" copy.
- **Observability:** log prompts/responses/evals with privacy controls.
- **Cost control:** caching, batching, model right-sizing.

## 14. Prototype → production gaps

- [ ] Implement the **Azure OpenAI** seam behind `ai.js` (swap deterministic fns for grounded calls).
- [ ] Build **retrieval/grounding** over SSD IQ with real **citations + confidence**.
- [ ] Add **content safety**, **groundedness**, and **PII redaction** guardrails.
- [ ] Add **evaluation** harness (offline + online) and **telemetry** (quality, latency, cost).
- [ ] Add **feedback capture** (thumbs up/down) that trains prompts/routing.
- [ ] Persist selected AI outputs (e.g. MBR narratives) with provenance.

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| AI-1 | Seam | Azure OpenAI provider behind `ai.js` | Must | One interface |
| AI-2 | Grounding | RAG over SSD IQ with citations | Must | Trust |
| AI-3 | Safety | Content filter + groundedness + PII redaction | Must | Compliance |
| AI-4 | Eval | Offline/online eval harness | Should | Quality gate |
| AI-5 | Telemetry | Prompt/response/cost/latency logging | Should | Observability |
| AI-6 | Feedback | Thumbs up/down + routing improvements | Could | Learning loop |

## 16. Open questions & assumptions

- **Q:** Which model tier(s) per task (drafting vs classification vs Q&A)? **A (assumption):**
  right-size per function; cheap for classification, stronger for narratives.
- **Q:** Store AI outputs or regenerate on demand? **A (assumption):** regenerate, persist only
  reviewed artifacts (e.g. finalised MBRs).

## 17. References

- Prototype source: `scripts/ai.js` (all functions), `scripts/copilot.js` (dock),
  `scripts/components.js` (`aiChip`).
- Related: [SSD IQ](02-ssd-iq-system-of-records.md) (grounding), and every consuming domain doc.
