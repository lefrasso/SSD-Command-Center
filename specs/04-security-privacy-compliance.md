# 04 — Security, Privacy & Compliance

> Identity, role-based access, data classification, auditing and responsible AI. These are design
> constraints, not afterthoughts — especially for confidential performance data and MOSA/NDA-classified
> partner data.

## 1. Identity & authentication

- **Microsoft Entra ID SSO** for all users. No anonymous access.
- Roles derive from **Entra app roles / group membership** — replacing the prototype's role switcher.
- Support users with **multiple roles** and **TZ/OU scoping** (e.g. an EMEA TZ Lead).

## 2. Roles & RBAC

Five roles (prototype: `scripts/roles.js`). Permissions checked as `can(role, permission)`.

| Permission | pod-lead | partner-csa | sdm | dpsm | business-lt |
|---|:--:|:--:|:--:|:--:|:--:|
| `view:portfolio` | ✅ | — | — | — | ✅ |
| `view:pip` (confidential) | ✅¹ | — | — | — | — |
| `edit:pip` | ✅¹ | — | — | — | — |
| `edit:dispatch` | ✅ | — | — | — | — |
| `edit:escalation` | ✅ | — | ✅ | — | — |
| `edit:capacity` | ✅ | — | — | ✅ | — |
| `view:allPartners` | ✅ | — | ✅ | ✅ | ✅ |
| `run:mbr` | ✅ | — | ✅ | — | ✅ |

¹ Production adds an **HR-equivalent** role for PIP access alongside POD Lead.

**Enforcement:** RBAC is enforced at the **API**, not only in the UI. Navigation hides unpermitted
modules; **deep links** to unpermitted routes are also blocked. See [CAP-01](capabilities/CAP-01-identity-and-access.md).

## 3. Data classification

| Class | Examples | Controls |
|---|---|---|
| **Confidential (personnel)** | PIPs, performance scorecards, coaching logs | `view:pip` only (POD Lead + HR-equivalent); access-logged; least exposure; not on shared surfaces. |
| **MOSA / NDA (partner)** | Partner contracts, CSA identities, utilization | Access-controlled per MOSA/NDA; federated from Operations; no unnecessary duplication. |
| **Customer** | Customer names, CPE verbatims, messages | Governed by workplace + customer data policy; minimise + mask where possible. |
| **Operational** | Engagements, escalations, KPIs | Role-scoped; standard controls. |

## 4. Auditing

- **Immutable audit trail** on every record (`audit[] = {at, who, action}`) and on every write
  (assignment, status change, escalation, message, PIP change).
- **Confidential access logging:** every view/change of PIP/performance data is logged.
- **Periodic access reviews** recertify confidential grants.

## 5. Responsible AI

AI is woven throughout Compass but always **in a supporting role**:

- **Advisory only.** No automated adverse decision about an individual is ever made. Performance and
  sentiment signals are **inputs to a manager's judgement**, not verdicts.
- **Labelled + evidence-linked.** Every AI output carries an "AI-generated" chip and cites its
  sources (SSD IQ records).
- **Human-in-the-loop.** Agents draft; a human reviews and sends/decides.
- **Confidentiality.** AI never surfaces confidential data (PIPs) to roles lacking `view:pip`.
- **Content safety + groundedness.** Azure AI Content Safety filtering; groundedness checks; PII
  redaction in prompts/logs. See [05 — AI & Copilot](05-ai-and-copilot-platform.md).

## 6. Privacy & data protection

- **Minimise PII**; mask where feasible; encrypt in transit and at rest.
- **Purpose limitation** for message/verbatim analysis (sentiment) per workplace data-use policy.
- **Retention** policies per data class; right-to-be-forgotten handling for personnel data.
- **No real personal data of Partner CSAs** in non-production; illustrative names are fictional (the
  prototype uses vanity names — see [ADR-005](09-design-decisions-and-learnings.md)).

## 7. Security requirements (NFR-SEC)

- **NFR-SEC-1** — All routes require Entra ID authentication.
- **NFR-SEC-2** — RBAC enforced at the API; deep links to unpermitted routes blocked.
- **NFR-SEC-3** — Confidential (PIP) data restricted to `view:pip`; all access logged.
- **NFR-SEC-4** — All writes audited with actor + timestamp; audit is immutable.
- **NFR-SEC-5** — Secrets in Key Vault; no secrets in the client; least-privilege service identities.
- **NFR-SEC-6** — MOSA/NDA classification honoured; federate rather than copy partner data.
- **NFR-SEC-7** — Responsible-AI guardrails enforced on every AI surface.
- **NFR-SEC-8** — Periodic access reviews for confidential grants.

## 8. Prototype → production gaps

- [ ] Replace role switcher with **Entra ID** auth + group-derived roles + multi-role/TZ scoping.
- [ ] Enforce RBAC + confidential gates at the **API** and on deep links.
- [ ] Real **audit + confidential access logging**; retention + access reviews.
- [ ] **Content safety / groundedness / PII redaction** for AI.
- [ ] **Field-level classification** + masking in SSD IQ.

## 9. References

- Prototype: `scripts/roles.js`, `scripts/nav.js`, `scripts/views/performance.js` (confidential gating).
- Related: [01 Architecture](01-solution-architecture.md), [02 Data](02-data-and-system-of-record.md),
  [05 AI](05-ai-and-copilot-platform.md), [CAP-01](capabilities/CAP-01-identity-and-access.md),
  [CAP-14](capabilities/CAP-14-performance-and-pips.md).
