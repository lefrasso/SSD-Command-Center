// Module registry — shared by the nav rail and router.
const SSD_LEADERS = ['ww-lead', 'tz-lead', 'business-manager'];
const SSD_MGRS = ['csa-manager', 'pod-lead'];
const INNOVATION = ['ip-lead', 'adoption-lead'];
const ALL = ['ww-lead', 'tz-lead', 'csa-manager', 'pod-lead', 'business-manager', 'csa', 'ip-lead', 'adoption-lead', 'partner-csa', 'sdm', 'operations-manager'];
const ALL_EXCEPT_PARTNER_CSA = ALL.filter((role) => role !== 'partner-csa');

export const MODULES = [
  { id: 'pods', path: '/pods', label: 'POD Management', icon: 'people', roles: [...SSD_LEADERS, ...SSD_MGRS, 'operations-manager', 'sdm'], built: false,
    description: 'POD structure, capacity, utilization and skills.', ai: 'Capacity-balancing and skill-gap suggestions.' },
  { id: 'capacity', path: '/capacity', label: 'Capacity Management', icon: 'trending', roles: [...SSD_LEADERS, ...SSD_MGRS, 'operations-manager'], built: true,
    description: 'Planning, headcount mapping/assignment and coverage.', ai: 'Demand forecast and coverage-gap detection.' },
  { id: 'lifecycle', path: '/lifecycle', label: 'Resource Lifecycle', icon: 'personAdd', roles: [...SSD_LEADERS, ...SSD_MGRS, 'operations-manager'], built: false,
    description: 'FTC and FTE resources from sourcing to active delivery through offboarding.', ai: 'Onboarding readiness score and offboarding-risk flags.' },
  { id: 'delivery-partners', path: '/delivery-partners', label: 'Delivery Partners', icon: 'building', roles: [...SSD_LEADERS, ...SSD_MGRS, 'operations-manager', 'sdm'], built: true,
    description: 'Provider/DP management, onboarding and profiles.', ai: 'Partner scorecards and onboarding tracking.' },
  { id: 'engagements', path: '/engagements', label: 'Engagement Dispatch', icon: 'send', roles: ALL, built: false,
    description: 'Proactive Dispatch and engagement delivery.', ai: 'Best-fit CSA recommendation and outreach drafts.' },
  { id: 'success-stories', path: '/success-stories', label: 'Success Stories', icon: 'star', roles: ALL, built: true,
    description: 'Capture, review and publish customer outcomes linked to engagements.', ai: 'Outcome drafting and story-quality guidance.' },
  { id: 'reports-pending', path: '/reports-pending', label: 'Reports Pending', icon: 'clock', roles: ALL, built: true,
    description: 'Overdue delivery reports and T-3W proactive engagement tracking.', ai: 'Pending-report aging and proactive (T-3W) compliance insights.' },
  { id: 'agentic', path: '/agentic', label: 'Agentic Delivery', icon: 'sparkle', roles: ALL, built: true,
    description: 'AI delivery agents, deliverables generation and IP.', ai: 'Delivery agents draft deliverables from SSD IQ.' },
  { id: 'messages', path: '/messages', label: 'Messaging & Actions', icon: 'chat', roles: ['csa-manager', 'pod-lead', 'csa', 'partner-csa', 'sdm'], built: false,
    description: 'Threaded communication with Partner CSAs.', ai: 'Suggested replies, tone check and thread sentiment.' },
  { id: 'quality', path: '/quality', label: 'Quality & CPE', icon: 'star', roles: [...SSD_LEADERS, ...SSD_MGRS, 'csa', 'partner-csa', 'sdm'], built: false,
    description: 'Quality checks and experience management.', ai: 'Auto-scoring against the Recommended Practices checklist.' },
  { id: 'enablement', path: '/enablement', label: 'Enablement', icon: 'flag', roles: ALL, built: true,
    description: 'Accreditations, S500, SDM onboarding, User Voice, shadowing.', ai: 'Eligibility and enablement insights.' },
  { id: 'escalations', path: '/escalations', label: 'Escalations', icon: 'warning', roles: [...SSD_LEADERS, ...SSD_MGRS, 'sdm', 'operations-manager'], built: false,
    description: 'Escalation management with SDMs.', ai: 'Auto-severity, similar-case retrieval, action extraction.' },
  { id: 'performance', path: '/performance', label: 'Performance & PIPs', icon: 'trending', roles: ['csa-manager', 'pod-lead'], requires: 'view:pip', built: false,
    description: 'Performance management and improvement plans (confidential).', ai: 'Evidence-linked performance summaries (advisory only).' },
  { id: 'reporting', path: '/reporting', label: 'Reporting & AI', icon: 'report', roles: [...SSD_LEADERS, ...SSD_MGRS, 'operations-manager', 'sdm', ...INNOVATION], built: false,
    description: 'AI-assisted reporting and MBR generation.', ai: 'One-click MBR narrative and ask-your-data queries.' },
  { id: 'sentiment', path: '/sentiment', label: 'Sentiment', icon: 'emoji', roles: [...SSD_LEADERS, ...SSD_MGRS, 'sdm'], built: false,
    description: 'Cross-channel sentiment analysis.', ai: 'NLP scoring, theme clustering, early-warning alerts.' },
  { id: 'ssdiq', path: '/ssdiq', label: 'SSD IQ', icon: 'database', roles: ALL_EXCEPT_PARTNER_CSA, built: true,
    description: 'The System of Records and data catalog.', ai: 'Natural-language record search and data-quality flags.' },
  { id: 'capabilities', path: '/capabilities', label: 'Capability Map', icon: 'grid', roles: ALL_EXCEPT_PARTNER_CSA, built: true,
    description: 'The SSD delivery capability map.', ai: 'Coverage of delivery capabilities across Compass.' },
  { id: 'home', path: '/home', label: 'Platform Overview', icon: 'home', roles: ALL, built: true,
    description: 'Executive overview — operating model, resource health, and priorities.', ai: 'Auto-generated daily briefing and anomaly callouts.' },
];

export function modulesForRole(role) {
  return MODULES.filter((m) => m.roles.includes(role));
}
export function moduleById(id) {
  return MODULES.find((m) => m.id === id);
}
