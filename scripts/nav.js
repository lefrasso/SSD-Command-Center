// Module registry — shared by the nav rail and router.
const ALL = ['pod-lead', 'partner-csa', 'sdm', 'dpsm', 'business-lt'];

export const MODULES = [
  { id: 'home', path: '/home', label: 'Home', icon: 'home', roles: ALL, built: true,
    description: 'Delivery Cockpit — what needs me today.', ai: 'Auto-generated daily briefing and anomaly callouts.' },
  { id: 'pods', path: '/pods', label: 'PODs & People', icon: 'people', roles: ['pod-lead', 'sdm', 'dpsm', 'business-lt'], built: false,
    description: 'POD structure, capacity, utilization and skills.', ai: 'Capacity-balancing and skill-gap suggestions.' },
  { id: 'lifecycle', path: '/lifecycle', label: 'Partner CSA Lifecycle', icon: 'personAdd', roles: ['pod-lead', 'dpsm', 'business-lt'], built: false,
    description: 'Sourcing → onboarding → active → offboarding.', ai: 'Onboarding readiness score and offboarding-risk flags.' },
  { id: 'engagements', path: '/engagements', label: 'Engagements & Dispatch', icon: 'send', roles: ALL, built: false,
    description: 'Proactive Dispatch and engagement delivery.', ai: 'Best-fit CSA recommendation and outreach drafts.' },
  { id: 'reports-pending', path: '/reports-pending', label: 'Reports Pending', icon: 'clock', roles: ALL, built: true,
    description: 'Overdue delivery reports and T-3W proactive engagement tracking.', ai: 'Pending-report aging and proactive (T-3W) compliance insights.' },
  { id: 'messages', path: '/messages', label: 'Messages Console', icon: 'chat', roles: ['pod-lead', 'partner-csa', 'sdm'], built: false,
    description: 'Threaded communication with Partner CSAs.', ai: 'Suggested replies, tone check and thread sentiment.' },
  { id: 'quality', path: '/quality', label: 'Quality & CPE', icon: 'star', roles: ['pod-lead', 'partner-csa', 'sdm', 'business-lt'], built: false,
    description: 'Quality checks and experience management.', ai: 'Auto-scoring against the Recommended Practices checklist.' },
  { id: 'escalations', path: '/escalations', label: 'Escalations & Actions', icon: 'warning', roles: ['pod-lead', 'sdm', 'business-lt'], built: false,
    description: 'Escalation management with SDMs.', ai: 'Auto-severity, similar-case retrieval, action extraction.' },
  { id: 'performance', path: '/performance', label: 'Performance & PIPs', icon: 'trending', roles: ['pod-lead'], requires: 'view:pip', built: false,
    description: 'Performance management and improvement plans (confidential).', ai: 'Evidence-linked performance summaries (advisory only).' },
  { id: 'reporting', path: '/reporting', label: 'Reporting & AI', icon: 'report', roles: ['pod-lead', 'sdm', 'dpsm', 'business-lt'], built: false,
    description: 'AI-assisted reporting and MBR generation.', ai: 'One-click MBR narrative and ask-your-data queries.' },
  { id: 'sentiment', path: '/sentiment', label: 'Sentiment', icon: 'emoji', roles: ['pod-lead', 'sdm', 'business-lt'], built: false,
    description: 'Cross-channel sentiment analysis.', ai: 'NLP scoring, theme clustering, early-warning alerts.' },
  { id: 'ssdiq', path: '/ssdiq', label: 'SSD IQ', icon: 'database', roles: ALL, built: true,
    description: 'The System of Records and data catalog.', ai: 'Natural-language record search and data-quality flags.' },
];

export function modulesForRole(role) {
  return MODULES.filter((m) => m.roles.includes(role));
}
export function moduleById(id) {
  return MODULES.find((m) => m.id === id);
}
