// Personas and permission gating for the role switcher.
// Org groups: SSD (Microsoft), CSAM Innovation, the Delivery Partner, Customer Success, and Platform Admin.
import { notifyAccessChange } from './store.js';

export const PERSONAS = {
  // SSD (Microsoft): WW Lead → TZ Lead → CSA Manager → POD Lead
  'ww-lead': { role: 'ww-lead', name: 'Jordan Pierce', title: 'Worldwide Lead · SSD', initials: 'JP', color: '#5c2e91', org: 'SSD', scope: 'Global portfolio, CPE & delivery trends, sentiment, MBR roll-ups.' },
  'tz-lead': { role: 'tz-lead', name: 'Morgan Reyes', title: 'TZ Lead · ATZ', initials: 'MR', color: '#0f6cbd', org: 'SSD', scope: 'Territory portfolio and operations across the time zone / OUs.' },
  'csa-manager': { role: 'csa-manager', name: 'Devin Cole', title: 'CSA Manager · EMEA', initials: 'DC', color: '#6b69d6', org: 'SSD', scope: 'Manages POD Leads; dispatch, capacity, escalations, performance.' },
  'pod-lead': { role: 'pod-lead', name: 'Sam Okoro', title: 'POD Lead · EMEA', initials: 'SO', color: '#2aa0a4', org: 'SSD', scope: 'Runs a POD, dispatches, coaches, owns escalations, PIPs & MBRs.' },
  'business-manager': { role: 'business-manager', name: 'Robin Ellis', title: 'Business Manager · SSD', initials: 'RE', color: '#bc4b09', org: 'SSD', scope: 'Business operations, planning and portfolio roll-ups.' },
  csa: { role: 'csa', name: 'Noa Feldman', title: 'CSA · Microsoft SSD', initials: 'NF', color: '#107c41', org: 'SSD', scope: 'Delivers engagements; sees dispatch, messages and own scorecard.' },
  // CSAM Innovation
  'ip-lead': { role: 'ip-lead', name: 'Elif Kaya', title: 'IP Lead · CSAM Innovation', initials: 'EK', color: '#b146c2', org: 'CSAM Innovation', scope: 'Delivery IP and reusable assets; reporting insight.' },
  'adoption-lead': { role: 'adoption-lead', name: 'Diego Marín', title: 'Adoption Lead · CSAM Innovation', initials: 'DM', color: '#d83b01', org: 'CSAM Innovation', scope: 'Adoption programs and outcomes; reporting insight.' },
  // Delivery Partner
  'partner-csa': { role: 'partner-csa', name: 'Marco Rossi', title: 'Partner CSA · Avanade', initials: 'MR', color: '#038387', org: 'Delivery Partner', scope: 'Sees assigned engagements, dispatch, messages and own scorecards.' },
  sdm: { role: 'sdm', name: 'Priya Nair', title: 'SDM · Delivery Partner', initials: 'PN', color: '#5b5fc7', org: 'Delivery Partner', scope: 'Co-owns escalations and action items, monitors partner health.' },
  'operations-manager': { role: 'operations-manager', name: 'Omar Haddad', title: 'Operations Manager · Delivery Partner', initials: 'OH', color: '#8764b8', org: 'Delivery Partner', scope: 'Sourcing, headcount, onboarding/offboarding and capacity.' },
  // Customer Success (Microsoft, customer-facing)
  csam: { role: 'csam', name: 'Julia Meyer', title: 'CSAM · Customer Success', initials: 'JM', color: '#c19c00', org: 'Customer Success', scope: 'Owns the customer relationship; raises delivery concerns as escalations for the POD Lead/SDM.' },
  // Platform Admin (governs Compass itself, not a delivery role)
  admin: { role: 'admin', name: 'Alex Ito', title: 'Platform Admin · Compass', initials: 'AI', color: '#3b3a39', org: 'Platform Admin', scope: 'Manages persona access to modules and capability permissions. No delivery-data ownership.' },
};

export const ROLE_ORDER = ['ww-lead', 'tz-lead', 'csa-manager', 'pod-lead', 'business-manager', 'csa', 'ip-lead', 'adoption-lead', 'partner-csa', 'sdm', 'operations-manager', 'csam', 'admin'];

// Every capability permission checked anywhere in the app via can(), plus the Admin-only permission that gates Roles & Permissions.
export const ALL_PERMISSIONS = [
  'view:portfolio', 'view:allPartners', 'run:mbr',
  'edit:successStories', 'assign:successStoryActions', 'review:successStories',
  'approve:podSuccessStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories', 'publish:successStories',
  'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'raise:escalation',
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
  'manage:accessControl': 'Manage roles & permissions (Platform Admin)',
};

const ROLE_PERMISSIONS = {
  'ww-lead': ['view:portfolio', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories'],
  'tz-lead': ['view:portfolio', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories'],
  'csa-manager': ['view:portfolio', 'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:podSuccessStories', 'publish:successStories', 'assign:successStoryActions'],
  'pod-lead': ['view:portfolio', 'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:podSuccessStories', 'publish:successStories', 'assign:successStoryActions'],
  'business-manager': ['view:portfolio', 'view:allPartners', 'run:mbr', 'edit:successStories', 'approve:leadershipSuccessStories', 'approve:ltSuccessStories'],
  csa: ['edit:successStories'],
  'ip-lead': ['view:portfolio', 'edit:successStories'],
  'adoption-lead': ['view:portfolio', 'edit:successStories'],
  'partner-csa': ['edit:successStories'],
  sdm: ['edit:escalation', 'view:allPartners', 'run:mbr', 'review:successStories'],
  'operations-manager': ['edit:capacity', 'view:allPartners'],
  csam: ['raise:escalation'],
  admin: ['manage:accessControl'],
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
