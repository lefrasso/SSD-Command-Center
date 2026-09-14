// Module registry — shared by the nav rail and router.
const SSD_LEADERS = ['ww-lead', 'tz-lead', 'business-manager'];
const SSD_MGRS = ['csa-manager', 'pod-lead'];
const ALL = ['ww-lead', 'tz-lead', 'csa-manager', 'pod-lead', 'business-manager', 'csa', 'adoption-lead', 'partner-csa', 'sdm', 'csam'];
// Partner CSA and the internal (Nebula/GSCD) CSA share one restricted delivery profile: their own
// dispatch, enablement and escalations — no reporting/analytics, resource lifecycle, quality
// tooling, sentiment, or the SSD IQ/Capability Map platform views. SDM extends this profile.
const CSA_DELIVERY = ['csa', 'partner-csa'];

export const MODULES = [
  { id: 'pods', path: '/pods', label: 'POD Management', icon: 'people', roles: [...SSD_LEADERS.filter((r) => r !== 'business-manager'), ...SSD_MGRS, 'admin'], built: false,
    description: 'POD structure, capacity, utilization and skills.', ai: 'Capacity-balancing and skill-gap suggestions.' },
  { id: 'capacity', path: '/capacity', label: 'Capacity Management', icon: 'trending', roles: [...SSD_LEADERS, 'csa-manager', 'sdm', 'admin'], built: true,
    description: 'Planning, headcount mapping/assignment and coverage.', ai: 'Demand forecast and coverage-gap detection.' },
  { id: 'lifecycle', path: '/lifecycle', label: 'Resource Lifecycle', icon: 'personAdd', roles: [...SSD_LEADERS, ...SSD_MGRS, 'admin'], built: false,
    description: 'FTC and FTE resources from sourcing to active delivery through offboarding.', ai: 'Onboarding readiness score and offboarding-risk flags.' },
  { id: 'delivery-partners', path: '/delivery-partners', label: 'Delivery Partners', icon: 'building', roles: [...SSD_LEADERS.filter((r) => r !== 'business-manager'), 'csa-manager', 'admin'], built: true,
    description: 'Provider/DP management, onboarding and profiles.', ai: 'Partner scorecards and onboarding tracking.' },
  { id: 'engagements', path: '/engagements', label: 'Engagement Dispatch', icon: 'send', roles: [...ALL.filter((r) => r !== 'business-manager'), 'admin'], built: false,
    description: 'Proactive Dispatch and engagement delivery.', ai: 'Best-fit CSA recommendation and outreach drafts.' },
  { id: 'success-stories', path: '/success-stories', label: 'Success Stories', icon: 'star', roles: [...ALL.filter((r) => r !== 'adoption-lead'), 'admin'], built: true,
    description: 'Capture, review and publish customer outcomes linked to engagements.', ai: 'Outcome drafting and story-quality guidance.' },
  { id: 'reports-pending', path: '/reports-pending', label: 'Reports Pending', icon: 'clock', roles: [...ALL.filter((r) => r !== 'business-manager'), 'admin'], built: true,
    description: 'Overdue delivery reports and T-3W proactive engagement tracking.', ai: 'Pending-report aging and proactive (T-3W) compliance insights.' },
  { id: 'agentic', path: '/agentic', label: 'Agentic Delivery', icon: 'sparkle', roles: [...ALL.filter((r) => !['adoption-lead', 'business-manager'].includes(r)), 'admin'], built: true,
    description: 'AI delivery agents, deliverables generation and IP.', ai: 'Delivery agents draft deliverables from SSD IQ.' },
  { id: 'ip-feedback', path: '/ip-feedback', label: 'IP Feedback', icon: 'docSearch', roles: [...ALL.filter((r) => r !== 'csam'), 'ip-lead', 'admin'], built: true,
    description: 'Submit content issues on the Delivery Guide/IP Kits to the IP Leads and track the agentic triage.', ai: 'A 5-agent pipeline validates, drafts and triages every submission before it reaches the IP Lead.' },
  { id: 'messages', path: '/messages', label: 'Messaging & Actions', icon: 'chat', roles: [...ALL, 'admin'], built: false,
    description: 'Threaded communication with Partner CSAs.', ai: 'Suggested replies, tone check and thread sentiment.' },
  { id: 'quality', path: '/quality', label: 'Quality & CPE', icon: 'star', roles: [...SSD_LEADERS, ...SSD_MGRS, 'adoption-lead', 'admin'], built: false,
    description: 'Quality checks and experience management.', ai: 'Auto-scoring against the Recommended Practices checklist.' },
  { id: 'enablement', path: '/enablement', label: 'Enablement', icon: 'flag', roles: [...ALL.filter((r) => r !== 'business-manager'), 'admin'], built: true,
    description: 'Accreditations, S500, SDM onboarding, User Voice, shadowing.', ai: 'Eligibility and enablement insights.' },
  { id: 'escalations', path: '/escalations', label: 'Escalations', icon: 'warning', roles: [...SSD_LEADERS, ...SSD_MGRS, 'sdm', 'adoption-lead', ...CSA_DELIVERY, 'admin'], built: false,
    description: 'Escalation management with SDMs.', ai: 'Auto-severity, similar-case retrieval, action extraction.' },
  { id: 'performance', path: '/performance', label: 'Performance & PIPs', icon: 'trending', roles: ['csa-manager', 'pod-lead', 'ww-lead', 'tz-lead', 'admin'], requires: 'view:pip', built: false,
    description: 'Performance management and improvement plans (confidential).', ai: 'Evidence-linked performance summaries (advisory only).' },
  { id: 'admin-access', path: '/admin-access', label: 'Roles & Permissions', icon: 'lock', roles: ['admin'], requires: 'manage:accessControl', built: true,
    description: 'Platform Admin only — manage which personas can access each module and which capability permissions they hold.', ai: 'Access-change summary for audit.' },
  { id: 'csam-escalation', path: '/csam-escalation', label: 'Raise a Delivery Concern', icon: 'warning', roles: ['csam', 'admin'], built: true,
    description: 'CSAM-only intake to flag a delivery concern, which is triaged into Escalations & Actions.', ai: 'Suggested severity from the described impact.' },
  { id: 'reporting', path: '/reporting', label: 'Reporting & AI', icon: 'report', roles: [...SSD_LEADERS, ...SSD_MGRS, 'sdm', 'admin'], built: false,
    description: 'AI-assisted reporting and MBR generation.', ai: 'One-click MBR narrative and ask-your-data queries.' },
  { id: 'sentiment', path: '/sentiment', label: 'Session Health Signals', icon: 'emoji', roles: [...SSD_LEADERS.filter((r) => r !== 'business-manager'), ...SSD_MGRS, 'admin'], built: false,
    description: 'Cross-channel delivery health signals, scoped to a POD/track — never to a named customer or engagement.', ai: 'NLP scoring, theme clustering, early-warning alerts.' },
  { id: 'ssdiq', path: '/ssdiq', label: 'SSD IQ', icon: 'database', roles: ['admin'], built: true,
    description: 'The System of Records and data catalog.', ai: 'Natural-language record search and data-quality flags.' },
  { id: 'capabilities', path: '/capabilities', label: 'Capability Map', icon: 'grid', roles: ['admin'], built: true,
    description: 'The SSD delivery capability map.', ai: 'Coverage of delivery capabilities across Compass.' },
  { id: 'home', path: '/home', label: 'True North', icon: 'compass', roles: [...ALL, 'ip-lead', 'admin'], built: true,
    description: 'Your personalized start page — today\u2019s and this week\u2019s priorities, key KPIs, and what needs attention.', ai: 'Auto-generated daily briefing and anomaly callouts.' },
];

// Single source of truth for nav-rail sectioning — shared by the nav rail and the Admin Roles & Permissions matrix.
export const NAV_GROUPS = [
  { title: '', ids: ['home', 'messages', 'reporting'] },
  { title: 'Operations', ids: ['pods', 'lifecycle', 'capacity', 'engagements', 'enablement', 'reports-pending'] },
  { title: 'Delivery', ids: ['agentic', 'ip-feedback', 'success-stories', 'quality', 'escalations', 'sentiment'] },
  { title: 'Platform', ids: ['ssdiq', 'capabilities'] },
  { title: 'People', ids: ['delivery-partners', 'performance', 'admin-access'] },
  { title: 'Customer Success', ids: ['csam-escalation'] },
];

export function modulesForRole(role) {
  return MODULES.filter((m) => m.roles.includes(role));
}
export function moduleById(id) {
  return MODULES.find((m) => m.id === id);
}
