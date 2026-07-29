# Domain: Platform & Architecture

> The application shell, navigation, routing, theming/design system, and the technical foundation
> every business domain runs on.

## 1. At a glance

| Field | Value |
|---|---|
| Domain ID | `platform` |
| Module route | — (shell across all routes) |
| Prototype status | Implemented |
| Primary personas | All |
| Source-of-truth systems (target) | Identity provider (Entra ID), hosting platform |
| Upstream domains (depends on) | Identity/RBAC (01) |
| Downstream domains (consumed by) | All |
| Prototype source | `index.html`, `scripts/bootstrap.js`, `scripts/router.js`, `scripts/nav.js`, `scripts/components.js`, `scripts/icons.js`, `styles/*` |

## 2. Purpose & problem statement

- **Why this domain exists** — Every business domain needs a consistent shell: a command bar,
  a navigation rail, a content region, a contextual Copilot dock, theming, and routing. This domain
  owns those shared concerns so the business domains stay focused on their own logic.
- **Who cares** — All personas (consistent UX); engineering (shared components, one design system).
- **Definition of done** — A production shell with real auth, role-aware navigation, accessible
  Fluent-2 styling in light + dark, deep-linkable routes, and a reusable component library.

## 3. Personas & permissions

All personas use the shell. The **navigation rail only shows modules permitted for the active
role** (see [Identity, Personas & RBAC](01-identity-personas-rbac.md)). The role switcher in the
command bar is a **prototype affordance**; in production the role derives from the signed-in
identity and group membership.

## 4. Key concepts & glossary

| Term | Meaning |
|---|---|
| Shell | Command bar + nav rail + content region + Copilot dock. |
| Command bar | Top bar: brand, global SSD IQ search, theme toggle, Copilot toggle, notifications, role. |
| Nav rail | Left navigation listing role-permitted modules; collapsible. |
| Copilot dock | Right-hand contextual AI panel (see [AI & Copilot](03-ai-and-copilot.md)). |
| Module | A registered business domain view with a route, label, icon and role list. |
| Design token | A CSS custom property (colour/spacing/typography) that themes the whole app. |

## 5. Data model

The platform holds **UI state**, not business records.

| State | Fields | Persistence | Notes |
|---|---|---|---|
| Session store | `data`, `role`, `navCollapsed`, `copilotOpen`, listeners | In-memory (`scripts/store.js`) | Emits change events (`role`, `nav`, `copilot`, `data`). |
| Theme | `compass-theme` = `light` \| `dark` | `localStorage` | Toggled from the command bar. |
| Route | `#/<module>?<query>` | URL hash | Deep-linkable; back/forward supported. |

## 6. Features (current prototype)

1. **Application shell** — command bar, collapsible nav rail, content region, docked Copilot,
   assembled in `bootstrap.js`.
2. **Module registry** — `nav.js` exports `MODULES` (id, path, label, icon, roles, `built`,
   description, `ai`, optional `requires`). `modulesForRole(role)` filters the rail; `moduleById()`
   resolves a route.
3. **Hash router** — `router.js` (`parseHash`, `navigate`, `onRoute`) supports `#/route?query`
   and drives the content switch in `bootstrap.js`.
4. **Design system** — Fluent-2 / M365 look via CSS tokens in `styles/tokens.css` (`:root` +
   `[data-theme="dark"]`), layout in `base.css`, components in `components.css`.
5. **Dark mode** — elegant dark theme; persisted to `localStorage`; charts adapt via a theme-aware
   helper; light theme preserved as default.
6. **Reusable component library** (`components.js`) — `pageHeader`, `kpiCard`, `aiChip`,
   `statusPill`, `severityPill`, `sentimentPill`, `sourceBadge`, `badge`, `kanban`, `meter`,
   `donut`/`bar`/`line` (Chart.js), `openDrawer`/`closeDrawer`, `emptyState`, `clearCharts`,
   colour helpers (`scoreColor`, `utilColor`, `COLORS`, `CHART_PALETTE`).
7. **Icon set** (`icons.js`) — inline Feather-style SVG icons, theme-inheriting via `currentColor`.
8. **Global SSD IQ search** — command-bar search field routes into the SSD IQ NL search.
9. **Notifications affordance** — command-bar bell with a live alert count.

## 7. User stories

### Epic: Shell & navigation
- As **any user**, I want a consistent command bar and left navigation, so that I can move between
  domains without relearning the UI.
- As **any user**, I want the navigation to only show what my role can access, so that the app is
  not cluttered with tools I cannot use.
- As **any user**, I want to collapse the navigation, so that I can maximise the content area.

### Epic: Theming & accessibility
- As **any user**, I want a light and a dark theme that persists, so that I can match my environment.
- As **any user**, I want charts, pills and surfaces to adapt to the theme, so that everything stays
  legible.
- As **an assistive-technology user**, I want labelled controls and keyboard navigation, so that I
  can operate the console.

### Epic: Routing & deep links
- As **any user**, I want shareable deep links to a specific module and record, so that I can hand
  off context.
- As **any user**, I want browser back/forward to work, so that navigation feels native.

## 8. Business rules & logic

- **Role-gated nav:** a module appears only if `role ∈ module.roles` and, when `module.requires` is
  set, the role holds that permission (`can(role, permission)`).
- **Default route:** unknown/empty hash resolves to `#/home`.
- **Theme:** default `light`; `dark` when `localStorage['compass-theme']==='dark'`; toggling swaps
  `data-theme` on the root and re-renders charts.
- **State propagation:** mutations call `emit(reason)`; subscribers re-render the affected chrome
  (role → nav + content; data → content; copilot/nav → chrome only).

## 9. AI capabilities

The platform hosts the **Copilot dock** and the **global NL search** entry point but implements no
AI itself. See [AI & Copilot](03-ai-and-copilot.md).

## 10. Screens & UI

- **Regions:** command bar, nav rail, content region, Copilot dock.
- **Controls:** toggle-nav, global search, theme toggle, Copilot toggle, notifications, role switcher.
- **Shared primitives:** KPI cards, pills/badges, tables (`.grid`), kanban, drawers, tabs, meters,
  charts.

## 11. Integrations & source systems (production)

| System | Role | Direction | Notes |
|---|---|---|---|
| Microsoft Entra ID | Authentication + role/group claims | inbound | Replaces the prototype role switcher. |
| Hosting platform (e.g. Azure Static Web Apps / App Service) | Serve the SPA | — | Prototype uses a Node static server (`serve.mjs`). |
| Application Insights (or similar) | Telemetry, RUM, errors | outbound | Not in prototype. |
| CDN | Static assets, vendored Chart.js | inbound | Prototype vendors `assets/vendor/chart.umd.min.js`. |

## 12. KPIs & metrics

Platform (engineering) metrics, not business KPIs:

| Metric | Definition | Target |
|---|---|---|
| Route TTI | Time to interactive per module | < 1s on warm cache |
| Accessibility | Automated a11y pass rate | 100% of critical rules |
| Theme parity | Visual defects across light/dark | 0 |

## 13. Non-functional requirements

- **Security & access:** all routes behind auth; nav + route guard by role/permission; no secrets
  in the client.
- **Privacy:** confidential modules (Performance & PIPs) must be unreachable without the permission,
  including via deep link.
- **Auditability:** navigation to confidential areas should be logged in production.
- **Performance:** no build step in the prototype (ES modules); production should bundle/split.
- **Accessibility:** WCAG 2.1 AA — labelled controls, focus management in drawers, colour-contrast
  in both themes.

## 14. Prototype → production gaps

- [ ] Replace the role switcher with **Entra ID auth** and group-derived roles.
- [ ] Add a **route guard** that enforces `requires` permissions on deep links (not just nav).
- [ ] Introduce a **build/bundle** step (code-split per module) and cache-busting.
- [ ] Add **telemetry** (page views, errors, feature usage) with privacy controls.
- [ ] Externalise **leadership/config** (names, TZ map, thresholds) from code to configuration.
- [ ] Formal **design-token** package shared with any companion apps.
- [ ] Server-side rendering or prerender for first-paint (optional).

## 15. Backlog (epics → stories)

| ID | Epic | Story | Priority | Notes |
|---|---|---|---|---|
| PLAT-1 | Auth | Integrate Entra ID sign-in; derive role from groups | Must | Removes mock role switcher |
| PLAT-2 | Auth | Route guard enforcing `requires` on deep links | Must | Security |
| PLAT-3 | Build | Add bundler + per-route code splitting | Should | Perf |
| PLAT-4 | Telemetry | App Insights page/feature/error tracking | Should | Privacy-reviewed |
| PLAT-5 | Config | Move leadership/TZ/thresholds to config service | Should | Enables non-eng edits |
| PLAT-6 | Design system | Publish tokens + component library | Could | Reuse |
| PLAT-7 | A11y | Full WCAG 2.1 AA audit + fixes | Must | Both themes |

## 16. Open questions & assumptions

- **Q:** Which hosting target (Static Web Apps vs App Service vs internal)? **A (assumption):** static
  SPA hosting with an identity gateway.
- **Q:** Is a companion mobile/Teams surface required? **A:** User Voice lists a mobile POD-Lead view
  as a request — treat as future.

## 17. References

- Prototype source: `index.html`, `scripts/bootstrap.js`, `scripts/router.js`, `scripts/nav.js`,
  `scripts/store.js`, `scripts/components.js`, `scripts/icons.js`, `styles/tokens.css`,
  `styles/base.css`, `styles/components.css`, `serve.mjs`.
- Related: [Identity, Personas & RBAC](01-identity-personas-rbac.md), [AI & Copilot](03-ai-and-copilot.md).
