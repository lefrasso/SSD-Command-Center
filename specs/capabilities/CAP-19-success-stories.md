# Capability: Success Stories `CAP-19`

> Turn verified engagement outcomes and VSAT feedback into governed, reusable Success Program stories.

## Summary

| Field | Value |
|---|---|
| Capability ID | `CAP-19` |
| Area | Comms & Insight |
| Primary personas | Partner CSA, CSA, SDM, POD Lead, CSA Manager, SSD Leadership |
| Priority | Should |
| Target phase | P2 |
| Prototype reference | `scripts/views/successstories.js`, `scripts/pptx.js`, `assets/success-stories-template.pptx`, `scripts/store.js`, `data/generate.js` |
| Depends on | [CAP-04 Engagements & Dispatch](CAP-04-engagements-and-dispatch.md), [CAP-12 Quality & CPE](CAP-12-quality-and-cpe.md), [CAP-03 SSD IQ Explorer](CAP-03-ssd-iq-explorer.md), [04 Security](../04-security-privacy-compliance.md) |

## 1. Problem & outcome

- **Problem:** The official success-story process is PowerPoint- and SharePoint-led. Intake,
  collaboration, evidence, review decisions, and missing VSAT follow-ups are not managed as governed
  records.
- **Outcome:** SSD IQ manages the content and workflow; the official PowerPoint becomes a generated
  output rather than the working database.
- **Value:** Delivery impact is visible, traceable to engagements and written feedback, reusable across
  PODs, and ready for MBRs, readiness reviews, and leadership forums.

## 2. Functional requirements

### Portfolio and intake

- **FR-STORY-1** - Show a searchable/filterable story list with customer/events, source, owner, workflow
  status, LT approval, and update date.
- **FR-STORY-2** - Show total, published, in-review, and VSAT coverage metrics.
- **FR-STORY-3** - Show every 5-star VSAT engagement and whether it has a linked story.
- **FR-STORY-4** - For an uncovered VSAT, an authorized POD Lead/CSA Manager shall create a story or
  assign an action to a selected SDM with due date and status.
- **FR-STORY-5** - A Partner CSA/CSA shall create a draft from a VSAT, other written customer feedback,
  written CSAM/account-team feedback, or an impactful delivery.

### Content and metadata

- **FR-STORY-6** - A story shall link one primary engagement and may link additional events/engagements.
- **FR-STORY-7** - The story editor shall capture headline, overview, key outcomes, insights, impact,
  customer quote and attribution, CSAM quote, delivery team, tags, and optional customer logo.
- **FR-STORY-8** - Mandatory publication metadata shall include Family, Events, Delivery Partner, Fiscal
  Year, Month, Area, Country/US OU, Industry, Segment, and Time Zone.
- **FR-STORY-9** - Industry and Segment values shall use the nomenclature in the official process.
- **FR-STORY-10** - The system shall derive/display the official filename:
  `<Fiscal Year>-<Month>-<Customer>-<Time Zone>.pptx`.

### Review, approval, and publication

- **FR-STORY-11** - Workflow shall be draft -> SDM review -> POD Lead review -> SSD Leadership review ->
  approved -> published -> archived.
- **FR-STORY-12** - SDM, POD Lead, and SSD Leadership reviewers shall add a governed decision/comment;
  a reviewer may request changes back to draft.
- **FR-STORY-13** - Only a POD Lead/CSA Manager shall mark an approved story published/uploaded to the
  SSD SharePoint library.
- **FR-STORY-14** - Only SSD Leadership shall set or remove LT Approved on a published story.
- **FR-STORY-15** - `ltApproved = true` shall trigger promotion to the SPS Internal Hub in production.
- **FR-STORY-16** - Only drafts shall be editable or deletable; published/archived records retain their
  evidence, decisions, and audit history.

### PowerPoint output

- **FR-STORY-17** - Export shall use the official slide embedded in the initiative deck, preserving its
  layout, branding, headings, and customer-logo position.
- **FR-STORY-18** - Export shall populate the Family title, customer and CSAM quotes, engagement
  overview, delivery team, key outcomes, insights, impact, date, and optional logo.
- **FR-STORY-19** - Generated presentations shall contain one slide and use the official naming
  convention.
- **FR-STORY-20** - SSD IQ shall expose stories, engagement/VSAT/action relationships, source metadata,
  review history, and audit history.

## 3. Business rules

- **BR-STORY-1** - A VSAT starting point is a completed 5-star survey (`CPE.class = VSAT`).
- **BR-STORY-2** - Other valid starting points are written customer feedback, written CSAM/account-team
  feedback, and an impactful delivery.
- **BR-STORY-3** - Copilot/AI must not generate customer quotes from event recordings. Quotes must come
  from customer- or CSAM-provided written communications.
- **BR-STORY-4** - One story has one primary engagement and one or more related engagement IDs; several
  Success Program events may be represented.
- **BR-STORY-5** - Requesting changes requires a reviewer comment. Every transition records actor,
  timestamp, stage, decision, and comment.
- **BR-STORY-6** - `publishDate`, SharePoint status, and URL are set on publication.
- **BR-STORY-7** - LT approval is independent from editorial approval, leadership-only, and valid only
  after publication.
- **BR-STORY-8** - Operating metric: at least one story per delivery-partner organization per time zone.
- **BR-STORY-9** - US stories must use the OU in the Country field (for example, `US-OGE`).
- **BR-STORY-10** - Customer logo accepts PNG/JPEG; user-authored content is escaped in HTML and encoded
  through XML DOM APIs for PowerPoint.

## 4. User stories & acceptance criteria

### Story: Act on an uncovered VSAT
- **As a** POD Lead **I want** to see VSAT engagements without stories and assign an SDM **so that**
  high-value evidence is not missed.
- **AC:** Given an uncovered VSAT, When I assign an SDM and due date, Then an open action linked to the
  CPE and engagement is created and visible in SSD IQ.

### Story: Author with the CSAM
- **As a** Partner CSA **I want** to create the structured story in SSD IQ **so that** PowerPoint is no
  longer the working source.
- **AC:** Given at least one eligible engagement and all required content/metadata, When I save, Then a
  governed draft is created with engagement and optional VSAT relationships.

### Story: Complete official review
- **As an** SDM, POD Lead, or SSD leader **I want** stage-specific review actions **so that** approval is
  attributable and changes loop back to the author.
- **AC:** Given a story at my review stage, When I approve or request changes, Then only a permitted
  transition occurs and the review decision is retained.

### Story: Export the official slide
- **As a** story owner **I want** to export the approved template **so that** the deliverable remains
  compatible with the official presentation format.
- **AC:** Given complete story content, When I export, Then a one-slide `.pptx` is downloaded using the
  official filename and contains the mapped story content and optional customer logo.

### Story: Promote an LT-approved story
- **As an** SSD leader **I want** to mark a published story LT Approved **so that** it is selected for
  internal stakeholder promotion.
- **AC:** Given a published story, When I set LT Approved, Then actor/time are audited and production
  synchronization promotes it to the SPS Internal Hub.

## 5. Data & system of record

| Entity | Fields used | Read/Write | Source of truth |
|---|---|---|---|
| Success Story | relationships, source, content, mandatory metadata, delivery team, workflow/reviews, publication, LT approval, logo, audit | R/W | SSD IQ |
| Engagement | customer, Family, Program/event, assigned CSA, status, date | R | Dispatch / Graph |
| CPE Feedback | `class`, score, verbatim, survey status, engagement | R | CPE / Forms |
| Action | CPE/engagement/story context, SDM owner, due, status | R/W | Azure DevOps / SSD IQ |
| Partner / CSA / POD | Delivery Partner, Partner CSA, POD Lead, Time Zone, Area | R | Operations / SSD IQ |

See the canonical [data model and relationships](../02-data-and-system-of-record.md).

## 6. AI touchpoints

| AI feature | Input | Output | Guardrail | Platform ref |
|---|---|---|---|---|
| Story drafting | Engagement evidence and approved written feedback | Editable outcomes/insights/impact draft | Labelled, human-reviewed, no invented metrics | [AI platform](../05-ai-and-copilot-platform.md) |
| Coverage insight | VSATs, stories, partner/TZ dimensions | Missing-story and operating-coverage insight | Advisory; POD Lead assigns work | [AI platform](../05-ai-and-copilot-platform.md) |

AI shall never synthesize or attribute a customer quote from a meeting/event recording. The prototype
implements deterministic data and workflow only.

## 7. Integrations

- Ingest VSAT/CPE feedback from Forms/CPE.
- Read engagement, POD, partner, and CSA provenance through SSD IQ federation.
- Create/update SDM follow-up actions in Azure DevOps or the governed SSD IQ action store.
- Upload generated `.pptx` plus mandatory metadata to the SSD Success Stories SharePoint library.
- Promote LT-approved stories to the SPS Internal Hub and retain SharePoint URL/etag/sync state.

## 8. NFR & security notes

- Enforce every transition and LT approval at the API; UI gating is not authorization.
- Treat drafts, customer quotes, customer names, and logos as Customer-classified data.
- Scan uploaded logos, constrain MIME/size, and avoid embedding external resources in exports.
- Retain immutable versions for approved/published content and an access/write audit.
- Generated PowerPoint XML must use safe DOM text insertion, never string-interpolated XML content.
- Meet shared accessibility, performance, resilience, and observability requirements in
  [NFRs](../06-non-functional-requirements.md).

## 9. KPIs

- VSAT story coverage.
- Stories awaiting each review stage and median age per stage.
- Partner x Time Zone operating coverage (target 100%).
- Published and LT-approved story counts.
- SharePoint upload/promotion success and reconciliation failures.
- PowerPoint export count and failures.

## 10. Open questions & assumptions

- **Q:** What proves permission to publish a customer quote/logo? **A (assumption):** production stores
  a consent/approval artifact; editorial approval alone is not customer consent.
- **Q:** Which system owns SDM actions? **A (assumption):** Azure DevOps where configured, otherwise SSD
  IQ with later synchronization.
- **Q:** Is SSD Leadership approval required for every SharePoint upload? **A (assumption):** yes, based
  on the official process flow.
- **Q:** Is LT Approved allowed before upload? **A (assumption):** no; the prototype exposes it only on
  published stories.
