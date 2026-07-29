# Capability: Enablement `CAP-11`

> Accreditations, S500 eligibility, SDM onboarding, User Voice and shadowing management — the skilling
> and readiness backbone for the delivery workforce.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-11` |
| Area | Workforce |
| Primary personas | All (editing restricted to enablement / CSA Manager / POD Lead / Operations Manager) |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/views/enablement.js` |
| Depends on | [CAP-07 PODs](CAP-07-pods-and-people.md), [CAP-09 Lifecycle](CAP-09-partner-csa-lifecycle.md), [CAP-12 Quality](CAP-12-quality-and-cpe.md) |

## 1. Problem & outcome

- **Problem:** Skilled/accredited people, clear premium-program eligibility (S500), well-onboarded SDMs,
  structured shadowing and a field feedback channel are managed ad hoc.
- **Outcome:** Consolidated enablement: accreditation records, rule-based S500 eligibility, SDM
  onboarding, shadowing assignments, and a working User Voice loop.
- **Value:** Delivery quality and readiness; a voice for the field.

## 2. Functional requirements

- **FR-EN-1** — **Accreditations:** show accreditation coverage across CSAs and per-CSA accreditations
  + languages. Each **Program** (service / event) maps 1:1 to an accreditation.
- **FR-EN-2** — **S500 eligibility:** compute eligibility from CPE/quality/tenure with a reason when not
  eligible.
- **FR-EN-3** — **SDM onboarding:** show a structured onboarding path and per-SDM progress.
- **FR-EN-4** — **User Voice:** submit ideas, vote, and track status (New → Under review → Planned → Shipped).
- **FR-EN-5** — **Shadowing:** show mentor/mentee pairs and status.
- **FR-EN-6** — Integrate a real **accreditation** source (with expiry/renewal) and persist S500
  decisions (production).
- **FR-EN-7** — **Service Catalogue:** show the catalogue of services — Family → Program →
  accreditation — with the count of accredited CSAs per Program.

## 3. Business rules

- **BR-EN-1** — S500 eligible ⇔ `cpe ≥ 4.4 AND quality ≥ 4.4 AND tenureMonths ≥ 6`; reason = first
  failing criterion.
- **BR-EN-2** — Shadowing pairing: mentee = sourcing/selection/onboarding CSA; mentor = active CSA in the
  same POD (fallback: shares a Family).
- **BR-EN-3** — SDM onboarding = 6 steps (role/scope, escalation training, ADO/Power BI access, partner
  health dashboards, shadow live escalations, readiness sign-off).
- **BR-EN-4** — A CSA's **accreditations** are the Programs (from the Families they work in) they are
  certified to deliver; there is one accreditation per Program.

## 4. User stories & acceptance criteria

### Story: Objective S500
- **As an** enablement owner **I want** S500 eligibility computed from CPE/quality/tenure **so that**
  eligibility is objective and current.
- **AC:** Given a CSA with CPE 4.5, quality 4.5, tenure 8mo, When eligibility renders, Then they are
  Eligible; Given quality 4.1, Then Not eligible with reason "Quality below 4.4".

### Story: Field voice
- **As** any user **I want** to submit and vote on ideas **so that** the field shapes the product.
- **AC:** Given I submit an idea, When saved, Then it appears with 1 vote and status New; When I vote,
  Then its count increments.

## 5. Data & system of record

Accreditations (from CSA `skills` proxy → skilling system SoT); S500 (computed from CSA cpe/quality/
tenure; persisted in production); SDM onboarding (HR); User Voice (product backlog SoT); shadowing pairs.

## 6. AI touchpoints

None in prototype. Candidates: next-best accreditation, S500 readiness-date prediction, mentor matching.

## 7. Integrations

Skilling/accreditation (e.g. Viva), HR (tenure, SDM roster), CPE/Quality (S500 inputs), product backlog
(User Voice). See [03](../03-integrations.md).

## 8. NFR & security notes

Accreditations/tenure from systems of record; S500 rules explicit + auditable; editing restricted.

## 9. KPIs

Accreditation coverage, S500 eligibility rate, SDM readiness, shadowing completion, idea throughput.

## 10. Open questions & assumptions

- **Q:** Are accreditations the same as dispatch `skills`? **A (assumption):** yes — unify on the
  accreditation source.
- **Q:** Who approves S500? **A (assumption):** enablement/DPSM per the rule + review.
