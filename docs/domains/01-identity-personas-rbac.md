# Domain: Identity, Personas & RBAC

> Who the console is for, the five personas it serves, and the permission model that gates every
> module, action and confidential surface.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `identity` |
| Module route | Role switcher (command bar); enforced everywhere |
| Prototype status | Implemented (mock switcher) |
| Primary personas | All |
| Source-of-truth systems (target) | Microsoft Entra ID (groups/roles) |
| Upstream domains (depends on) | Platform (00) |
| Downstream domains (consumed by) | All |
| Prototype source | `scripts/roles.js`, consumed by `scripts/nav.js`, `scripts/bootstrap.js`, views |

## 2. Purpose & problem statement

- **Why this domain exists** — The console serves several distinct roles with very different needs
  and access levels (a Partner CSA must not see confidential performance data; a POD Lead must).
  This domain defines the personas and the permission model that shapes navigation, actions and
  data visibility.
- **Who cares** — Everyone; security and HR especially (confidential data).
- **Definition of done** — Roles derived from the signed-in identity, least-privilege permissions
  enforced on both navigation and deep links, and confidential surfaces provably inaccessible to
  unauthorised roles.

## 3. Personas & permissions

Five personas (`scripts/roles.js → PERSONAS`, `ROLE_ORDER`):

| Role key | Persona (mock) | Title | Scope |
|---|---|---|---|
| `pod-lead` | Alex Navarro | Sr CSA Manager · EMEA TZ Lead | Runs PODs, dispatches, coaches, owns escalations, PIPs & MBRs. |
| `partner-csa` | Marco Rossi | Partner CSA · Avanade | Sees assigned engagements, dispatch, messages and own scorecards. |
| `sdm` | Priya Nair | Service Delivery Manager | Co-owns escalations and action items; monitors partner health. |
| `dpsm` | Sofia Marét | Delivery Partner Service Manager | Sourcing, headcount, onboarding/offboarding and capacity. |
| `business-lt` | Jordan Pierce | SSD Worldwide Lead | Portfolio dashboards, CPE & delivery trends, sentiment, roll-ups. |

### Permission matrix

Permissions (`ROLE_PERMISSIONS`) checked via `can(role, permission)`:

| Permission | pod-lead | partner-csa | sdm | dpsm | business-lt |
|---|:--:|:--:|:--:|:--:|:--:|
| `view:portfolio` | ✅ | — | — | — | ✅ |
| `view:pip` (confidential) | ✅ | — | — | — | — |
| `edit:pip` | ✅ | — | — | — | — |
| `edit:dispatch` | ✅ | — | — | — | — |
| `edit:escalation` | ✅ | — | ✅ | — | — |
| `edit:capacity` | ✅ | — | — | ✅ | — |
| `view:allPartners` | ✅ | — | ✅ | ✅ | ✅ |
| `run:mbr` | ✅ | — | ✅ | — | ✅ |

### Module visibility by role

Driven by `MODULES[].roles` (+ `requires`). Summary:

| Module | pod-lead | partner-csa | sdm | dpsm | business-lt |
|---|:--:|:--:|:--:|:--:|:--:|
| Home / Cockpit | ✅ | ✅ | ✅ | ✅ | ✅ |
| PODs & People | ✅ | — | ✅ | ✅ | ✅ |
| Capacity & Forecasting | ✅ | — | ✅ | ✅ | ✅ |
| Partner CSA Lifecycle | ✅ | — | — | ✅ | ✅ |
| Delivery Partners | ✅ | — | ✅ | ✅ | ✅ |
| Engagements & Dispatch | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports Pending | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agentic Delivery | ✅ | ✅ | ✅ | ✅ | ✅ |
| Messages Console | ✅ | ✅ | ✅ | — | — |
| Quality & CPE | ✅ | ✅ | ✅ | — | ✅ |
| Enablement | ✅ | ✅ | ✅ | ✅ | ✅ |
| Escalations & Actions | ✅ | — | ✅ | — | ✅ |
| Performance & PIPs (`requires view:pip`) | ✅ | — | — | — | — |
| Reporting & AI | ✅ | — | ✅ | ✅ | ✅ |
| Sentiment | ✅ | — | ✅ | — | ✅ |
| SSD IQ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Capabilities | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Confidential:** Performance & PIPs and the `pips` entity in SSD IQ are gated by `view:pip`
> (POD Lead only in the prototype; HR-equivalent in production).

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Role | One of the five persona keys; determines nav + permissions. |
| Permission | A capability string checked with `can(role, permission)`. |
| Role gating | Hiding modules/actions the role may not use. |
| Confidential surface | A view (Performance & PIPs) restricted by `view:pip`. |

## 5. Data model

| Entity | Key fields | Source of truth (target) | Notes |
|---|---|---|---|
| Persona | `role`, `name`, `title`, `initials`, `color`, `scope` | Entra ID + HR directory | Prototype hardcodes 5 personas. |
| Permission grant | role → permission[] | Entra ID groups / app roles | Prototype: static `ROLE_PERMISSIONS`. |

## 6. Features (current prototype)

1. **Role switcher** — command-bar control cycles the five personas; updates nav, content and the
   avatar/title.
2. **Permission checks** — `can(role, permission)` used by views to show/hide actions (e.g. MBR
   generation, PIP editing).
3. **Module gating** — nav rail and router filter modules by role and `requires`.
4. **Persona identity chip** — avatar initials + colour + title in the command bar; personalises the
   cockpit greeting and "me" in messages.

## 7. User stories

### Epic: Identity
- As **any user**, I want to sign in and have my role recognised automatically, so that I see the
  right tools without choosing a persona.
- As **an admin**, I want roles to map to identity groups, so that access changes with HR moves.

### Epic: Authorisation
- As **a security owner**, I want least-privilege enforcement on modules and deep links, so that
  confidential data cannot leak.
- As **a POD Lead**, I want exclusive access to Performance & PIPs, so that personnel data stays
  restricted.
- As **an SDM**, I want to co-own escalations without seeing PIPs, so that my access matches my job.

## 8. Business rules & logic

- **Role source:** prototype = manual switcher; production = Entra ID group/app-role claims.
- **Nav filter:** `modulesForRole(role)` → modules where `roles.includes(role)` and, if
  `requires`, `can(role, requires)`.
- **Confidential gate:** Performance & PIPs and `pips` records require `view:pip`.
- **Action gates:** MBR (`run:mbr`), dispatch edits (`edit:dispatch`), escalation edits
  (`edit:escalation`), capacity edits (`edit:capacity`), PIP edits (`edit:pip`).

## 9. AI capabilities

None directly. AI outputs elsewhere are **advisory** and never make personnel decisions
(see Performance & PIPs).

## 10. Screens & UI

- Command-bar **role switcher** (avatar, name, title).
- Every view respects role for visible actions.
- Confidential note banner on Performance & PIPs.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Microsoft Entra ID | AuthN + role/group claims | inbound | Drives roles + permissions. |
| HR directory | Persona attributes (title, TZ, manager) | inbound | For accurate identity chips. |
| Access reviews | Periodic recertification of confidential access | — | Governance. |

## 12. KPIs & metrics

| Metric | Definition | Target |
|---|---|---|
| Unauthorised access attempts | Blocked confidential-route hits | 100% blocked & logged |
| Access review completion | % of confidential grants recertified | 100% per cycle |

## 13. Non-functional requirements

- **Security:** least privilege; deep-link enforcement; no client-trusted role.
- **Privacy:** PIP/performance data restricted and access-logged.
- **Auditability:** log role changes and confidential-view access.

## 14. Prototype → production gaps

- [ ] Replace manual switcher with **Entra ID**-derived roles.
- [ ] Map the **HR-equivalent** role for Performance & PIPs (not only POD Lead).
- [ ] Enforce permissions **server-side** / at the API, not only in the UI.
- [ ] Add **access logging** and periodic **access reviews** for confidential data.
- [ ] Support users with **multiple roles / TZ scoping** (e.g. a POD Lead who is also a TZ Lead).

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| RBAC-1 | Identity | Entra ID sign-in → role from groups | Must | Foundation |
| RBAC-2 | Authorization | Server/API enforcement of permissions | Must | Defense in depth |
| RBAC-3 | Confidential | HR-equivalent role for PIPs + access log | Must | Compliance |
| RBAC-4 | Scoping | Multi-role and TZ/OU data scoping | Should | Real orgs are layered |
| RBAC-5 | Governance | Quarterly access reviews for confidential grants | Should | Audit |

## 16. Open questions & assumptions

- **Q:** Who besides POD Leads may view PIPs (HR? skip-level?) **A (assumption):** POD Lead +
  HR-equivalent only.
- **Q:** Do TZ Leads get portfolio scope limited to their TZ? **A (assumption):** business-lt sees
  global; TZ scoping is a future enhancement.

## 17. References

- Prototype source: `scripts/roles.js`, `scripts/nav.js`, `scripts/bootstrap.js`.
- Related: [Platform & Architecture](00-platform-architecture.md),
  [Performance & PIPs](32-performance-and-pips.md).
