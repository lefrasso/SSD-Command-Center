# Capability: Session Health Signals `CAP-15`

> D365-inspired, cross-channel delivery health scoring over Teams, CPE and escalation signals — scored
> on seven intensity levels with supervisor monitoring, topic drivers and actionable alerts. Attributed
> to a POD/track/channel only — **never to a named customer or engagement** (legal/privacy constraint).

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-15` |
| Area | Quality & Risk |
| Primary personas | POD Lead, CSA Manager, SDM, leadership |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/views/sentiment.js` (`renderSessionHealth`), `scripts/ai.js` (`earlyWarnings`), `scripts/store.js` (`sessionHealthBreakdown`) |
| Depends on | [CAP-16 Messages](CAP-16-messages-console.md), [CAP-12 Quality](CAP-12-quality-and-cpe.md), [CAP-13 Escalations](CAP-13-escalations-and-actions.md) |

## 1. Problem & outcome

- **Problem:** Experience problems show up as delivery-health signals before they hit CPE, but signals
  are scattered.
- **Outcome:** Signal-level health scoring, trend/intensity, topic drivers, multilingual metadata and
  supervisor alerts, correlated with CPE and escalations at the POD/track level.
- **Value:** Act before a dip becomes a bad survey, without ever profiling an individual customer or
  engagement.

## 2. Functional requirements

- **FR-SEN-1** — Score each eligible interaction with a normalized score (-1..1), confidence and one of
  seven levels: Very positive, Positive, Slightly positive, Neutral, Slightly negative, Negative,
  Very negative.
- **FR-SEN-2** — Show KPIs for session health index, PODs needing attention, open alerts, scored
  signals, average confidence and translated signals.
- **FR-SEN-3** — **Overview:** seven-level distribution, trend, channel comparison, supervisor early
  warning and PODs needing attention.
- **FR-SEN-4** — **Live monitor:** latest signal per POD with intensity, direction/delta, channel,
  partner, language/translation, confidence, topics and alert status.
- **FR-SEN-5** — **Topics & drivers:** volume, impacted PODs, session health index, negative share and
  strength/monitor/negative-driver classification.
- **FR-SEN-6** — **Alerts:** open/critical/acknowledged counts, rapid declines and a prioritized queue.
- **FR-SEN-7** — Signal detail shall show POD/track/partner/channel, score/confidence, topics and POD
  trend, with supervisor actions to acknowledge or assign a follow-up action (the assignee chooses any
  related engagement manually — the signal itself carries no engagement/customer link).
- **FR-SEN-8** — Analysis policy shall identify enabled channels, translation behavior, unsupported
  languages and profanity override.
- **FR-SEN-9** — Expose signals and POD/partner relationships (never engagement/customer) in SSD IQ and
  global search.

## 3. Business rules

- **BR-SEN-1** — Session health index = mean(signal score) × 100 for the selected filter context.
- **BR-SEN-2** — Intensity boundaries: ≥0.75 Very positive; ≥0.4 Positive; ≥0.15 Slightly positive;
  (-0.15,0.15) Neutral; ≤-0.15 Slightly negative; ≤-0.4 Negative; ≤-0.75 Very negative.
- **BR-SEN-3** — Open alerts are created at score ≤-0.55; score ≤-0.75 is Critical.
- **BR-SEN-4** — Trend compares the latest two signals for a POD; delta beyond ±8 points is
  rising/falling, otherwise flat. A decline beyond 35 points contributes to early warning.
- **BR-SEN-5** — Non-English supported interactions are translated before scoring and labelled;
  unsupported languages remain unscored. English profanity forces Negative/Very negative.
- **BR-SEN-6** — Acknowledgement records actor/time and does not alter the underlying score.
- **BR-SEN-7 (legal/privacy, hard constraint)** — A signal must never carry or be joinable to an
  `engagementId` or a customer identifier, and must never store verbatim customer text; only a
  generic, non-identifying note is retained.

## 4. User stories & acceptance criteria

### Story: Early warning
- **As a** POD Lead **I want** an alert when negativity concentrates **so that** I act before CPE drops.
- **AC:** Given negative signals concentrate in a track, When the early-warning renders, Then it names the
  track and prompts correlation with escalations; (production) routes an alert to the owner.

## 5. Data & system of record

**Session Health Signal** and **Sentiment Rollup** (AI Services SoT), related to POD and Partner only —
never to Engagement or a customer identifier — plus the source Message/CPE/Escalation records used to
compute (not store) the score.

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

**Legal/privacy (hard constraint):** signals must never be attributed to, or joinable with, a specific
customer or engagement record, and must never store verbatim customer text — scoring and display are
POD/track/channel-level only. CPE verbatims themselves remain governed separately by [CAP-12 Quality &
CPE](CAP-12-quality-and-cpe.md), which is engagement-scoped by design as an established system of
record. Validated model + drift monitoring; explainable warnings.

## 9. KPIs

Session health index (≥0, rising), PODs-needing-attention count (down), alert acknowledgement time, open
critical alerts (→0), scoring coverage/confidence, negative-driver share.

## 10. Open questions & assumptions

- **Q:** Which channels first? **A (assumption):** Teams messages + CPE verbatims, then escalation notes.
- **Q:** Privacy stance on message analysis? **A:** per workplace data-use policy.

Design reference: Microsoft Learn, [Configure sentiment analysis for emails](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-sentiment-analysis)
(seven intensity levels, multilingual translation/scoring, unsupported-language behavior and profanity override).
