// Deterministic, seeded mock-data generator for SSD IQ.
// Same seed => same data (repeatable demos). All names/figures are fictional.

export const TRACKS = ['Scoping (P&E)', 'Customer Health', 'ESA', 'AI Innovation', 'Cloud'];

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

function gov(source, who = 'l.frasso') {
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
const CSAMS = ['Julia Meyer','Tom Baker','Sara Lind','Marcus Webb','Elif Demir','Paulo Neto','Hannah Ross','Ken Adachi','Bea Fontana','Ivan Petrov'];
const SDMS = ['Priya Nair','Kenji Watanabe','Laura Bianchi','Mohammed Ali','Grace Park','Tomás Herrera'];
const POD_LEADS = ['Leandro Frasso','Amara Blake','Viktor Petrov','Rosa Mendes','Daniel Kim','Chiara Romano','Felix Wagner','Nadia Hassan','Oscar Lund','Meera Shah'];
const SKILLS = ['Azure Migrate','Landing Zones','FinOps','Security Copilot','Sentinel','Fabric','Power BI','Copilot Studio','AKS','App Modernization','Data Governance','ESA Assessment','Well-Architected','Networking','Identity','Backup & ASR','Cost Optimization','AI Foundry','RAG Patterns','Prompt Engineering'];
const REGIONS = ['Iberia','UKI','DACH','Nordics','France','Italy','North America','LATAM','India','ANZ'];
// Real SSD leadership org (provided by the team). Regions roll up to time zones.
export const TZ_MAP = {
  Americas: { lead: 'Athena Sapir', regions: ['North America', 'LATAM'] },
  EMEA: { lead: 'Leandro Frasso', regions: ['Iberia', 'UKI', 'DACH', 'Nordics', 'France', 'Italy'] },
  ASIA: { lead: 'Michael Best', regions: ['India', 'ANZ'] },
};
export const LEADERSHIP = {
  wwLead: 'James Miller',
  businessManager: 'Sandra Banuchi Vargas',
  timeZones: [
    { tz: 'Americas', lead: 'Athena Sapir' },
    { tz: 'EMEA', lead: 'Leandro Frasso' },
    { tz: 'ASIA', lead: 'Michael Best' },
  ],
};
export function tzForRegion(region) {
  for (const [tz, info] of Object.entries(TZ_MAP)) if (info.regions.includes(region)) return { tz, lead: info.lead };
  return { tz: 'Global', lead: LEADERSHIP.wwLead };
}
const PROGRAMS = {
  'Scoping (P&E)': ['Plan & Envision Workshop', 'Scoping Assessment'],
  'Customer Health': ['Health Check', 'Adoption Review'],
  ESA: ['Expert Security Assessment', 'Zero Trust Review'],
  'AI Innovation': ['AI Design Win', 'Copilot Readiness', 'AI Foundry Enablement'],
  Cloud: ['Cloud Accelerate', 'Landing Zone Deployment', 'Migration Sprint'],
};
const VERBATIMS = {
  positive: ['Exceptional guidance — exceeded our expectations.','The CSA unblocked our migration in days.','Clear, proactive and deeply technical.','Best delivery experience we have had with Microsoft.','Outstanding follow-through on every action.'],
  neutral: ['Solid delivery, a few scheduling hiccups.','Good outcome; communication could be tighter.','Met expectations overall.','Competent work, nothing exceptional.'],
  negative: ['Delays in outreach set the project back.','Expected deeper technical depth for the track.','Follow-up was slow during the engagement.','Hand-offs were unclear and cost us time.'],
};
const ESC_SUMMARIES = ['Customer stakeholder unavailable; milestone at risk.','Technical blocker on landing-zone deployment.','Scope creep beyond the agreed SOW.','CPE dip flagged by the CSAM.','Access and permissions blocking delivery.','Partner resourcing gap mid-engagement.','Security assessment findings need re-review.'];
const ACTION_TITLES = ['Schedule stakeholder sync','Escalate access request to IT','Re-baseline the milestone plan','Prepare mitigation options','Draft customer communication','Assign a backup CSA','Review SOW boundaries','Book architecture review'];
const THEMES = ['responsiveness','technical depth','scheduling','communication','onboarding pace','tooling access','proactivity','documentation','stakeholder alignment'];
const MSG_POD = ['Please confirm Day 1 outreach is complete for this account.','Can you share the latest milestone status?','Customer flagged a scheduling concern — can you follow up today?','Great work on the health check. Let’s prep the CPE survey.','Reminder: artifacts due before the review on Friday.'];
const MSG_CSA = ['Day 1 outreach done — customer is engaged and responsive.','Milestone 2 is on track; migration sprint starts Monday.','Following up with the stakeholder now, will update by EOD.','Artifacts uploaded to the workspace, ready for review.','Hit a permissions blocker; raising an escalation.'];
const PIP_OBJECTIVES = ['Raise rolling CPE to 4.4 within two periods.','Complete Day 0–3 outreach on 100% of dispatches.','Close all open action items within SLA.','Attend Landing Zone enablement bootcamp.','Improve documentation quality on delivery artifacts.'];
const PIP_NOTES = ['Check-in held; outreach cadence improving.','Two engagements recovered to on-track.','CPE trend flat; agreed coaching focus.','Completed enablement module; applying on live account.'];

function fullName(used) {
  for (let i = 0; i < 50; i++) { const n = `${pick(FIRST)} ${pick(LAST)}`; if (!used.has(n)) { used.add(n); return n; } }
  return `${pick(FIRST)} ${pick(LAST)} ${used.size}`;
}
function sentimentFromScore(score) { return score >= 4.3 ? 'positive' : score >= 3.6 ? 'neutral' : 'negative'; }

function build() {
  const PARTNER_DEFS = [
    { name: 'Concentrix' }, { name: 'Convergys' }, { name: 'Avanade' },
    { name: 'Cognizant' }, { name: 'Penta' }, { name: 'HCL' },
  ];

  const pods = REGIONS.map((region, i) => {
    const { tz, lead: tzLead } = tzForRegion(region);
    return {
      id: `POD${i + 1}`, name: `POD ${region}`, leadName: POD_LEADS[i % POD_LEADS.length], region, tz, tzLead,
      tracks: pickN(TRACKS, int(2, 3)), capacity: int(24, 40), utilization: int(76, 92), ...gov('SSD IQ'),
    };
  });

  const partners = PARTNER_DEFS.map((def, i) => ({
    id: `P${i + 1}`, name: def.name, type: 'Delivery Partner', region: pick(REGIONS),
    cpe: 0, deliveries: int(60, 190), status: i === 5 ? 'onboarding' : 'active',
    contractRef: `MOSA-2026-${String(1000 + i * 7).padStart(4, '0')}`, podIds: [], ...gov('MOSA'),
  }));

  const usedNames = new Set();
  const csas = [];
  for (let i = 0; i < 48; i++) {
    const partner = pick(partners);
    const pod = pick(pods);
    const tracks = pickN(pod.tracks, int(1, pod.tracks.length));
    const utilization = clamp(Math.round(84 + (rng() - 0.5) * 26), 62, 98);
    const cpe = round1(clamp(3.9 + rng() * 0.9, 1, 5));
    const quality = round1(clamp(3.7 + rng() * 1.1, 1, 5));
    const lifecycle = weighted([['active', 0.7], ['onboarding', 0.12], ['sourcing', 0.06], ['selection', 0.04], ['offboarding', 0.08]]);
    csas.push({
      id: `CSA${String(i + 1).padStart(3, '0')}`, name: fullName(usedNames), vendor: partner.name,
      partnerId: partner.id, podId: pod.id, tracks, skills: pickN(SKILLS, int(3, 6)),
      capacity: int(3, 6), utilization, tenureMonths: int(2, 40), lifecycle, cpe, quality,
      sentiment: sentimentFromScore(cpe), ...gov('Operations'),
    });
  }

  for (const p of partners) {
    const own = csas.filter((c) => c.partnerId === p.id);
    p.podIds = [...new Set(own.map((c) => c.podId))];
    p.cpe = own.length ? round1(own.reduce((s, c) => s + c.cpe, 0) / own.length) : 4.3;
  }

  const activeCsas = csas.filter((c) => c.lifecycle === 'active');
  const csasForTrack = (t) => activeCsas.filter((c) => c.tracks.includes(t));

  const engagements = [];
  for (let i = 0; i < 82; i++) {
    const track = pick(TRACKS);
    const status = weighted([['new', 0.15], ['assigned', 0.2], ['in-delivery', 0.4], ['complete', 0.25]]);
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
    const dueOffset = complete ? -int(1, 40) : int(-6, 55);
    const atRisk = !complete && status !== 'new' && (dueOffset < 0 || (!outreach.day1 && !outreach.day2) || chance(0.12));
    const milestoneCount = int(2, 4);
    const milestones = Array.from({ length: milestoneCount }, (_, m) => ({
      label: ['Kickoff', 'Discovery', 'Design', 'Build', 'Handover'][m] ?? `Milestone ${m + 1}`,
      due: isoDay(dueOffset - (milestoneCount - m) * 7),
      done: complete ? true : m < (engaged ? int(0, milestoneCount) : 0),
    }));
    engagements.push({
      id: `ENG${String(i + 1).padStart(3, '0')}`, customer: pick(CUSTOMERS), csamName: pick(CSAMS),
      track, program: pick(PROGRAMS[track]), assignedTo: assignee ? assignee.id : null, status,
      dispatchStage, outreach, milestones, dueDate: isoDay(dueOffset), atRisk, ...gov('Dispatch'),
    });
  }

  const deliveries = [];
  let dIdx = 1;
  for (const e of engagements.filter((x) => x.status === 'complete')) {
    const onTime = chance(0.91);
    const base = new Date(e.dueDate).getTime();
    const completedDate = new Date(base + (onTime ? -1 : 1) * int(1, 6) * 864e5).toISOString().slice(0, 10);
    deliveries.push({ id: `DLV${String(dIdx++).padStart(3, '0')}`, engagementId: e.id, type: e.program, completedDate, track: e.track, ...gov('Power BI') });
  }

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
      actionIds, summary: pick(ESC_SUMMARIES), ...gov('Azure DevOps'),
    });
  }

  const cpeSource = engagements.filter((e) => e.status === 'complete' || e.status === 'in-delivery');
  const cpe = [];
  let cIdx = 1;
  for (const eng of cpeSource) {
    if (chance(0.25)) continue;
    const score = round1(clamp(3.8 + rng() * 1.3, 1, 5));
    const sentiment = sentimentFromScore(score);
    cpe.push({ id: `CPE${String(cIdx++).padStart(3, '0')}`, engagementId: eng.id, score, track: eng.track, verbatim: pick(VERBATIMS[sentiment]), date: daysAgo(int(1, 60)), sentiment, ...gov('CPE/Forms') });
  }

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

  const pipCandidates = [...activeCsas].sort((a, b) => a.quality - b.quality).slice(0, 4);
  const pips = pipCandidates.map((csa, i) => {
    const status = weighted([['active', 0.6], ['draft', 0.2], ['closed', 0.2]]);
    return {
      id: `PIP${String(i + 1).padStart(3, '0')}`, csaId: csa.id, status, opened: daysAgo(int(20, 120)),
      objectives: pickN(PIP_OBJECTIVES, int(2, 3)),
      checkIns: Array.from({ length: int(1, 3) }, () => ({ date: daysAgo(int(3, 90)), note: pick(PIP_NOTES) })),
      outcome: status === 'closed' ? (chance(0.6) ? 'met' : 'not-met') : 'in-progress', ...gov('Confidential/HR'),
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

  return { partners, pods, csas, engagements, escalations, actions, cpe, messages, pips, sentiment, deliveries };
}

export const dataset = build();
