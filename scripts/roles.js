// Personas and permission gating for the role switcher.
// Org groups: SSD (Microsoft), CSAM Innovation, and the Delivery Partner.
export const PERSONAS = {
  // SSD (Microsoft): WW Lead → TZ Lead → CSA Manager → POD Lead
  'ww-lead': { role: 'ww-lead', name: 'Jordan Pierce', title: 'Worldwide Lead · SSD', initials: 'JP', color: '#5c2e91', org: 'SSD', scope: 'Global portfolio, CPE & delivery trends, sentiment, MBR roll-ups.' },
  'tz-lead': { role: 'tz-lead', name: 'Morgan Reyes', title: 'TZ Lead · Americas', initials: 'MR', color: '#0f6cbd', org: 'SSD', scope: 'Territory portfolio and operations across the time zone / OUs.' },
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
};

export const ROLE_ORDER = ['ww-lead', 'tz-lead', 'csa-manager', 'pod-lead', 'business-manager', 'csa', 'ip-lead', 'adoption-lead', 'partner-csa', 'sdm', 'operations-manager'];

const ROLE_PERMISSIONS = {
  'ww-lead': ['view:portfolio', 'view:allPartners', 'run:mbr'],
  'tz-lead': ['view:portfolio', 'view:allPartners', 'run:mbr'],
  'csa-manager': ['view:portfolio', 'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'view:allPartners', 'run:mbr'],
  'pod-lead': ['view:portfolio', 'view:pip', 'edit:pip', 'edit:dispatch', 'edit:escalation', 'edit:capacity', 'view:allPartners', 'run:mbr'],
  'business-manager': ['view:portfolio', 'view:allPartners', 'run:mbr'],
  csa: [],
  'ip-lead': ['view:portfolio'],
  'adoption-lead': ['view:portfolio'],
  'partner-csa': [],
  sdm: ['edit:escalation', 'view:allPartners', 'run:mbr'],
  'operations-manager': ['edit:capacity', 'view:allPartners'],
};

export function can(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}
