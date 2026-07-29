# Domain: Sentiment

> Cross-channel sentiment over messages, CPE verbatims and escalation notes — theme-clustered and
> correlated with CPE and escalations for actionable **early warnings**.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `sentiment` |
| Module route | `#/sentiment` |
| Prototype status | Implemented |
| Primary personas | POD Lead, SDM, business-lt |
| Source-of-truth systems (target) | AI Services (NLP), SSD IQ |
| Upstream domains (depends on) | Messages (40), Quality/CPE (30), Escalations (31), AI (03) |
| Downstream domains (consumed by) | Cockpit (10), Reporting (41) |
| Prototype source | `scripts/views/sentiment.js`, `scripts/ai.js` (`earlyWarnings`), `scripts/store.js` (`sentimentBreakdown`) |

## 2. Purpose & problem statement

- **Why this domain exists** — Experience problems show up as sentiment signals before they hit CPE.
  This domain aggregates sentiment across channels, clusters themes and raises early warnings so
  leaders can act before a dip becomes a bad survey.
- **Who cares** — POD Leads, SDMs, TZ/WW leads.
- **Definition of done** — Real NLP sentiment across channels, trend/segment views, theme clustering,
  and early-warning alerts correlated with CPE and escalations.

## 3. Personas & permissions

| Persona | Can do |
|---|---|
| POD Lead / SDM / business-lt | View sentiment, themes, early warnings |
| Partner CSA / DPSM | *No module access* |

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Net sentiment | (positive − negative) / total, as an index. |
| Signal | A sentiment-bearing item (message, verbatim, note). |
| Theme cluster | Recurring topics (e.g. responsiveness, scheduling). |
| Early warning | A detected concentration of negative sentiment. |

## 5. Data model

- **Sentiment Rollup** entity (SoT = AI Services): `scope`, `scopeType` (partner/track), `period`,
  `net`, `positive`, `neutral`, `negative`, `themes[]`.
- Live breakdown derived from **messages** + **CPE** sentiment (`sentimentBreakdown`).

## 6. Features (current prototype)

1. **KPIs** — Net sentiment, positive signals, negative signals.
2. **AI early-warning** — flags the track where negative sentiment concentrates and prompts correlation
   with escalations.
3. **Charts** — sentiment mix (donut), net sentiment trend (line), net by partner (bar), net by track
   (bar).
4. **Theme clusters** — top themes with counts.
5. **Negative signals to review** — recent negative CPE verbatims to action.

## 7. User stories

### Epic: Aggregate sentiment
- As **a leader**, I want net sentiment and its trend, so that I track experience health over time.
- As **a POD Lead**, I want sentiment by partner and track, so that I localise problems.

### Epic: Themes & early warning
- As **an SDM**, I want theme clusters, so that I see what's driving sentiment.
- As **a POD Lead**, I want early warnings when negativity concentrates, so that I act before CPE drops.
- As **a POD Lead**, I want negative verbatims to review, so that I can follow up specifically.

## 8. Business rules & logic

- **Net sentiment (live):** `(positive − negative) / total` × 100 over messages + CPE.
- **Sentiment from CPE score:** ≥ 4.3 positive, ≥ 3.6 neutral, else negative.
- **Early warning** (`earlyWarnings`): group negative CPE by track; the largest cluster is the warning.
- **Rollups:** partner and track sentiment by period (net, mix, themes).

## 9. AI capabilities

| AI feature | Input | Output | Prototype | Production seam |
|---|---|---|---|---|
| Sentiment scoring | messages/verbatims/notes | positive/neutral/negative | modelled (score/keyword) | NLP sentiment service |
| Theme clustering | text signals | top themes | seeded themes | Topic modelling |
| Early warning | negative signals | concentration alert | `ai.js → earlyWarnings` | Anomaly detection |

## 10. Screens & UI

- KPI grid, early-warning card, four charts, theme-cluster chips, negative-signals list.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| NLP/sentiment service | Score text signals | outbound | Real sentiment + themes. |
| Teams | Message signals | inbound | Channel. |
| CPE/Forms | Verbatims | inbound | Channel. |
| Azure DevOps | Escalation notes | inbound | Channel + correlation. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Net sentiment | Index across channels | ≥ 0 and rising |
| Negative signals | Count | Minimise |
| Early warnings open | Unactioned concentrations | Trend to 0 |

## 13. Non-functional requirements

- **Privacy:** verbatims/messages may contain PII/customer data — govern access.
- **Accuracy:** validated NLP model; monitor drift.
- **Explainability:** show the signals behind a warning.

## 14. Prototype → production gaps

- [ ] Real **NLP sentiment + topic modelling** across all channels.
- [ ] **Correlation** engine (sentiment ↔ CPE ↔ escalations) with drill-through.
- [ ] **Alerting** on early warnings (route to owner) + acknowledgement.
- [ ] Per-**engagement/customer** sentiment (not only partner/track).
- [ ] Model monitoring (accuracy, drift, bias).

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| SEN-1 | NLP | Real sentiment + theme modelling | Must | Foundation |
| SEN-2 | Correlation | Sentiment↔CPE↔escalation drill-through | Should | Actionable |
| SEN-3 | Alerting | Route early warnings + ack | Should | Close loop |
| SEN-4 | Granularity | Engagement/customer-level sentiment | Could | Precision |
| SEN-5 | MLOps | Model monitoring | Should | Trust |

## 16. Open questions & assumptions

- **Q:** Which channels are in scope first? **A (assumption):** Teams messages + CPE verbatims, then
  escalation notes.
- **Q:** Privacy stance on message analysis? **A:** must follow workplace data-use policy.

## 17. References

- Prototype source: `scripts/views/sentiment.js`, `scripts/ai.js` (`earlyWarnings`),
  `scripts/store.js` (`sentimentBreakdown`).
- Related: [Messages](40-messages-console.md), [Quality/CPE](30-quality-and-cpe.md),
  [Escalations](31-escalations-and-actions.md), [Delivery Cockpit](10-delivery-cockpit.md).
