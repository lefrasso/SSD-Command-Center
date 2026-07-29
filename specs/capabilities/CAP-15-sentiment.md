# Capability: Sentiment `CAP-15`

> Cross-channel sentiment over messages, CPE verbatims and escalation notes — theme-clustered and
> correlated with CPE and escalations for actionable **early warnings**.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-15` |
| Area | Quality & Risk |
| Primary personas | POD Lead, CSA Manager, SDM, leadership |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/views/sentiment.js`, `scripts/ai.js` (`earlyWarnings`), `scripts/store.js` (`sentimentBreakdown`) |
| Depends on | [CAP-16 Messages](CAP-16-messages-console.md), [CAP-12 Quality](CAP-12-quality-and-cpe.md), [CAP-13 Escalations](CAP-13-escalations-and-actions.md) |

## 1. Problem & outcome

- **Problem:** Experience problems show up as sentiment before they hit CPE, but signals are scattered.
- **Outcome:** Aggregated sentiment, theme clusters, and early warnings correlated with CPE/escalations.
- **Value:** Act before a dip becomes a bad survey.

## 2. Functional requirements

- **FR-SEN-1** — Show KPIs: net sentiment, positive signals, negative signals.
- **FR-SEN-2** — Show charts: sentiment mix, net trend, net by partner, net by track.
- **FR-SEN-3** — Show **theme clusters** and **negative signals to review** (verbatims).
- **FR-SEN-4** — Provide AI **early-warning** on negative-sentiment concentration.
- **FR-SEN-5** — Real **NLP sentiment + topic modelling** across channels (production).
- **FR-SEN-6** — **Correlate** sentiment ↔ CPE ↔ escalations with drill-through and **alerting** (production).

## 3. Business rules

- **BR-SEN-1** — Net sentiment (live) = (positive − negative) / total × 100 over messages + CPE.
- **BR-SEN-2** — Sentiment from CPE score: ≥4.3 positive, ≥3.6 neutral, else negative.
- **BR-SEN-3** — Early warning = largest negative cluster by track.

## 4. User stories & acceptance criteria

### Story: Early warning
- **As a** POD Lead **I want** an alert when negativity concentrates **so that** I act before CPE drops.
- **AC:** Given negative signals concentrate in a track, When the early-warning renders, Then it names the
  track and prompts correlation with escalations; (production) routes an alert to the owner.

## 5. Data & system of record

**Sentiment Rollup** (AI Services SoT); live breakdown from **Message** + **CPE** sentiment.

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Sentiment scoring | text signals | pos/neu/neg | labelled | [05](../05-ai-and-copilot-platform.md) |
| Theme clustering | text | top themes | labelled | [05](../05-ai-and-copilot-platform.md) |
| Early warning | negatives | concentration alert | advisory | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

NLP/sentiment service; Teams (messages), CPE/Forms (verbatims), ADO (escalation notes). See [03](../03-integrations.md).

## 8. NFR & security notes

Verbatims/messages may contain PII/customer data — govern access + purpose limitation; validated model +
drift monitoring; explainable warnings.

## 9. KPIs

Net sentiment (≥0, rising), negative signals (down), early warnings open (→0).

## 10. Open questions & assumptions

- **Q:** Which channels first? **A (assumption):** Teams messages + CPE verbatims, then escalation notes.
- **Q:** Privacy stance on message analysis? **A:** per workplace data-use policy.
