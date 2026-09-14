// Personas and permission gating for the role switcher.
// Org groups: SSD (Microsoft), CSAM Innovation, the Delivery Partner, Customer Success, and Platform Admin.
import { notifyAccessChange } from './store.js';

export const PERSONAS = {
  // SSD (Microsoft): WW Lead → TZ Lead → CSA Manager → POD Lead
  'ww-lead': { role: 'ww-lead', name: 'Jordan Pierce', title: 'Worldwide Lead · SSD', initials: 'JP', color: '#5c2e91', org: 'SSD', scope: 'Full visibility across Compass — global portfolio, CPE & delivery trends, session health signals, MBR roll-ups.' },
  'tz-lead': { role: 'tz-lead', name: 'Morgan Reyes', title: 'TZ Lead · ATZ', initials: 'MR', color: '#0f6cbd', org: 'SSD', scope: 'Full visibility across Compass — territory portfolio and operations across the time zone / OUs.' },
  'csa-manager': { role: 'csa-manager', name: 'Devin Cole', title: 'CSA Manager · SSD', initials: 'DC', color: '#6b69d6', org: 'SSD', scope: 'Full visibility across Compass, similar to the TZ Lead — not region-locked; manages POD Leads, dispatch, capacity, escalations and performance.' },
  'pod-lead': { role: 'pod-lead', name: 'Sam Okoro', title: 'POD Lead · EMEA', initials: 'SO', color: '#2aa0a4', org: 'SSD', scope: 'Runs their own POD only — dispatches, coaches, owns escalations, PIPs & MBRs. No Capacity Management or Delivery Partners.' },
  'business-manager': { role: 'business-manager', name: 'Robin Ellis', title: 'Business Manager · SSD', initials: 'RE', color: '#bc4b09', org: 'SSD', scope: 'Capacity Management, Resource Lifecycle, Success Stories, Messaging & Actions, Reporting & AI, Escalations and Quality & CPE only.' },
  csa: { role: 'csa', name: 'Noa Feldman', title: 'CSA · Microsoft SSD', initials: 'NF', color: '#107c41', org: 'SSD', scope: 'Sees only their own engagements, dispatch, escalations, enablement and messages. No Quality/CPE, Session Health Signals, Resource Lifecycle or Reporting.' },
  // CSAM Innovation
  'adoption-lead': { role: 'adoption-lead', name: 'Diego Marín', title: 'Adoption Lead · CSAM Innovation', initials: 'DM', color: '#d83b01', org: 'CSAM Innovation', scope: 'Engagements, shadowing, accreditations, delivery reports and escalations; CPE results only (read-only).' },
  // Delivery Partner
  'partner-csa': { role: 'partner-csa', name: 'Marco Rossi', title: 'Partner CSA · Avanade', initials: 'MR', color: '#038387', org: 'Delivery Partner', scope: 'Sees only their own engagements, dispatch, escalations, enablement and messages. No Quality/CPE, Sentiment, Resource Lifecycle or Reporting.' },
  sdm: { role: 'sdm', name: 'Priya Nair', title: 'SDM · Delivery Partner', initials: 'PN', color: '#5b5fc7', org: 'Delivery Partner', scope: 'Same profile as Partner CSA, plus Capacity Management and Reporting & AI.' },
  // Customer Success (Microsoft, customer-facing)
  csam: { role: 'csam', name: 'Julia Meyer', title: 'CSAM · Customer Success', initials: 'JM', color: '#c19c00', org: 'Customer Success', scope: 'Owns the customer relationship; raises delivery concerns as escalations for the POD Lead/SDM.' },
  // IP & Content Leadership — owns the Delivery Guide and IP Kits; reviews AI-triaged content feedback.
  'ip-lead': { role: 'ip-lead', name: 'Elif Kaya', title: 'IP Lead · CSAM Innovation', initials: 'EK', color: '#8764b8', org: 'CSAM Innovation', scope: 'Owns the IP Feedback backlog — reviews the agent-triaged content issues, confirms, rejects or postpones changes, and drives Delivery Guide/IP Kit updates to closure.' },
  // Platform Admin (governs Compass itself, not a delivery role)
  admin: { role: 'admin', name: 'Alex Ito', title: 'Platform Admin · Compass', initials: 'AI', color: '#3b3a39', org: 'Platform Admin', scope: 'Full visibility across Compass, plus manages persona access to modules and capability permissions.' },
};

export const ROLE_ORDER = ['ww-lead', 'tz-lead', 'csa-manager', 'pod-lead', 'business-manager', 'csa', 'adoption-lead', 'partner-csa', 'sdm', 'csam', 'ip-lead', 'admin'];

// Every capability permission checked anywhere in the app via can(), plus the Admin-only permission that gates Roles & Permissions.
export const ALL_PERMISSIONS = [
  'view:portfolio', 'view:allPartners', 'run:mbr',
  'edit:successStories', 'assign:successStoryActions', 'review:successStories',
  'approve:podSuccessStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories', 'publish:successStories',
  'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'raise:escalation',
  'decide:ipFeedback', 'edit:kyplEvaluation',
  'manage:accessControl',
];
export const PERMISSION_LABELS = {
  'view:portfolio': 'View portfolio — cross-POD/territory visibility',
  'view:allPartners': 'View all partners — not just own assignments',
  'run:mbr': 'Run MBR — generate MBR narratives & reports',
  'edit:successStories': 'Create success stories',
  'assign:successStoryActions': 'Assign success story follow-up actions',
  'review:successStories': 'Review success stories (SDM step)',
  'approve:podSuccessStories': 'Approve success stories (POD Lead step)',
  'approve:leadershipSuccessStories': 'Approve success stories (Leadership step)',
  'approve:ltSuccessStories': 'Approve success stories (LT sign-off)',
  'publish:successStories': 'Publish, archive & restore success stories',
  'view:pip': 'View performance improvement plans (confidential)',
  'edit:pip': 'Edit performance improvement plans',
  'edit:dispatch': 'Edit engagement dispatch / assignment',
  'edit:escalation': 'Manage escalations',
  'edit:capacity': 'Edit capacity plans & headcount mapping',
  'raise:escalation': 'Raise a delivery concern (CSAM intake)',
  'decide:ipFeedback': 'Confirm, reject or postpone IP Feedback changes (IP Lead)',
  'edit:kyplEvaluation': 'Evaluate a Partner CSA after their KYPL session (POD Lead)',
  'manage:accessControl': 'Manage roles & permissions (Platform Admin)',
};

const ROLE_PERMISSIONS = {
  'ww-lead': ['view:portfolio', 'view:allPartners', 'run:mbr', 'view:pip', 'edit:successStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories'],
  'tz-lead': ['view:portfolio', 'view:allPartners', 'run:mbr', 'view:pip', 'edit:successStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories'],
  'csa-manager': ['view:portfolio', 'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:podSuccessStories', 'publish:successStories', 'assign:successStoryActions', 'edit:kyplEvaluation'],
  'pod-lead': ['view:portfolio', 'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:podSuccessStories', 'publish:successStories', 'assign:successStoryActions', 'edit:kyplEvaluation'],
  'business-manager': ['view:portfolio', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories'],
  csa: ['edit:successStories'],
  'adoption-lead': ['view:portfolio'],
  'partner-csa': ['edit:successStories'],
  sdm: ['edit:escalation', 'view:allPartners', 'run:mbr', 'review:successStories'],
  csam: ['raise:escalation'],
  'ip-lead': ['decide:ipFeedback'],
  admin: [...ALL_PERMISSIONS],
};

// Admin-managed permission overrides, layered over the base ROLE_PERMISSIONS above.
const permissionOverrides = {}; // { [role]: { [permission]: true|false } }

export function can(role, permission) {
  const override = permissionOverrides[role] && permissionOverrides[role][permission];
  if (override != null) return override;
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}
export function effectivePermissions(role) {
  return ALL_PERMISSIONS.filter((p) => can(role, p));
}
export function isPermissionOverridden(role, permission) {
  return !!(permissionOverrides[role] && permissionOverrides[role][permission] != null);
}
export function setPermissionOverride(role, permission, allowed) {
  if (!permissionOverrides[role]) permissionOverrides[role] = {};
  permissionOverrides[role][permission] = allowed;
  notifyAccessChange();
}
export function resetPermissionOverride(role, permission) {
  if (permissionOverrides[role]) delete permissionOverrides[role][permission];
  notifyAccessChange();
}

// Platform Admin can edit each persona's brief description (PERSONAS[role].scope) from Roles & Permissions.
// No global notify — scope is only rendered on this admin screen, and a full re-render would
// clobber any unsaved edits in other persona cards.
export function setPersonaScope(role, text) {
  if (!PERSONAS[role]) return;
  PERSONAS[role].scope = String(text || '').trim();
}
