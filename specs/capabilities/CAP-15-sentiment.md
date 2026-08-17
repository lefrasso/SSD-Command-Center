# Capability: Sentiment `CAP-15`

> D365-inspired, cross-channel sentiment over messages, CPE verbatims and escalation notes — scored
> on seven intensity levels with supervisor monitoring, topic drivers and actionable alerts.

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
- **Outcome:** Interaction-level sentiment, trend/intensity, topic drivers, multilingual metadata and
  supervisor alerts correlated with engagements, CPE and escalations.
- **Value:** Act before a dip becomes a bad survey.

## 2. Functional requirements

- **FR-SEN-1** — Score each eligible interaction with a normalized score (-1..1), confidence and one of
  seven levels: Very positive, Positive, Slightly positive, Neutral, Slightly negative, Negative,
  Very negative.
- **FR-SEN-2** — Show KPIs for sentiment index, negative engagements, open alerts, scored interactions,
  average confidence and translated signals.
- **FR-SEN-3** — **Overview:** seven-level distribution, trend, channel comparison, supervisor early
  warning and conversations needing attention.
- **FR-SEN-4** — **Live monitor:** latest signal per engagement with intensity, direction/delta, channel,
  partner, language/translation, confidence, topics and alert status.
- **FR-SEN-5** — **Topics & drivers:** volume, impacted engagements, sentiment index, negative share and
  strength/monitor/negative-driver classification.
- **FR-SEN-6** — **Alerts:** open/critical/acknowledged counts, rapid declines and a prioritized queue.
- **FR-SEN-7** — Signal detail shall show source, score/confidence, topics and interaction timeline, with
  supervisor actions to acknowledge, assign an action or open the engagement.
- **FR-SEN-8** — Analysis policy shall identify enabled channels, translation behavior, unsupported
  languages and profanity override.
- **FR-SEN-9** — Expose signals and engagement/partner relationships in SSD IQ and global search.

## 3. Business rules

- **BR-SEN-1** — Sentiment index = mean(signal score) × 100 for the selected filter context.
- **BR-SEN-2** — Intensity boundaries: ≥0.75 Very positive; ≥0.4 Positive; ≥0.15 Slightly positive;
  (-0.15,0.15) Neutral; ≤-0.15 Slightly negative; ≤-0.4 Negative; ≤-0.75 Very negative.
- **BR-SEN-3** — Open alerts are created at score ≤-0.55; score ≤-0.75 is Critical.
- **BR-SEN-4** — Trend compares the latest two signals for an engagement; delta beyond ±8 points is
  rising/falling, otherwise flat. A decline beyond 35 points contributes to early warning.
- **BR-SEN-5** — Non-English supported interactions are translated before scoring and labelled;
  unsupported languages remain unscored. English profanity forces Negative/Very negative.
- **BR-SEN-6** — Acknowledgement records actor/time and does not alter the underlying score.

## 4. User stories & acceptance criteria

### Story: Early warning
- **As a** POD Lead **I want** an alert when negativity concentrates **so that** I act before CPE drops.
- **AC:** Given negative signals concentrate in a track, When the early-warning renders, Then it names the
  track and prompts correlation with escalations; (production) routes an alert to the owner.

## 5. Data & system of record

**Sentiment Signal** and **Sentiment Rollup** (AI Services SoT), related to Engagement, Partner and
source Message/CPE/Escalation records.

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Ref |
|---|---|---|---|---|
| Sentiment scoring | text + language/channel | seven-level score + confidence | labelled, unsupported explicit | [05](../05-ai-and-copilot-platform.md) |
| Theme clustering | scored text | topics, volume, negative share | labelled | [05](../05-ai-and-copilot-platform.md) |
| Early warning | negative intensity + trend | prioritized supervisor alert | advisory, human acknowledgement | [05](../05-ai-and-copilot-platform.md) |

## 7. Integrations

Azure AI Language/approved sentiment service; Translator for supported non-English interactions; Teams
(messages), CPE/Forms (verbatims), ADO (escalation notes), Azure DevOps/SSD IQ (actions). See [03](../03-integrations.md).

## 8. NFR & security notes

Verbatims/messages may contain PII/customer data — govern access + purpose limitation; validated model +
drift monitoring; explainable warnings.

## 9. KPIs

Sentiment index (≥0, rising), negative-engagement count (down), alert acknowledgement time, open
critical alerts (→0), scoring coverage/confidence, negative-driver share.

## 10. Open questions & assumptions

- **Q:** Which channels first? **A (assumption):** Teams messages + CPE verbatims, then escalation notes.
- **Q:** Privacy stance on message analysis? **A:** per workplace data-use policy.

Design reference: Microsoft Learn, [Configure sentiment analysis for emails](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-sentiment-analysis)
(seven intensity levels, multilingual translation/scoring, unsupported-language behavior and profanity override).
