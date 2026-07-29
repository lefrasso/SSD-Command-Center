// Personas and permission gating for the role switcher.
export const PERSONAS = {
  'pod-lead': { role: 'pod-lead', name: 'Alex Navarro', title: 'Sr CSA Manager · EMEA TZ Lead', initials: 'AN', color: '#0f6cbd', scope: 'Runs PODs, dispatches, coaches, owns escalations, PIPs & MBRs.' },
  'partner-csa': { role: 'partner-csa', name: 'Marco Rossi', title: 'Partner CSA · Avanade', initials: 'MR', color: '#2aa0a4', scope: 'Sees assigned engagements, dispatch, messages and own scorecards.' },
  sdm: { role: 'sdm', name: 'Priya Nair', title: 'Service Delivery Manager', initials: 'PN', color: '#6b69d6', scope: 'Co-owns escalations and action items, monitors partner health.' },
  dpsm: { role: 'dpsm', name: 'Sofia Marét', title: 'Delivery Partner Service Manager', initials: 'SM', color: '#bc4b09', scope: 'Sourcing, headcount, onboarding/offboarding and capacity.' },
  'business-lt': { role: 'business-lt', name: 'Jordan Pierce', title: 'SSD Worldwide Lead', initials: 'JP', color: '#5c2e91', scope: 'Portfolio dashboards, CPE & delivery trends, sentiment, roll-ups.' },
};

export const ROLE_ORDER = ['pod-lead', 'partner-csa', 'sdm', 'dpsm', 'business-lt'];

const ROLE_PERMISSIONS = {
  'pod-lead': ['view:portfolio', 'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'view:allPartners', 'run:mbr'],
  'partner-csa': [],
  sdm: ['edit:escalation', 'view:allPartners', 'run:mbr'],
  dpsm: ['edit:capacity', 'view:allPartners'],
  'business-lt': ['view:portfolio', 'view:allPartners', 'run:mbr'],
};

export function can(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}
