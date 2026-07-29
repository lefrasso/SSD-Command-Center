# 03 — Integrations

> Compass **federates** to the systems SSD already uses rather than duplicating them. This catalog lists
> each source system, what it owns, direction of flow, and the integration contract to build.

## 1. Integration principles

- **Federate, don't copy.** Read live from the source of truth; write through the owning system.
- **Contract-first.** Each integration has a typed contract (entities, operations, auth, errors, rate
  limits, sync cadence).
- **Resilience.** Retries, idempotency, backoff, circuit-breaking; degrade gracefully to cached reads.
- **Security.** Least-privilege service identities; secrets in Key Vault; per-user delegation where
  data is user-scoped (e.g. Graph mail/Teams).

## 2. Source-system catalog

| System | Owns (SoT for) | Direction | Compass usage |
|---|---|---|---|
| **Microsoft Entra ID** | Identity, roles/groups | Inbound | SSO; role/permission derivation. See [04](04-security-privacy-compliance.md). |
| **Microsoft Graph** | People, calendar, mail, Teams signals | In/Out | CSA profiles; schedule Day-1 sync; send outreach; message threads. |
| **Azure DevOps** | Escalations + action items (`AB#`) | In/Out | Create/update/track escalations and actions. |
| **Power BI** | Delivery metrics, executive datasets | Inbound (embed) | Embedded analytics; executive view; delivery volumes. |
| **HC Consolidation** (Power BI) | Active & Future headcount + hiring requisitions | Inbound | HC Tracking + Hiring Progress ([CAP-08](capabilities/CAP-08-capacity-and-forecasting.md)). |
| **Microsoft Forms** | Escalation + onboarding intake, CPE surveys | Inbound | Intake capture; CPE scores + verbatims. |
| **Microsoft Teams** | Message threads | In/Out | Threaded partner comms (via Graph). |
| **Viva** | Enablement / learning | Inbound | Accreditations, enablement (see [CAP-11](capabilities/CAP-11-enablement.md)). |
| **MOSA / Operations** | Partner + contract, CSA roster, utilization, lifecycle | Inbound | Partner/CSA master data. |
| **HR systems** | PIPs, tenure, SDM roster | In/Out (restricted) | Confidential performance data. |
| **Azure OpenAI** | LLM inference | Outbound | Grounded generation/scoring. See [05](05-ai-and-copilot-platform.md). |
| **SharePoint / Docs** | Playbooks, IP assets, generated deliverables | In/Out | IP library; artifact storage. |

## 3. Integration contracts (per system)

Each contract specifies: **entities**, **operations**, **auth**, **sync pattern**, **error/limits**.

### Microsoft Entra ID
- **Operations:** OIDC sign-in; read app roles + group membership → map to Compass roles/permissions.
- **Auth:** OAuth2/OIDC; app registration with delegated + app permissions.
- **Pattern:** at sign-in + token refresh.

### Microsoft Graph
- **Entities:** users, calendar events, mail, Teams messages/presence.
- **Operations:** read CSA profile; create Day-1 sync event; send outreach mail; read/post thread messages.
- **Auth:** delegated (user context) for mail/Teams; app for directory reads.
- **Pattern:** on-demand + change notifications (subscriptions) for message signals.

### Azure DevOps
- **Entities:** work items (escalation, action item).
- **Operations:** create/update/query; map `Escalation ↔ work item`, `Action ↔ child work item`; sync status + `adoRef`.
- **Auth:** service identity (PAT/Entra) with scoped project access.
- **Pattern:** write-through on change; poll/webhook to pull external updates. **Bi-directional.**

### Power BI
- **Operations:** embed reports/tiles; read datasets for executive/territory views.
- **Auth:** embed token; row-level security aligned to Compass RBAC/TZ/OU scope.
- **Pattern:** embedded + dataset refresh cadence.

### Microsoft Forms
- **Operations:** ingest intake + CPE responses → Escalation/CPE entities.
- **Pattern:** webhook/polling on new responses.

### MOSA / Operations
- **Operations:** ingest partner + CSA master data, contract refs, utilization, lifecycle.
- **Pattern:** scheduled sync + change feed; SoT for partner/CSA fields.

### HR (restricted)
- **Operations:** read/write PIP records + outcomes; read tenure/SDM roster.
- **Auth:** restricted service identity; access-logged; classification enforced.
- **Pattern:** on-demand, gated by `view:pip`.

### Azure OpenAI + retrieval
- **Operations:** chat/completions + embeddings; retrieval over SSD IQ; content safety.
- **Pattern:** per-request via the AI Services seam. See [05](05-ai-and-copilot-platform.md).

## 4. Eventing & sync

- Prefer **change notifications/webhooks** (Graph, ADO, Forms) over polling.
- Maintain a **sync ledger** with per-entity freshness; reconciliation jobs detect drift vs SoT.
- All inbound writes update SSD IQ read models; all outbound writes go to the owning system first.

## 5. Prototype status

The prototype **mocks all integrations** — data is seeded (`data/generate.js`) and AI is simulated
(`scripts/ai.js`) — but preserves the **logical shape** (source-of-truth badges per entity in
`scripts/views/ssdiq.js`) so the production wiring is a drop-in per contract above. Real sources were
inaccessible during prototyping (auth-gated SharePoint/OneDrive/Power BI; MIP-encrypted spreadsheets),
which is itself a reason the production integration layer is a first-class workstream — see
[ADR-002](09-design-decisions-and-learnings.md).

## 6. Backlog (integration workstream)

| ID | System | Story | Priority | Phase |
|---|---|---|---|---|
| INT-1 | Entra ID | SSO + role/group mapping | Must | P1 |
| INT-2 | Azure DevOps | Bi-directional escalation/action sync | Must | P1 |
| INT-3 | Power BI | Embedded executive/territory analytics with RLS | Must | P1 |
| INT-4 | Graph | Send outreach + schedule Day-1 sync + Teams threads | Must | P1–P2 |
| INT-5 | Forms | CPE + intake ingestion | Should | P1 |
| INT-6 | MOSA/Ops | Partner/CSA master-data sync | Must | P1 |
| INT-7 | HR | Restricted PIP integration | Must | P2 |
| INT-8 | Viva/SharePoint | Enablement + IP asset library | Should | P2 |
| INT-9 | Azure OpenAI | Grounded AI seam + content safety | Must | P2 |

## 7. References

- Prototype: `scripts/views/ssdiq.js` (source-of-truth badges), `data/generate.js`, `scripts/ai.js`.
- Related: [02 Data](02-data-and-system-of-record.md), [04 Security](04-security-privacy-compliance.md),
  [05 AI](05-ai-and-copilot-platform.md).
