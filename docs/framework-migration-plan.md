# SSD Command Center Framework Migration Plan

## Objective
Align the working prototype with the enterprise framework architecture so the product reads as a real SSD operating platform instead of a feature dashboard. The prototype remains the working foundation, but it is being migrated to a platform-first model driven by SSD IQ and capability-based operations.

## Target architecture

### Intake layer
- Requests
- Surveys
- Labor Insights
- Capacity Insights
- Offerings

### Core platform
- SSD Command Center Platform
- SSD IQ as the system of record

### Operational layers
- Messaging
- Actions
- Reporting
- Agents

### Capability pillars
- POD Management
- pCSA Lifecycle Management
- Capacity Management
- Agentic Delivery

### Delivery timeline
The framework defines a staged rollout model. The prototype should reflect this progression rather than presenting all features as fully equivalent at the same time.

## Migration stages

### Stage 1 — Architecture alignment
Status: Implemented in the prototype shell level

Actions:
- Add platform shell framing to the home page
- Add intake panel to show information sources
- Reframe the central area as the operating platform
- Reposition SSD IQ as a governing system rather than only a navigation item

Key files:
- [scripts/views/home.js](../scripts/views/home.js)
- [styles/components.css](../styles/components.css)

### Stage 2 — Navigation and taxonomy alignment
Status: Implemented in navigation and grouping logic

Actions:
- Group modules into framework-consistent categories
- Rename major labels to match the operating model
- Keep route functionality while changing user mental model

Key files:
- [scripts/nav.js](../scripts/nav.js)
- [scripts/bootstrap.js](../scripts/bootstrap.js)
- [styles/base.css](../styles/base.css)

### Stage 3 — Operational flow alignment
Status: Next implementation focus

Actions:
- Reframe flows as source -> SSD IQ -> actions -> reporting -> AI
- Ensure messaging, escalations, and actions are traceable to records
- Keep the existing prototype workflows intact while adjusting their framing

### Stage 4 — Data model maturity
Status: Planned

Actions:
- Standardize the canonical model around SSD IQ entities
- Map partner, pod, capacity, and lifecycle data to the same semantics
- Ensure reporting and agentic workflows derive from the same source model

### Stage 5 — AI and reporting maturity
Status: Planned

Actions:
- Deepen the advisory layer around SSD IQ
- surface reporting as downstream operational output
- keep AI human-owned and evidence-grounded

### Stage 6 — Roadmap and release sequencing
Status: Planned

Actions:
- represent the framework implementation stages in release milestones
- show maturity progression to users and stakeholders
- phase the product story rather than treat it as a single-time build

## Implementation principles
- Preserve working prototype functionality.
- Reframe the user experience around the architecture instead of rebuilding everything.
- Treat SSD IQ as the system of record and anchor point.
- Keep AI advisory rather than autonomous.
- Make the product story understandable in less than a minute.

## Files most relevant to migration
- [README.md](../README.md)
- [scripts/nav.js](../scripts/nav.js)
- [scripts/bootstrap.js](../scripts/bootstrap.js)
- [scripts/views/home.js](../scripts/views/home.js)
- [scripts/store.js](../scripts/store.js)
- [scripts/views/ssdiq.js](../scripts/views/ssdiq.js)
- [styles/base.css](../styles/base.css)
- [styles/components.css](../styles/components.css)

## Verification
- Confirm the app still loads after each migration stage.
- Validate routes still resolve after navigation grouping changes.
- Check that the user can understand the platform model before the feature detail.
- Ensure the app communicates the source -> records -> actions -> reporting -> AI flow.

## Recommendation
The migration should proceed in layered increments. The visual and structural alignment should come first, followed by deeper data and workflow maturity. This preserves utility while moving the prototype closer to the real operating architecture.
