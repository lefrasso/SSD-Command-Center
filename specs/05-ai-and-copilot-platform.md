# 05 — AI & Copilot Platform

> The single AI seam for Compass. Every AI capability is grounded on SSD IQ, guarded, labelled,
> evidence-linked and **advisory** — a human always decides. The UI never calls a model directly.

## 1. Principles

- **One seam.** All AI goes through the AI Services layer (prototype: `scripts/ai.js`). Swapping the
  implementation (deterministic mock → Azure OpenAI) must not touch the UI.
- **Grounded.** Production answers are retrieved/generated over **SSD IQ** with **citations**.
- **Guarded.** Content safety, groundedness checks, PII redaction, confidentiality.
- **Advisory + human-in-the-loop.** No automated adverse decisions; agents draft, humans send/decide.
- **Observable + cost-controlled.** Prompt/response/eval/cost/latency logged; models right-sized.

## 2. AI service catalog

The capabilities the platform must expose (prototype implements each as a deterministic function in
`scripts/ai.js`; production grounds them on SSD IQ via Azure OpenAI).

| Service | Purpose | Consuming capability |
|---|---|---|
| Daily briefing | Role-specific headline, bullets, anomaly callouts | [CAP-02 Cockpit](capabilities/CAP-02-delivery-cockpit.md) |
| Ask-your-data | NL Q&A over SSD IQ KPIs, with sources | [CAP-17 Reporting](capabilities/CAP-17-reporting-and-mbr.md), [CAP-18 Copilot](capabilities/CAP-18-compass-copilot.md) |
| Best-fit CSA recommendation | Rank CSAs for an engagement + rationale | [CAP-04 Dispatch](capabilities/CAP-04-engagements-and-dispatch.md) |
| Draft outreach | Draft Day-1 outreach email | [CAP-04 Dispatch](capabilities/CAP-04-engagements-and-dispatch.md) |
| Generate deliverable | Draft a sectioned delivery artifact | [CAP-06 Agentic](capabilities/CAP-06-agentic-delivery.md) |
| Quality auto-score | Score vs CPE Recommended Practices | [CAP-12 Quality](capabilities/CAP-12-quality-and-cpe.md) |
| Classify severity | Suggest escalation severity from text | [CAP-13 Escalations](capabilities/CAP-13-escalations-and-actions.md) |
| Similar cases | Retrieve similar past escalations | [CAP-13 Escalations](capabilities/CAP-13-escalations-and-actions.md) |
| Extract actions | Extract action items from notes | [CAP-13 Escalations](capabilities/CAP-13-escalations-and-actions.md) |
| Draft resolution | Draft escalation resolution summary | [CAP-13 Escalations](capabilities/CAP-13-escalations-and-actions.md) |
| Suggest reply / tone check / thread summary | Message assistance | [CAP-16 Messages](capabilities/CAP-16-messages-console.md) |
| Performance summary (advisory) | Evidence-linked CSA summary | [CAP-14 Performance](capabilities/CAP-14-performance-and-pips.md) |
| MBR narrative / executive summary | Partner + internal MBR text | [CAP-17 Reporting](capabilities/CAP-17-reporting-and-mbr.md) |
| Early warnings | Detect negative-sentiment concentration | [CAP-15 Sentiment](capabilities/CAP-15-sentiment.md) |
| NL record search + data-quality flags | Search + integrity checks | [CAP-03 SSD IQ](capabilities/CAP-03-ssd-iq-explorer.md) |
| Onboarding readiness / offboarding risk | Lifecycle insight | [CAP-09 Lifecycle](capabilities/CAP-09-partner-csa-lifecycle.md) |
| Capacity/coverage insight | Forecast + gaps narrative | [CAP-08 Capacity](capabilities/CAP-08-capacity-and-forecasting.md) |

## 3. Grounding & retrieval

- **RAG over SSD IQ:** retrieve relevant records (partners, CSAs, engagements, escalations, CPE, …)
  and ground generation on them.
- **Citations:** every answer returns `sources[]` (record ids/labels), surfaced in the UI.
- **Freshness:** retrieval respects SSD IQ freshness/source-of-truth.

## 4. Guardrails

| Guardrail | Requirement |
|---|---|
| Labelling | Every AI surface shows an "AI-generated / advisory" chip (`aiChip`). |
| Human-in-the-loop | Drafts require human review before send/decision; no auto-send. |
| Confidentiality | Never surface PIP/confidential data to roles lacking `view:pip`. |
| Content safety | Azure AI Content Safety filtering on inputs/outputs. |
| Groundedness | Reject/flag ungrounded claims; prefer "insufficient data" over fabrication. |
| PII | Redact PII in prompts/logs; honour classification. |
| Fairness | Performance/sentiment AI is advisory; fairness/explainability reviewed. |

## 5. Copilot UX

- **Docked, contextual Copilot** on every screen (prototype: `scripts/copilot.js`), backed by the
  ask-your-data + briefing services. See [CAP-18 Compass Copilot](capabilities/CAP-18-compass-copilot.md).
- Inline AI cards within modules (briefings, insights, recommendations, drafts) — always labelled.

## 6. Evaluation & observability

- **Offline + online evals** (groundedness, helpfulness, safety) as a release gate.
- **Feedback capture** (thumbs up/down) feeding prompt/routing improvements.
- **Telemetry:** prompt/response/eval/cost/latency logged with privacy controls.
- **Cost control:** caching, batching, model right-sizing per task (cheap for classification, stronger
  for narratives).

## 7. Output contract

Every AI service returns a consistent, UI-agnostic shape:

```
{ text | {headline, bullets[], anomalies[]} | {severity} | {score},
  sources: [{ id, label }],
  generatedAt }
```

## 8. Prototype → production gaps

- [ ] Implement the **Azure OpenAI** provider behind the AI seam (swap deterministic fns).
- [ ] **RAG grounding** over SSD IQ with real citations + confidence.
- [ ] **Content safety + groundedness + PII redaction** guardrails.
- [ ] **Evaluation harness** + **telemetry** (quality/latency/cost) + **feedback loop**.
- [ ] Persist reviewed AI artifacts (e.g. finalised MBRs) with provenance.

## 9. References

- Prototype: `scripts/ai.js` (all services), `scripts/copilot.js` (dock), `scripts/components.js` (`aiChip`).
- Related: [02 Data](02-data-and-system-of-record.md), [04 Security](04-security-privacy-compliance.md),
  [CAP-18 Compass Copilot](capabilities/CAP-18-compass-copilot.md).
