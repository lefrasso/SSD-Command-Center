// Deterministic, seeded mock-data generator for SSD IQ.
// Same seed => same data (repeatable demos). All names/figures are fictional.

export const TRACKS = ['Health', 'AI Innovation', 'Cloud Deployment', 'Foundations'];
// Capacity forecast assumptions — CAP_PER_CSA is calibrated at BASELINE_UTILIZATION; the Trajectory
// Simulator scales effective capacity per CSA when the user sets a different expected utilization.
export const CAP_PER_CSA = 4;
export const BASELINE_UTILIZATION = 85;

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260728);
const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const chance = (p) => rng() < p;
const round1 = (x) => Math.round(x * 10) / 10;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
function pickN(arr, n) {
  const copy = [...arr]; const out = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  return out;
}
function weighted(options) {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [val, w] of options) if ((r -= w) <= 0) return val;
  return options[0][0];
}

const NOW = new Date('2026-07-28T09:00:00Z');
function isoDay(offsetDays) { const d = new Date(NOW); d.setDate(d.getDate() + offsetDays); return d.toISOString().slice(0, 10); }
function isoTime(offsetDays) { const d = new Date(NOW); d.setDate(d.getDate() + offsetDays); d.setHours(int(8, 18), int(0, 59), 0, 0); return d.toISOString(); }
const daysAgo = (n) => isoDay(-n);
const daysAhead = (n) => isoDay(n);

function gov(source, who = 'a.navarro') {
  return {
    sourceOfTruth: source, updatedAt: daysAgo(int(1, 18)),
    audit: [
      { at: daysAgo(int(40, 120)), who: 'import', action: 'record created' },
      { at: daysAgo(int(1, 18)), who, action: 'field updated' },
    ],
  };
}

const FIRST = ['Marco','Ana','Liam','Sofia','Noah','Emma','Lucas','Mia','Diego','Chloe','Hugo','Aisha','Ravi','Yuki','Omar','Nina','Pablo','Elena','Tariq','Freya','Iker','Lena','Sami','Zoe'];
const LAST = ['Rossi','Kaur','Novak','García','Müller','Silva','Haddad','Chen','Okafor','Ivanova','Costa','Dubois','Nguyen','Almeida','Kowalski','Reyes','Bianchi','Andersson','Fischer','Popescu'];
const CUSTOMERS = ['Northwind Traders','Contoso','Fabrikam','Adventure Works','Tailwind Traders','Wingtip Toys','Proseware','Litware','Fourth Coffee','Graphic Design Institute','Alpine Ski House','Coho Vineyard','Lucerne Publishing',"Margie's Travel",'Trey Research','VanArsdel','WideWorld Importers','Blue Yonder','Woodgrove Bank','Relecloud'];
// S500 = strategic/top-tier accounts; must be served by an S500-ready CSA (see Enablement & Delivery Partners).
export const S500_CUSTOMERS = ['Contoso', 'Fabrikam', 'Northwind Traders', 'Woodgrove Bank', 'Relecloud'];
export const CSAMS = ['Julia Meyer','Tom Baker','Sara Lind','Marcus Webb','Elif Demir','Paulo Neto','Hannah Ross','Ken Adachi','Bea Fontana','Ivan Petrov'];
export const SDMS = ['Priya Nair','Kenji Watanabe','Laura Bianchi','Mohammed Ali','Grace Park','Tomás Herrera'];
const POD_LEADS = [
  'Nils Berg','Amara Blake','Viktor Petrov','Rosa Mendes','Daniel Kim','Chiara Romano','Felix Wagner','Nadia Hassan','Oscar Lund','Meera Shah',
  'Maya Chen','Ethan Brooks','Leila Haddad','Tomas Silva','Ingrid Novak','Kenji Mori','Amina Yusuf','Luca Bianchi','Sofia Alvarez','Noah Fischer',
  'Priya Desai','Hugo Martin','Elena Popov','Marcus Lee','Freya Olsen','Ravi Menon','Chloe Laurent','Diego Santos','Nina Kowalski','Omar Farouk',
  'Yuki Tanaka','Pablo Costa','Lena Schmidt','Sami Rahman',
];
// CSA Managers sit between the TZ Lead and the POD Leads; multiple POD Leads report to a Manager per time zone.
const TZ_MANAGERS = {
  ATZ: ['Devin Cole', 'Hana Kim'],
  EMEA: ['Bruno Alves', 'Greta Roth'],
  ASIA: ['Amir Khan', 'Lena Vogt'],
};
export const SKILLS = ['Azure Migrate','Landing Zones','FinOps','Security Copilot','Sentinel','Fabric','Power BI','Copilot Studio','AKS','App Modernization','Data Governance','ESA Assessment','Well-Architected','Networking','Identity','Backup & ASR','Cost Optimization','AI Foundry','RAG Patterns','Prompt Engineering'];
// Non-technical growth areas used by Performance & PIPs to categorize improvement objectives.
export const SOFT_SKILLS = ['Stakeholder communication', 'Executive presence', 'Active listening', 'Conflict resolution', 'Negotiation', 'Time management', 'Cross-team collaboration'];
export const QC_CRITERIA = ['Scope & success criteria documented', 'Day 0–3 outreach completed on time', 'Stakeholders identified & engaged', 'Milestone plan baselined & tracked', 'Technical guidance accurate & actionable', 'Artifacts captured & shared', 'Risks & blockers escalated appropriately', 'CPE survey requested at close'];
export const MS_CERTIFICATIONS = ['Microsoft Certified: Azure Fundamentals', 'Microsoft Certified: Azure Administrator Associate', 'Microsoft Certified: Azure Solutions Architect Expert', 'Microsoft Certified: Security, Compliance, and Identity Fundamentals', 'Microsoft Certified: Power BI Data Analyst Associate', 'Microsoft Certified: Azure AI Engineer Associate', 'Microsoft 365 Certified: Fundamentals', 'Microsoft Certified: DevOps Engineer Expert'];
const REGIONS = ['Iberia','UKI','DACH','Nordics','France','Italy','North America','LATAM','India','ANZ'];
// SSD leadership org — fictional vanity names for the prototype. Regions roll up to time zones.
export const TZ_MAP = {
  ATZ: { lead: 'Morgan Reyes', regions: ['North America', 'LATAM'] },
  EMEA: { lead: 'Alex Navarro', regions: ['Iberia', 'UKI', 'DACH', 'Nordics', 'France', 'Italy'] },
  ASIA: { lead: 'Kai Lin', regions: ['India', 'ANZ'] },
};
export const LEADERSHIP = {
  wwLead: 'Jordan Pierce',
  businessManager: 'Robin Ellis',
  timeZones: [
    { tz: 'ATZ', lead: 'Morgan Reyes' },
    { tz: 'EMEA', lead: 'Alex Navarro' },
    { tz: 'ASIA', lead: 'Kai Lin' },
  ],
};
export function tzForRegion(region) {
  for (const [tz, info] of Object.entries(TZ_MAP)) if (info.regions.includes(region)) return { tz, lead: info.lead };
  return { tz: 'Global', lead: LEADERSHIP.wwLead };
}
// Delivery languages supported per time zone. A CSA can deliver in any territory; language is the real constraint.
export const TZ_LANGUAGES = {
  ATZ: ['English', 'Spanish', 'Portuguese', 'French'],
  EMEA: ['English', 'Spanish', 'Portuguese', 'French', 'Arabic', 'German'],
  ASIA: ['English', 'Japanese', 'Mandarin', 'Korean'],
};
export const ALL_LANGUAGES = [...new Set(Object.values(TZ_LANGUAGES).flat())];
// Service catalogue: Track = Family of services; Program = the service / event. Each Program maps 1:1 to an accreditation.
export const PROGRAMS = {
  Health: ['ESA', 'Azure', 'M365', 'D365', 'Crisis Management - DMIRP', 'Crisis Management - Azure Sim', 'Crisis Management - M365 Sim', 'Crisis Management - Security', 'Crisis Management - D365 Sim'],
  'AI Innovation': ['Adoption', 'Secure Copilot', 'Agents'],
  'Cloud Deployment': ['MACC', 'AIR', 'Cloud Modernization', 'Github Copilot'],
  Foundations: ['UfP', 'UO - Onboarding', 'OU - DMIRP', 'OU - Capability Briefing AI Innovation', 'OU - Capability Briefing Resiliency and Security', 'OU - Capability Briefing Cloud Success'],
};
// Reusable IP library surfaced on Agentic Delivery; PODs rate/tag each asset after use (POD - IP Feedback).
export const IP_ASSETS = [
  { id: 'IP001', name: 'Landing Zone Playbook', track: 'Cloud Deployment', type: 'Playbook' },
  { id: 'IP002', name: 'Migration Runbook', track: 'Cloud Deployment', type: 'Runbook' },
  { id: 'IP003', name: 'Expert Security Assessment Template', track: 'Health', type: 'Template' },
  { id: 'IP004', name: 'Copilot Readiness Kit', track: 'AI Innovation', type: 'Kit' },
  { id: 'IP005', name: 'AI Foundry Enablement Deck', track: 'AI Innovation', type: 'Deck' },
  { id: 'IP006', name: 'Customer Health Scorecard', track: 'Health', type: 'Template' },
  { id: 'IP007', name: 'Plan & Envision Workshop Deck', track: 'Foundations', type: 'Deck' },
];
export const IP_TAGS = ['Reusable as-is', 'Needs minor update', 'Needs major update', 'Outdated — retire'];
const IP_FEEDBACK_COMMENTS = {
  'Reusable as-is': ['Used as-is for the customer workshop — worked great.', 'Customer loved this — no changes needed.', 'Solid starting point; delivered without edits.', 'Great structure and pacing, kept it intact.'],
  'Needs minor update': ['Needed a few tweaks to align with the latest portal UI.', 'Added our own appendix but the core held up well.', 'Pricing references were slightly stale.', 'Good bones — refresh the screenshots.'],
  'Needs major update': ['Took extra time to align with the new pricing model.', 'Missing guidance for the newest platform features.', 'Structure is dated; needed a substantial rework before use.', 'Customer examples no longer resonate — needs new case studies.'],
  'Outdated — retire': ['References a retired product; recommend retiring this asset.', 'Superseded by newer guidance — should be archived.', 'Customer flagged outdated screenshots throughout.', 'No longer matches the current delivery motion.'],
};
const VERBATIMS = {
  positive: ['Exceptional guidance — exceeded our expectations.','The CSA unblocked our migration in days.','Clear, proactive and deeply technical.','Best delivery experience we have had with Microsoft.','Outstanding follow-through on every action.'],
  neutral: ['Solid delivery, a few scheduling hiccups.','Good outcome; communication could be tighter.','Met expectations overall.','Competent work, nothing exceptional.'],
  negative: ['Delays in outreach set the project back.','Expected deeper technical depth for the track.','Follow-up was slow during the engagement.','Hand-offs were unclear and cost us time.'],
};
const DSAT_ROOT_CAUSES = ['DP preparedness / execution', 'Time allocation / scheduling', 'Data accuracy / results quality', 'Communication / expectation alignment'];
const ESC_SUMMARIES = ['Customer stakeholder unavailable; milestone at risk.','Technical blocker on landing-zone deployment.','Scope creep beyond the agreed SOW.','CPE dip flagged by the CSAM.','Access and permissions blocking delivery.','Partner resourcing gap mid-engagement.','Security assessment findings need re-review.'];
const ACTION_TITLES = ['Schedule stakeholder sync','Escalate access request to IT','Re-baseline the milestone plan','Prepare mitigation options','Draft customer communication','Assign a backup CSA','Review SOW boundaries','Book architecture review'];
const THEMES = ['responsiveness','technical depth','scheduling','communication','onboarding pace','tooling access','proactivity','documentation','stakeholder alignment'];
const MSG_POD = ['Please confirm Day 1 outreach is complete for this account.','Can you share the latest milestone status?','Customer flagged a scheduling concern — can you follow up today?','Great work on the health check. Let’s prep the CPE survey.','Reminder: artifacts due before the review on Friday.'];
const MSG_CSA = ['Day 1 outreach done — customer is engaged and responsive.','Milestone 2 is on track; migration sprint starts Monday.','Following up with the stakeholder now, will update by EOD.','Artifacts uploaded to the workspace, ready for review.','Hit a permissions blocker; raising an escalation.'];
const PIP_NOTES = ['Check-in held; outreach cadence improving.','Two engagements recovered to on-track.','CPE trend flat; agreed coaching focus.','Completed enablement module; applying on live account.'];
const STORY_IMPACTS = [
  'Reduced the delivery timeline by three weeks while keeping the agreed scope intact.',
  'Established a repeatable operating model and transferred ownership to the customer team.',
  'Removed a critical technical blocker and accelerated the path to production.',
  'Improved platform resilience and gave stakeholders a prioritized action plan.',
  'Converted discovery findings into measurable adoption milestones for the next quarter.',
];
export const SUCCESS_STORY_INDUSTRIES = ['Financial Services', 'Manufacturing', 'Retail & Consumer Goods', 'Healthcare', 'Government', 'Education', 'Energy', 'Telecommunication', 'Media & Entertainment', 'Automotive', 'Professional Services', 'Real Estate'];
export const SUCCESS_STORY_SEGMENTS = ['Enterprise', 'Corporate Account', 'Small, Medium, Corporate', 'Public Sector', 'Global Account', 'Strategic / Top Account'];
const REGION_COUNTRIES = {
  Iberia: 'Spain', UKI: 'United Kingdom', DACH: 'Germany', Nordics: 'Sweden', France: 'France', Italy: 'Italy',
  'North America': 'United States - US-OGE', LATAM: 'Brazil', India: 'India', ANZ: 'Australia',
};
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function fiscalYear(dateValue) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  const year = date.getUTCFullYear() + (date.getUTCMonth() >= 6 ? 1 : 0);
  return `FY${String(year).slice(-2)}`;
}

function fullName(used) {
  for (let i = 0; i < 50; i++) { const n = `${pick(FIRST)} ${pick(LAST)}`; if (!used.has(n)) { used.add(n); return n; } }
  return `${pick(FIRST)} ${pick(LAST)} ${used.size}`;
}
function sentimentFromScore(score) { return score >= 4.3 ? 'positive' : score >= 3.6 ? 'neutral' : 'negative'; }
function sentimentLevel(score) {
  if (score >= 0.75) return 'very-positive';
  if (score >= 0.4) return 'positive';
  if (score >= 0.15) return 'slightly-positive';
  if (score > -0.15) return 'neutral';
  if (score > -0.4) return 'slightly-negative';
  if (score > -0.75) return 'negative';
  return 'very-negative';
}

function build() {
  const PARTNER_DEFS = [
    { name: 'Concentrix' }, { name: 'Convergys' }, { name: 'Avanade' },
    { name: 'Cognizant' }, { name: 'Penta' }, { name: 'HCL' },
  ];

  const podTargets = { ATZ: 15, EMEA: 12, ASIA: 7 };
  const pods = [];
  for (const [tz, count] of Object.entries(podTargets)) {
    const { lead: tzLead, regions } = TZ_MAP[tz];
    const managers = TZ_MANAGERS[tz];
    for (let i = 0; i < count; i++) {
      const podIndex = pods.length;
      const region = regions[i % regions.length];
      const podNumber = Math.floor(i / regions.length) + 1;
      pods.push({
        id: `POD${String(podIndex + 1).padStart(2, '0')}`, name: `POD ${region} ${String(podNumber).padStart(2, '0')}`,
        leadName: POD_LEADS[podIndex], csaManager: managers[i % managers.length], region, tz, tzLead,
        tracks: pickN(TRACKS, int(2, 3)), capacity: int(24, 40), utilization: int(76, 92), ...gov('SSD IQ'),
      });
    }
  }

  const partners = PARTNER_DEFS.map((def, i) => ({
    id: `P${i + 1}`, name: def.name, type: 'Delivery Partner', region: pick(REGIONS),
    cpe: 0, deliveries: int(60, 190), status: i === 5 ? 'onboarding' : 'active',
    contractRef: `MOSA-2026-${String(1000 + i * 7).padStart(4, '0')}`, podIds: [], ...gov('MOSA'),
  }));

  const usedNames = new Set();
  const csas = [];
  const FTC_COUNT = 202;
  const FTE_COUNT = 24;
  for (let i = 0; i < FTC_COUNT + FTE_COUNT; i++) {
    const partner = pick(partners);
    const pod = pick(pods);
    const tracks = pickN(pod.tracks, int(1, pod.tracks.length));
    const trackPrograms = tracks.flatMap((t) => PROGRAMS[t] || []);
    const accreditations = pickN(trackPrograms, Math.min(trackPrograms.length, int(2, 5)));
    const tzLangs = TZ_LANGUAGES[pod.tz] || ALL_LANGUAGES;
    const languages = pickN(tzLangs, int(1, 3));
    const resourceType = i < FTC_COUNT ? 'FTC' : 'FTE';
    const utilization = clamp(Math.round(84 + (rng() - 0.5) * 26), 62, 98);
    const cpe = round1(clamp(3.9 + rng() * 0.9, 1, 5));
    const quality = round1(clamp(3.7 + rng() * 1.1, 1, 5));
    const lifecycle = weighted([['active', 0.7], ['onboarding', 0.12], ['sourcing', 0.06], ['selection', 0.04], ['offboarding', 0.08]]);
    const vendorName = resourceType === 'FTE' ? pick(['Nebula', 'GSCD']) : partner.name;
    const tenureMonths = int(2, 40);
    // S500 readiness is marked independently (e.g. in SharePoint) and then reconciled against computed eligibility.
    const s500Eligible = cpe >= 4.4 && quality >= 4.4 && tenureMonths >= 6;
    const s500Ready = s500Eligible ? chance(0.85) : chance(0.08);
    csas.push({
      id: `CSA${String(i + 1).padStart(3, '0')}`, name: fullName(usedNames), vendor: vendorName,
      resourceType, partnerId: partner.id, podId: pod.id, tracks, accreditations, languages, skills: pickN(SKILLS, int(3, 6)),
      capacity: int(3, 6), utilization, tenureMonths, lifecycle, cpe, quality,
      s500Ready, s500Reconciled: s500Ready === s500Eligible,
      sentiment: sentimentFromScore(cpe), ...gov('Operations'),
    });
  }

  for (const p of partners) {
    const own = csas.filter((c) => c.partnerId === p.id);
    p.podIds = [...new Set(own.map((c) => c.podId))];
    p.cpe = own.length ? round1(own.reduce((s, c) => s + c.cpe, 0) / own.length) : 4.3;
    p.quality = own.length ? round1(own.reduce((s, c) => s + c.quality, 0) / own.length) : 4.1;
  }

  // Headcount consolidation targets per POD (Active & Future HC tracking).
  for (const p of pods) {
    p.hcActive = csas.filter((c) => c.podId === p.id && c.lifecycle === 'active').length;
    p.hcTarget = p.hcActive + int(1, 4);
  }

  const activeCsas = csas.filter((c) => c.lifecycle === 'active');
  const csasForTrack = (t) => activeCsas.filter((c) => c.tracks.includes(t));

  const engagements = [];
  const COMPLETED_ENGAGEMENTS = 1300;
  const PIPELINE_ENGAGEMENTS = 120;
  for (let i = 0; i < COMPLETED_ENGAGEMENTS + PIPELINE_ENGAGEMENTS; i++) {
    const track = pick(TRACKS);
    const status = i < COMPLETED_ENGAGEMENTS ? 'complete' : weighted([['new', 0.25], ['assigned', 0.3], ['in-delivery', 0.45]]);
    const pool = csasForTrack(track);
    const assignee = status === 'new' || pool.length === 0 ? null : pick(pool);
    const dispatchStage = status === 'new' ? 'Day 0' : status === 'assigned' ? pick(['Day 0', 'Day 1', 'Day 2', 'Day 3']) : 'engaged';
    const engaged = dispatchStage === 'engaged';
    const outreach = {
      day0: engaged || dispatchStage !== 'Day 0',
      day1: engaged || ['Day 2', 'Day 3'].includes(dispatchStage) || (dispatchStage === 'Day 1' && chance(0.5)),
      day2: engaged || dispatchStage === 'Day 3' || (dispatchStage === 'Day 2' && chance(0.4)),
      day3: engaged ? chance(0.85) : dispatchStage === 'Day 3' && chance(0.4),
    };
    const complete = status === 'complete';
    const dueOffset = complete ? -((i % 135) + 7) : int(-6, 55);
    const atRisk = !complete && status !== 'new' && (dueOffset < 0 || (!outreach.day1 && !outreach.day2) || chance(0.12));
    const milestoneCount = int(2, 4);
    const milestones = Array.from({ length: milestoneCount }, (_, m) => ({
      label: ['Kickoff', 'Discovery', 'Design', 'Build', 'Handover'][m] ?? `Milestone ${m + 1}`,
      due: isoDay(dueOffset - (milestoneCount - m) * 7),
      done: complete ? true : m < (engaged ? int(0, milestoneCount) : 0),
    }));
    const customer = pick(CUSTOMERS);
    engagements.push({
      id: `ENG${String(i + 1).padStart(3, '0')}`, customer, csamName: pick(CSAMS),
      track, program: pick(PROGRAMS[track]), assignedTo: assignee ? assignee.id : null, status,
      dispatchStage, outreach, milestones, dueDate: isoDay(dueOffset), atRisk, s500Customer: S500_CUSTOMERS.includes(customer), ...gov('Dispatch'),
    });
  }

  // Capacity theoretical targets (leadership-approved operating-model headcount per Family) and a
  // trailing 6-month demand history per Family — feeds the Capacity Trajectory Simulator. Demand here
  // is modeled as monthly workload throughput (headcount × utilization × capacity-per-CSA), not the
  // sparse "currently open" engagement snapshot — a flow measure suitable for a trend/trajectory.
  const capacityTargets = {};
  const demandHistory = {};
  for (const t of TRACKS) {
    const headcountForTrack = csasForTrack(t);
    capacityTargets[t] = Math.max(1, headcountForTrack.length + int(-6, 10));
    const avgUtilForTrack = headcountForTrack.length ? headcountForTrack.reduce((s, c) => s + c.utilization, 0) / headcountForTrack.length : BASELINE_UTILIZATION;
    const currentDemand = Math.round(headcountForTrack.length * (avgUtilForTrack / 100) * CAP_PER_CSA);
    const monthlyTrend = (-8 + rng() * 20) / 100; // per-family drift, roughly -8%..+12% month over month
    const points = [];
    let demand = currentDemand;
    for (let m = 0; m < 6; m++) {
      points.unshift(Math.max(0, Math.round(demand * (1 + (rng() - 0.5) * 0.1))));
      demand /= (1 + monthlyTrend);
    }
    const months = [];
    for (let m = 5; m >= 0; m--) { const dt = new Date(NOW); dt.setUTCMonth(dt.getUTCMonth() - m); months.push(dt.toISOString().slice(0, 7)); }
    demandHistory[t] = months.map((month, i) => ({ month, demand: points[i] }));
  }

  const deliveries = [];
  let dIdx = 1;
  for (const e of engagements.filter((x) => x.status === 'complete')) {
    const onTime = chance(0.91);
    const base = new Date(e.dueDate).getTime();
    const completedDate = new Date(base + (onTime ? -1 : 1) * int(1, 6) * 864e5).toISOString().slice(0, 10);
    deliveries.push({ id: `DLV${String(dIdx++).padStart(3, '0')}`, engagementId: e.id, type: e.program, completedDate, track: e.track, ...gov('Power BI') });
  }
  const engagementById = new Map(engagements.map((engagement) => [engagement.id, engagement]));
  const partnerByCsa = new Map(csas.map((csa) => [csa.id, csa.partnerId]));
  const deliveryCountByPartner = new Map(partners.map((partner) => [partner.id, 0]));
  deliveries.forEach((delivery) => {
    const partnerId = partnerByCsa.get(engagementById.get(delivery.engagementId)?.assignedTo);
    if (partnerId) deliveryCountByPartner.set(partnerId, deliveryCountByPartner.get(partnerId) + 1);
  });
  partners.forEach((partner) => { partner.deliveries = deliveryCountByPartner.get(partner.id); });

  const escSource = engagements.filter((e) => e.status === 'in-delivery' || e.atRisk);
  const escalations = [];
  const actions = [];
  let aIdx = 1;
  const escCount = Math.min(24, escSource.length);
  for (let i = 0; i < escCount; i++) {
    const eng = escSource[i];
    const severity = weighted([['sev1', 0.08], ['sev2', 0.25], ['sev3', 0.4], ['sev4', 0.27]]);
    const status = weighted([['new', 0.15], ['investigating', 0.3], ['mitigating', 0.25], ['resolved', 0.3]]);
    const assignee = eng.assignedTo ? csas.find((c) => c.id === eng.assignedTo) : undefined;
    const pod = assignee ? pods.find((p) => p.id === assignee.podId) : undefined;
    const slaHours = { sev1: 8, sev2: 24, sev3: 48, sev4: 72 }[severity];
    const escId = `ESC${String(i + 1).padStart(3, '0')}`;
    const actionIds = [];
    const nActions = int(1, 3);
    for (let a = 0; a < nActions; a++) {
      const actId = `ACT${String(aIdx++).padStart(3, '0')}`;
      actionIds.push(actId);
      actions.push({
        id: actId, escalationId: escId, title: pick(ACTION_TITLES), ownerName: assignee?.name ?? pick(POD_LEADS),
        due: daysAhead(int(1, 18)),
        status: status === 'resolved' ? 'done' : weighted([['open', 0.4], ['in-progress', 0.4], ['done', 0.2]]),
        ...gov('Azure DevOps'),
      });
    }
    escalations.push({
      id: escId, engagementId: eng.id, severity, status, ownerName: pod?.leadName ?? pick(POD_LEADS),
      sdmName: pick(SDMS), adoRef: `AB#${int(20000, 99999)}`, opened: daysAgo(int(1, 45)), slaHours,
      actionIds, summary: pick(ESC_SUMMARIES), raisedBy: 'import', channel: 'internal', ...gov('Azure DevOps'),
    });
  }

  const cpeSource = engagements.filter((e) => e.status === 'complete' || e.status === 'in-delivery');
  const cpe = [];
  let cIdx = 1;
  for (const eng of cpeSource) {
    if (chance(0.25)) continue;
    const id = `CPE${String(cIdx).padStart(3, '0')}`;
    const score = cIdx % 14 === 0 ? 2 : cIdx % 4 !== 1 ? 5 : round1(clamp(3.8 + rng() * 1.3, 1, 5));
    cIdx++;
    const sentiment = sentimentFromScore(score);
    const feedbackClass = score === 5 ? 'VSAT' : score < 3.6 ? 'DSAT' : 'neutral';
    const feedbackDate = feedbackClass === 'DSAT'
      ? (id === 'CPE014' ? daysAgo(12) : id === 'CPE028' ? daysAgo(40) : daysAgo(50))
      : daysAgo(int(1, 60));
    cpe.push({
      id, engagementId: eng.id, score, class: feedbackClass, surveyStatus: 'Completed', track: eng.track,
      verbatim: pick(VERBATIMS[sentiment]), rootCauseCategory: feedbackClass === 'DSAT' ? DSAT_ROOT_CAUSES[cIdx % DSAT_ROOT_CAUSES.length] : null,
      rootCauseAction: feedbackClass === 'DSAT' ? pick(['POD Lead coaching and delivery-plan review', 'Re-baseline scope and stakeholder expectations', 'Validate source data and repeat the findings review', 'Assign follow-up action with the CSAM']) : null,
      date: feedbackDate, sentiment, ...gov('CPE/Forms'),
    });
  }

  const vsatFeedback = cpe.filter((item) => item.class === 'VSAT');
  const vsatStoryInputs = vsatFeedback.slice(0, 7).map((feedback) => ({ feedback, eng: engagements.find((item) => item.id === feedback.engagementId) }));
  const linkedIds = new Set(vsatStoryInputs.map(({ eng }) => eng.id));
  const otherStoryInputs = engagements.filter((eng) => eng.status === 'complete' && !linkedIds.has(eng.id)).slice(0, 5).map((eng) => ({ feedback: null, eng }));
  const storyInputs = [...vsatStoryInputs, ...otherStoryInputs];
  const storyStatuses = ['published', 'published', 'published', 'published', 'approved', 'approved', 'leadership-review', 'leadership-review', 'pod-review', 'sdm-review', 'draft', 'draft'];
  const successStories = storyInputs.map(({ eng, feedback }, i) => {
    const csa = csas.find((c) => c.id === eng.assignedTo);
    const pod = csa ? pods.find((item) => item.id === csa.podId) : null;
    const partner = csa ? partners.find((item) => item.id === csa.partnerId) : null;
    const related = engagements.find((item) => item.id !== eng.id && item.customer === eng.customer && item.status === 'complete');
    const engagementIds = related && i % 4 === 0 ? [eng.id, related.id] : [eng.id];
    const status = storyStatuses[i];
    const published = status === 'published';
    const approved = published || status === 'approved';
    const month = MONTH_NAMES[new Date(`${eng.dueDate}T00:00:00Z`).getUTCMonth()];
    const reviewHistory = [];
    if (['pod-review', 'leadership-review', 'approved', 'published'].includes(status)) reviewHistory.push({ at: daysAgo(18), by: 'Priya Nair', stage: 'SDM review', decision: 'approved', comment: 'Written evidence and quotes reviewed.' });
    if (['leadership-review', 'approved', 'published'].includes(status)) reviewHistory.push({ at: daysAgo(12), by: pod?.leadName ?? 'POD Lead', stage: 'POD Lead review', decision: 'approved', comment: 'Delivery quality and mandatory metadata confirmed.' });
    if (['approved', 'published'].includes(status)) reviewHistory.push({ at: daysAgo(8), by: 'Jordan Pierce', stage: 'SSD Leadership approval', decision: 'approved', comment: 'Approved to demonstrate Success Program value.' });
    if (published) reviewHistory.push({ at: daysAgo(5), by: pod?.leadName ?? 'POD Lead', stage: 'SharePoint publication', decision: 'approved', comment: 'Uploaded to the SSD Success Stories library.' });
    return {
      id: `SS${String(i + 1).padStart(3, '0')}`,
      engagementId: eng.id,
      engagementIds,
      cpeId: feedback?.id ?? null,
      feedbackSource: feedback ? 'VSAT survey' : i % 2 ? 'CSAM / account team feedback' : 'Impactful delivery',
      title: `${eng.customer}: accelerating ${eng.program}`,
      headline: 'Partner-led delivery driving executive trust and actionable outcomes',
      summary: `${eng.customer} partnered with Success Services Delivery across ${engagementIds.length > 1 ? 'multiple Success Program events' : `the ${eng.program} engagement`} to create a practical roadmap with clear owners and measurable next steps.`,
      keyOutcomes: `${STORY_IMPACTS[i % STORY_IMPACTS.length]}\nPrioritized the highest-value actions with accountable owners.\nDelivered a reusable roadmap for phased execution.`,
      insights: `Customer priorities became clearer when recommendations were tied to business outcomes.\nThe POD model kept delivery quality and stakeholder alignment consistent.\nThe approach can be reused across similar ${eng.track} engagements.`,
      impact: `${STORY_IMPACTS[(i + 2) % STORY_IMPACTS.length]}\nIncreased customer confidence through documented decisions and next steps.\nIdentified follow-on value opportunities for the account team.`,
      customerQuote: feedback?.verbatim ?? 'The engagement gave our team clarity, momentum, and a plan we can execute.',
      customerQuoteAttribution: `${eng.customer} stakeholder`,
      csamQuote: 'The structured delivery translated technical findings into clear customer outcomes and follow-on actions.',
      tags: [eng.track, ...engagementIds.map((engagementId) => engagements.find((item) => item.id === engagementId)?.program).filter(Boolean)],
      family: eng.track,
      eventNames: engagementIds.map((engagementId) => engagements.find((item) => item.id === engagementId)?.program).filter(Boolean),
      timeZone: pod?.tz ?? 'Global',
      area: pod?.region ?? 'Global',
      country: REGION_COUNTRIES[pod?.region] ?? pod?.region ?? 'Not specified',
      industry: SUCCESS_STORY_INDUSTRIES[i % SUCCESS_STORY_INDUSTRIES.length],
      segment: SUCCESS_STORY_SEGMENTS[i % SUCCESS_STORY_SEGMENTS.length],
      fiscalYear: fiscalYear(eng.dueDate),
      month,
      csamName: eng.csamName,
      podLeadName: pod?.leadName ?? 'Unassigned',
      partnerName: partner?.name ?? csa?.vendor ?? 'Unassigned',
      partnerCsaName: csa?.name ?? 'Unassigned',
      status,
      ownerName: csa?.name ?? eng.csamName,
      reviewHistory,
      featured: published && i < 2,
      ltApproved: published && i < 2,
      ltApprovedBy: published && i < 2 ? 'Jordan Pierce' : null,
      ltApprovedAt: published && i < 2 ? daysAgo(int(1, 8)) : null,
      sharePointStatus: published ? 'uploaded' : 'not-uploaded',
      sharePointUrl: published ? `https://microsoft.sharepoint.com/sites/SuccessServicesDelivery/success-stories/SS${String(i + 1).padStart(3, '0')}` : null,
      publishDate: published ? daysAgo(int(3, 55)) : null,
      approvedAt: approved ? daysAgo(int(4, 30)) : null,
      customerLogoDataUrl: null,
      customerLogoName: null,
      createdAt: daysAgo(int(45, 100)),
      ...gov('SSD IQ'),
    };
  });

  const messages = [];
  let mIdx = 1;
  const threadEngs = engagements.filter((e) => e.assignedTo && e.status !== 'complete').slice(0, 32);
  threadEngs.forEach((eng, ti) => {
    const csa = csas.find((c) => c.id === eng.assignedTo);
    const pod = pods.find((p) => p.id === csa.podId);
    const threadId = `THR${String(ti + 1).padStart(3, '0')}`;
    const n = int(2, 5);
    for (let k = 0; k < n; k++) {
      const fromPod = k % 2 === 0;
      const sentiment = eng.atRisk && chance(0.4) ? 'negative' : chance(0.5) ? 'positive' : 'neutral';
      messages.push({
        id: `MSG${String(mIdx++).padStart(3, '0')}`, threadId, engagementId: eng.id,
        from: fromPod ? pod.leadName : csa.name, to: fromPod ? csa.name : pod.leadName,
        body: fromPod ? pick(MSG_POD) : pick(MSG_CSA), timestamp: isoTime(-(n - k) - int(0, 6)), sentiment, ...gov('Teams'),
      });
    }
  });

  const sentimentSignals = [];
  const addSignal = ({ engagementId, channel, timestamp, text, score, language, sourceId }) => {
    const engagement = engagements.find((item) => item.id === engagementId);
    const csa = engagement?.assignedTo ? csas.find((item) => item.id === engagement.assignedTo) : null;
    const normalizedScore = Math.round(clamp(score, -1, 1) * 100) / 100;
    const level = sentimentLevel(normalizedScore);
    sentimentSignals.push({
      id: `SIG${String(sentimentSignals.length + 1).padStart(4, '0')}`, engagementId, sourceId,
      customer: engagement?.customer ?? 'Unknown customer', partnerId: csa?.partnerId ?? null,
      channel, timestamp, text, score: normalizedScore, level,
      confidence: Math.round((0.72 + rng() * 0.27) * 100) / 100,
      language: language || 'English', translated: Boolean(language && language !== 'English'),
      themes: pickN(THEMES, int(1, 3)),
      alertStatus: normalizedScore <= -0.55 ? 'open' : 'none',
      acknowledgedBy: null, acknowledgedAt: null,
      ...gov('AI Services'),
    });
  };
  cpe.forEach((item) => {
    const engagement = engagements.find((candidate) => candidate.id === item.engagementId);
    const csa = engagement?.assignedTo ? csas.find((candidate) => candidate.id === engagement.assignedTo) : null;
    addSignal({
      engagementId: item.engagementId, sourceId: item.id, channel: 'CPE Survey',
      timestamp: `${item.date}T12:00:00Z`, text: item.verbatim,
      score: (item.score - 3) / 2, language: csa?.languages?.[0] || 'English',
    });
  });
  messages.forEach((item) => {
    const engagement = engagements.find((candidate) => candidate.id === item.engagementId);
    const csa = engagement?.assignedTo ? csas.find((candidate) => candidate.id === engagement.assignedTo) : null;
    const positiveText = /great work|on track|done|uploaded|ready for review|responsive/i.test(item.body);
    const negativeText = /blocker|concern|at risk|slow|delay|escalat|permissions/i.test(item.body);
    const score = positiveText ? 0.4 + rng() * 0.55
      : negativeText ? -(0.4 + rng() * 0.55)
        : item.sentiment === 'positive' ? 0.25 + rng() * 0.45
          : item.sentiment === 'negative' ? -(0.25 + rng() * 0.45) : (rng() - 0.5) * 0.24;
    addSignal({ engagementId: item.engagementId, sourceId: item.id, channel: 'Teams', timestamp: item.timestamp, text: item.body, score, language: csa?.languages?.[0] || 'English' });
  });
  escalations.forEach((item) => {
    const severityScore = { sev1: -0.95, sev2: -0.78, sev3: -0.56, sev4: -0.32 }[item.severity];
    addSignal({ engagementId: item.engagementId, sourceId: item.id, channel: 'Escalation', timestamp: `${item.opened}T09:00:00Z`, text: item.summary, score: severityScore + (rng() - 0.5) * 0.08, language: 'English' });
  });

  const pipCandidates = [...activeCsas].sort((a, b) => a.quality - b.quality).slice(0, 4);
  const randomPipObjective = (csa) => {
    const pod = pods.find((p) => p.id === csa.podId);
    const kind = weighted([['quality', 0.35], ['technical', 0.25], ['soft', 0.2], ['language', 0.1], ['certification', 0.1]]);
    if (kind === 'quality') return { label: `Quality check focus: ${pick(QC_CRITERIA)}`, category: 'delivery-skills', kind: 'quality-check' };
    if (kind === 'soft') return { label: `Develop soft skill: ${pick(SOFT_SKILLS)}`, category: 'soft-skills', kind: 'objective' };
    if (kind === 'language') {
      const langs = (pod && TZ_LANGUAGES[pod.tz]) || ALL_LANGUAGES;
      const gap = pick(langs.filter((l) => !csa.languages.includes(l))) || pick(ALL_LANGUAGES);
      return { label: `Build language proficiency: ${gap}`, category: 'language-proficiency', kind: 'objective' };
    }
    if (kind === 'certification') return { label: pick(MS_CERTIFICATIONS), category: 'technical-skills', kind: 'certification' };
    const gap = pick(SKILLS.filter((s) => !csa.skills.includes(s))) || pick(SKILLS);
    return { label: `Strengthen technical skill: ${gap}`, category: 'technical-skills', kind: 'objective' };
  };
  const pips = pipCandidates.map((csa, i) => {
    const status = weighted([['active', 0.6], ['draft', 0.2], ['closed', 0.2]]);
    const outcome = status === 'closed' ? (chance(0.6) ? 'met' : 'not-met') : 'in-progress';
    const objectives = Array.from({ length: int(2, 3) }, () => randomPipObjective(csa)).map((o) => ({ ...o, done: status === 'draft' ? false : (outcome === 'met' ? chance(0.85) : chance(0.4)) }));
    return {
      id: `PIP${String(i + 1).padStart(3, '0')}`, csaId: csa.id, status, opened: daysAgo(int(20, 120)),
      objectives,
      checkIns: Array.from({ length: int(1, 3) }, () => ({ date: daysAgo(int(3, 90)), note: pick(PIP_NOTES) })),
      outcome, ...gov('Confidential/HR'),
    };
  });

  // Shadowing requests — onboarding/selection/sourcing CSAs asking to observe an upcoming, assigned delivery.
  const mentees = csas.filter((c) => ['onboarding', 'selection', 'sourcing'].includes(c.lifecycle));
  const shadowWindowMs = 21 * 864e5;
  const shadowCandidates = engagements.filter((e) => e.assignedTo && (e.status === 'assigned' || e.status === 'in-delivery') && (new Date(e.dueDate).getTime() - NOW.getTime()) >= 0 && (new Date(e.dueDate).getTime() - NOW.getTime()) <= shadowWindowMs);
  const SHADOW_NOTES = ['Requesting to shadow this delivery to build track exposure.', 'Would like to observe live customer conversations before my first solo delivery.', 'Building confidence on this Program ahead of accreditation.'];
  let shdSeq = 1;
  const shadowRequests = pickN(mentees, Math.min(mentees.length, 6)).map((mentee) => {
    const pool = shadowCandidates.filter((e) => mentee.tracks.includes(e.track));
    const eng = pick(pool.length ? pool : shadowCandidates);
    if (!eng) return null;
    const status = weighted([['requested', 0.4], ['confirmed', 0.4], ['declined', 0.2]]);
    return {
      id: `SHD${String(shdSeq++).padStart(3, '0')}`, engagementId: eng.id, requesterId: mentee.id, ownerId: eng.assignedTo,
      status, note: pick(SHADOW_NOTES), requestedAt: daysAgo(int(1, 10)), respondedAt: status === 'requested' ? null : daysAgo(int(0, 5)),
      ...gov('Enablement'),
    };
  }).filter(Boolean);

  // POD IP Kit feedback — each engagement has its own IP Kit (derived from its Program); the delivering
  // POD rates/tags that Kit after use, feeding the IP Lead's refresh backlog. Not a generic component library.
  const kitCandidates = engagements.filter((e) => e.assignedTo && (e.status === 'complete' || e.status === 'in-delivery'));
  let ipfSeq = 1;
  const ipFeedback = pickN(kitCandidates, Math.min(kitCandidates.length, 40)).map((eng) => {
    const csa = csas.find((c) => c.id === eng.assignedTo);
    const pod = csa ? pods.find((p) => p.id === csa.podId) : null;
    const rating = weighted([[5, 0.3], [4, 0.35], [3, 0.2], [2, 0.1], [1, 0.05]]);
    const tag = rating >= 4 ? 'Reusable as-is' : rating === 3 ? 'Needs minor update' : weighted([['Needs major update', 0.6], ['Outdated — retire', 0.4]]);
    return {
      id: `IPF${String(ipfSeq++).padStart(3, '0')}`, engagementId: eng.id, csaId: csa ? csa.id : null, podId: pod ? pod.id : null,
      rating, tag, comment: pick(IP_FEEDBACK_COMMENTS[tag]), submittedAt: daysAgo(int(1, 90)),
      ...gov('Agentic Delivery'),
    };
  });


  const PERIODS = ['2026-04', '2026-05', '2026-06', '2026-07'];
  const sentiment = [];
  let sIdx = 1;
  for (const p of partners) {
    for (const period of PERIODS) {
      const positive = int(45, 75); const negative = int(5, 25); const neutral = clamp(100 - positive - negative, 0, 100);
      sentiment.push({ id: `SEN${String(sIdx++).padStart(3, '0')}`, scope: p.name, scopeType: 'partner', period, net: positive - negative, positive, neutral, negative, themes: pickN(THEMES, 3) });
    }
  }
  for (const t of TRACKS) {
    const positive = int(48, 78); const negative = int(4, 22); const neutral = clamp(100 - positive - negative, 0, 100);
    sentiment.push({ id: `SEN${String(sIdx++).padStart(3, '0')}`, scope: t, scopeType: 'track', period: '2026-07', net: positive - negative, positive, neutral, negative, themes: pickN(THEMES, 3) });
  }

  // Hiring requisitions (Active & Future SP HC Consolidation) — HC tracking + hiring progress.
  const HIRE_STAGES = [['Sourcing', 0.3], ['Screening', 0.22], ['Interview', 0.2], ['Offer', 0.1], ['Hired', 0.18]];
  const hiring = [];
  for (let i = 0; i < 34; i++) {
    const pod = pick(pods);
    const partner = pick(partners);
    const family = pick(pod.tracks);
    const stage = weighted(HIRE_STAGES);
    const hired = stage === 'Hired';
    const hiredDate = hired ? daysAgo(int(1, 40)) : null;
    hiring.push({
      id: `REQ${String(i + 1).padStart(3, '0')}`, family, partnerId: partner.id, podId: pod.id,
      region: pod.region, tz: pod.tz, type: chance(0.62) ? 'Growth' : 'Backfill', stage,
      opened: daysAgo(int(10, 160)), targetStart: hired ? hiredDate : daysAhead(int(5, 130)), hiredDate,
      source: chance(0.7) ? 'Delivery Partner' : 'Internal', ...gov('HC Consolidation'),
    });
  }

  // Attrition — trailing-12-month exits (voluntary/involuntary), feeding the Attrition Analysis tab and
  // linking to Backfill requisitions above. Currently-offboarding CSAs are recent/in-progress exits;
  // additional historical exits are synthesized to give a full 12-month trend.
  const EXIT_REASONS_VOLUNTARY = ['Competing offer', 'Career change', 'Relocation', 'Compensation', 'Return to study'];
  const EXIT_REASONS_INVOLUNTARY = ['Performance', 'Role elimination', 'Restructuring'];
  let atrSeq = 1;
  const offboardingCsas = csas.filter((c) => c.lifecycle === 'offboarding');
  const attritionRecent = offboardingCsas.map((c) => {
    const pod = pods.find((p) => p.id === c.podId);
    const voluntary = chance(0.78);
    return {
      id: `ATR${String(atrSeq++).padStart(3, '0')}`, csaId: c.id, name: c.name, vendor: c.vendor, resourceType: c.resourceType,
      partnerId: c.partnerId, podId: c.podId, region: pod ? pod.region : null, tz: pod ? pod.tz : null,
      family: c.tracks[0], tenureMonths: c.tenureMonths, exitType: voluntary ? 'Voluntary' : 'Involuntary',
      exitReason: pick(voluntary ? EXIT_REASONS_VOLUNTARY : EXIT_REASONS_INVOLUNTARY),
      exitDate: daysAgo(int(0, 25)), cpeAtExit: c.cpe, qualityAtExit: c.quality, ...gov('HC Consolidation'),
    };
  });
  const attritionHistorical = Array.from({ length: 46 }, () => {
    const pod = pick(pods);
    const family = pick(pod.tracks);
    const partner = pick(partners);
    const resourceType = chance(0.9) ? 'FTC' : 'FTE';
    const voluntary = chance(0.78);
    return {
      id: `ATR${String(atrSeq++).padStart(3, '0')}`, csaId: null, name: fullName(usedNames), vendor: resourceType === 'FTE' ? pick(['Nebula', 'GSCD']) : partner.name,
      resourceType, partnerId: partner.id, podId: pod.id, region: pod.region, tz: pod.tz, family, tenureMonths: int(2, 44),
      exitType: voluntary ? 'Voluntary' : 'Involuntary', exitReason: pick(voluntary ? EXIT_REASONS_VOLUNTARY : EXIT_REASONS_INVOLUNTARY),
      exitDate: daysAgo(int(26, 365)), cpeAtExit: round1(clamp(3.6 + rng() * 1.2, 1, 5)), qualityAtExit: round1(clamp(3.4 + rng() * 1.3, 1, 5)),
      ...gov('HC Consolidation'),
    };
  });
  const usedBackfillReqs = new Set();
  const attrition = [...attritionRecent, ...attritionHistorical].map((a) => {
    const req = hiring.find((h) => h.type === 'Backfill' && h.family === a.family && h.podId === a.podId && !usedBackfillReqs.has(h.id));
    if (req) usedBackfillReqs.add(req.id);
    return { ...a, regretted: a.exitType === 'Voluntary' && a.cpeAtExit >= 4.3 && a.qualityAtExit >= 4.2, backfillReqId: req ? req.id : null };
  });

  const financials = [];
  const financialCategories = ['Delivery Partner spend', 'Program management', 'Platforms & tooling', 'Enablement & readiness'];
  for (const period of ['2026-06', '2026-07']) {
    for (const scope of ['Success Programs', 'Success Services']) {
      financialCategories.forEach((category, i) => {
        const scopeFactor = scope === 'Success Programs' ? 1 : 0.72;
        const budget = Math.round((420000 - i * 65000) * scopeFactor);
        const actual = Math.round(budget * (0.93 + rng() * 0.14));
        financials.push({
          id: `FIN${String(financials.length + 1).padStart(3, '0')}`, period, scope, category,
          budget, actual, forecast: Math.round(actual * (1.01 + rng() * 0.04)),
          variance: actual - budget, status: actual <= budget * 1.02 ? 'on-track' : actual <= budget * 1.08 ? 'watch' : 'over-plan',
          ...gov('Finance / Power BI'),
        });
      });
    }
  }

  const initiatives = [
    { id: 'INI001', type: 'Offering', name: 'Cloud Modernization Event refresh', area: 'Cloud Deployment', stage: 'Pilot', ownerName: 'Elif Kaya', targetRelease: 'FY27 Q2', status: 'on-track', impact: 'Standardized modernization roadmap and reusable delivery assets.', nextStep: 'Complete two pilot deliveries.' },
    { id: 'INI002', type: 'Offering', name: 'Secure Copilot capabilities review', area: 'AI Innovation', stage: 'Scale', ownerName: 'Diego Marín', targetRelease: 'FY27 Q1', status: 'on-track', impact: 'Accelerates secure adoption planning.', nextStep: 'Publish updated facilitator guide.' },
    { id: 'INI003', type: 'Offering', name: 'Resiliency and Security briefing', area: 'Customer Health', stage: 'Design', ownerName: 'Morgan Reyes', targetRelease: 'FY27 Q2', status: 'watch', impact: 'Connects resilience findings to business continuity.', nextStep: 'Resolve content review dependencies.' },
    { id: 'INI004', type: 'IP', name: 'Unified Foundations delivery kit', area: 'Foundations', stage: 'Build', ownerName: 'Elif Kaya', targetRelease: 'FY27 Q2', status: 'on-track', impact: 'Reusable preparation, discovery, and handover assets.', nextStep: 'Validate with POD Leads.' },
    { id: 'INI005', type: 'Platform', name: 'NEBULA delivery agent', area: 'Agentic Delivery', stage: 'MVP', ownerName: 'Diego Marín', targetRelease: 'FY27 Q3', status: 'watch', impact: 'Drafts evidence-linked delivery artifacts.', nextStep: 'Complete groundedness evaluation.' },
    { id: 'INI006', type: 'Platform', name: 'SSD IQ reporting semantic model', area: 'Reporting', stage: 'Pilot', ownerName: 'Robin Ellis', targetRelease: 'FY27 Q2', status: 'on-track', impact: 'Reconciles MBR metrics and enables governed drill-through.', nextStep: 'Reconcile Power BI measures.' },
  ].map((initiative) => ({ ...initiative, ...gov('Portfolio Management') }));

  return { partners, pods, csas, engagements, successStories, escalations, actions, cpe, messages, sentimentSignals, pips, shadowRequests, ipFeedback, sentiment, deliveries, hiring, attrition, financials, initiatives, capacityTargets, demandHistory };
}

export const dataset = build();
