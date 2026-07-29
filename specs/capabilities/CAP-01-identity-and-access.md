# Capability: Identity & Access `CAP-01`

> Sign users in, derive their role, and enforce least-privilege access across every module, action and
> confidential surface.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-01` |
| Area | Foundation |
| Primary personas | All |
| Priority | Must |
| Target phase | P1 |
| Prototype reference | `scripts/roles.js`, `scripts/nav.js`, `scripts/bootstrap.js` |
| Depends on | [04 Security](../04-security-privacy-compliance.md), [01 Architecture](../01-solution-architecture.md) |

## 1. Problem & outcome

- **Problem:** Different roles need very different access; confidential personnel data must never leak.
  The prototype fakes this with a role switcher.
- **Outcome:** Real identity-derived roles with least-privilege enforcement on nav, actions and deep
  links.
- **Value:** Security, compliance, and a clean role-appropriate UX.

## 2. Functional requirements

- **FR-IDENT-1** — The system shall authenticate every user via **Microsoft Entra ID SSO**; no
  anonymous access.
- **FR-IDENT-2** — The system shall derive the user's role(s) from Entra **app roles / group
  membership** (roles: pod-lead, partner-csa, sdm, dpsm, business-lt; + HR-equivalent for PIPs).
- **FR-IDENT-3** — The navigation shall show only modules permitted for the active role.
- **FR-IDENT-4** — Action controls (dispatch, escalation edit, capacity edit, MBR, PIP) shall be shown
  only when the role holds the corresponding permission.
- **FR-IDENT-5** — The system shall enforce permissions at the **API**, not only the UI.
- **FR-IDENT-6** — Deep links to unpermitted routes shall be **blocked** and logged.
- **FR-IDENT-7** — The command bar shall display the user's identity (name, title, initials, avatar).
- **FR-IDENT-8** — The system shall support users with **multiple roles** and **TZ/OU scoping**.

## 3. Business rules

- **BR-IDENT-1** — Module visible ⇔ `role ∈ module.roles` **and** (if `module.requires`) `can(role, requires)`.
- **BR-IDENT-2** — `Performance & PIPs` and the `pips` entity require `view:pip` (POD Lead + HR-equivalent).
- **BR-IDENT-3** — Permission matrix per [04 §2](../04-security-privacy-compliance.md).
- **BR-IDENT-4** — Default route on sign-in is the Delivery Cockpit (`/home`).

## 4. User stories & acceptance criteria

### Story: Role-appropriate access
- **As a** Partner CSA **I want** to see only my tools **so that** the app isn't cluttered with things I
  can't use.
- **AC:**
  - Given I sign in as a Partner CSA, When the nav renders, Then confidential and leadership-only
    modules (Performance & PIPs, Escalations, Reporting, Sentiment, Capacity, Lifecycle, PODs) are absent.
  - Given I am a Partner CSA, When I open a deep link to `#/performance`, Then access is denied and the
    attempt is logged.

### Story: Confidential protection
- **As a** security owner **I want** PIP data restricted **so that** personnel data cannot leak.
- **AC:**
  - Given a role without `view:pip`, When any API request for `pips` is made, Then it returns 403 and is
    access-logged.

## 5. Data & system of record

| Entity | Fields used | R/W | Source of truth |
|---|---|---|---|
| Persona/role | role, permissions, scope | R | Entra ID (groups/app roles) |

## 6. AI touchpoints

None. AI elsewhere respects the caller's permissions and never surfaces confidential data to
unauthorised roles.

## 7. Integrations

- **Microsoft Entra ID** (SSO + roles/groups). See [03 §Entra ID](../03-integrations.md).

## 8. NFR & security notes

Implements `NFR-SEC-1..8`. Enforcement at API + deep links; audit + access reviews. See [04](../04-security-privacy-compliance.md).

## 9. KPIs

- Unauthorised access attempts blocked & logged (target 100%).
- Access-review completion for confidential grants (100%/cycle).

## 10. Open questions & assumptions

- **Q:** Who beyond POD Lead holds `view:pip`? **A (assumption):** HR-equivalent only.
- **Q:** Do TZ Leads get TZ-scoped portfolio data? **A (assumption):** yes; global for the WW lead.
