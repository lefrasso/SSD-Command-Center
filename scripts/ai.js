// AI Services layer — SIMULATED. Deterministic, data-driven mocks.
// Every consumer stamps output with an "AI-generated" chip. Production seam:
// swap these for Azure OpenAI grounded over SSD IQ (see azureOpenAiStub.js).
import { computeKpis, hoursSince, computePodPerformance, computePartnerPerformance, ipKitStats, store } from './store.js';
import { QC_CRITERIA, PROGRAMS, TZ_LANGUAGES } from '../data/generate.js';

const now = () => new Date().toISOString();

export function dailyBriefing(role, d = store.data) {
  const k = computeKpis(d);
  const atRisk = d.engagements.filter((e) => e.atRisk);
  const breaches = d.escalations.filter((e) => e.status !== 'resolved' && hoursSince(e.opened) > e.slaHours);
  const lowCpe = d.cpe.filter((c) => c.score < 3.6);
  const newDemand = d.engagements.filter((e) => e.status === 'new');
  const bullets = []; const anomalies = []; let headline = '';

  if (role === 'partner-csa') {
    const me = d.csas.find((c) => c.lifecycle === 'active') || d.csas[0];
    const mine = d.engagements.filter((e) => e.assignedTo === me.id);
    const outreachDue = mine.filter((e) => !e.outreach.day1 || !e.outreach.day2);
    headline = `You have ${mine.length} active engagement(s); ${outreachDue.length} need outreach follow-up.`;
    bullets.push(`Complete Day 0–3 outreach on ${outreachDue.length} account(s) still pending.`);
    bullets.push(`Your rolling CPE is ${me.cpe.toFixed(1)} — keep artifacts current for the survey.`);
    if (outreachDue[0]) anomalies.push(`${outreachDue[0].customer}: outreach cadence incomplete.`);
  } else if (role === 'sdm') {
    headline = `${k.openEscalations} open escalations, ${k.slaBreaches} breaching SLA — co-owned with POD Leads.`;
    bullets.push(`${breaches.length} escalation(s) past SLA need an SDM decision.`);
    bullets.push(`${d.actions.filter((a) => a.status !== 'done').length} action items open across cases.`);
  } else if (role === 'operations-manager') {
    const onboarding = d.csas.filter((c) => c.lifecycle === 'onboarding').length;
    const offboarding = d.csas.filter((c) => c.lifecycle === 'offboarding').length;
    headline = `${onboarding} CSAs onboarding, ${offboarding} offboarding; utilization at ${k.utilization}%.`;
    bullets.push(`Capacity is ${k.utilization}% — ${k.utilization > 90 ? 'over the healthy band' : 'within band'}.`);
    bullets.push(`${newDemand.length} unassigned engagements may need additional headcount.`);
  } else if (['ww-lead', 'tz-lead', 'business-manager'].includes(role)) {
    headline = `Portfolio: CPE ${k.rollingCpe.toFixed(1)}, on-time ${k.onTimePct}%, net sentiment ${k.netSentiment}.`;
    bullets.push(`${k.deliveriesCompleted} deliveries completed this period.`);
    bullets.push(`${k.openEscalations} open escalations (${k.slaBreaches} breaching SLA).`);
    bullets.push(`Utilization ${k.utilization}% across active Partner CSAs.`);
  } else {
    headline = `${atRisk.length} engagements at risk, ${k.slaBreaches} escalations breaching SLA, CPE ${k.rollingCpe.toFixed(1)}.`;
    bullets.push(`Review ${atRisk.length} at-risk engagement(s) and confirm outreach cadence.`);
    bullets.push(`${breaches.length} escalation(s) past SLA — prioritise mitigation with SDMs.`);
    bullets.push(`${newDemand.length} new demand items awaiting best-fit dispatch.`);
    if (lowCpe.length) bullets.push(`${lowCpe.length} CPE responses below 3.6 — consider coaching follow-up.`);
  }

  if (k.slaBreaches > 0) anomalies.push(`${k.slaBreaches} escalation(s) breaching SLA.`);
  if (k.utilization > 90) anomalies.push(`Utilization ${k.utilization}% is above the 80–90% healthy band.`);
  if (atRisk.length > 6) anomalies.push(`${atRisk.length} engagements trending late.`);

  return {
    generatedAt: now(), headline, bullets, anomalies,
    sources: [
      ...atRisk.slice(0, 3).map((e) => ({ id: e.id, label: `${e.id} · ${e.customer}` })),
      ...breaches.slice(0, 2).map((e) => ({ id: e.id, label: `${e.id} · ${e.summary}` })),
    ],
  };
}

export function recommendCSA(engagement, d = store.data) {
  const candidates = d.csas
    .filter((c) => c.lifecycle === 'active' && c.tracks.includes(engagement.track))
    .map((c) => {
      const load = d.engagements.filter((e) => e.assignedTo === c.id && e.status !== 'complete').length;
      const headroom = Math.max(0, c.capacity - load);
      return { c, headroom, score: headroom * 2 + c.cpe + c.quality - c.utilization / 50 };
    })
    .sort((a, b) => b.score - a.score).slice(0, 3);
  const top = candidates[0];
  const text = top
    ? `Recommended: ${top.c.name} (${top.c.vendor}) for ${engagement.track}. Headroom ${top.headroom}/${top.c.capacity}, CPE ${top.c.cpe.toFixed(1)}, quality ${top.c.quality.toFixed(1)}, utilization ${top.c.utilization}%. Alternatives: ${candidates.slice(1).map((x) => x.c.name).join(', ') || 'none available'}.`
    : `No active CSA currently matches the ${engagement.track} family with headroom.`;
  return { text, sources: candidates.map((x) => ({ id: x.c.id, label: x.c.name })), generatedAt: now() };
}

export function mbrNarrative(partner, period, d = store.data) {
  const csaIds = d.csas.filter((c) => c.partnerId === partner.id).map((c) => c.id);
  const engs = d.engagements.filter((e) => e.assignedTo && csaIds.includes(e.assignedTo));
  const deliveries = d.deliveries.filter((dl) => engs.some((e) => e.id === dl.engagementId)).length;
  const escs = d.escalations.filter((e) => engs.some((x) => x.id === e.engagementId));
  const cpeItems = d.cpe.filter((c) => engs.some((e) => e.id === c.engagementId));
  const avgCpe = cpeItems.length ? (cpeItems.reduce((s, c) => s + c.score, 0) / cpeItems.length).toFixed(1) : partner.cpe.toFixed(1);
  const roll = d.sentiment.find((s) => s.scope === partner.name && s.period === period);
  const text =
    `Delivery Partner MBR — ${partner.name} — ${period}\n\n` +
    `Deliveries completed: ${deliveries}. Rolling CPE: ${avgCpe}. Open escalations: ${escs.filter((e) => e.status !== 'resolved').length} (${escs.filter((e) => e.severity === 'sev1' || e.severity === 'sev2').length} high severity).\n\n` +
    `Highlights: strong delivery across ${[...new Set(engs.map((e) => e.track))].slice(0, 3).join(', ') || 'multiple tracks'}; net sentiment ${roll ? roll.net : 'stable'}.\n\n` +
    `Risks: ${escs.length ? escs[0].summary.toLowerCase() : 'no material risks this period'}.\n\n` +
    `Next steps: sustain outreach cadence, close high-severity escalations within SLA, and maintain CPE above 4.4.`;
  return { text, sources: [{ id: partner.id, label: partner.name }], generatedAt: now() };
}

export function askData(question, d = store.data) {
  const k = computeKpis(d);
  const q = question.toLowerCase();
  if (/cpe/.test(q)) {
    const partner = d.partners.find((p) => q.includes(p.name.toLowerCase()));
    if (partner) {
      const trend = d.sentiment.filter((s) => s.scope === partner.name).map((s) => `${s.period}: net ${s.net}`).join(' → ');
      return { text: `${partner.name} sentiment trend — ${trend}. Rolling CPE ${partner.cpe.toFixed(1)}.`, sources: [{ id: partner.id, label: partner.name }], generatedAt: now() };
    }
    return { text: `Portfolio rolling CPE is ${k.rollingCpe.toFixed(1)} across ${d.cpe.length} responses.`, sources: [], generatedAt: now() };
  }
  if (/escalat/.test(q)) return { text: `${k.openEscalations} open escalations, ${k.slaBreaches} breaching SLA.`, sources: [], generatedAt: now() };
  if (/util/.test(q)) return { text: `Average Partner CSA utilization is ${k.utilization}% (healthy band 80–90%).`, sources: [], generatedAt: now() };
  if (/on.?time|deliver/.test(q)) return { text: `On-time delivery is ${k.onTimePct}%; ${k.deliveriesCompleted} deliveries completed.`, sources: [], generatedAt: now() };
  if (/sentiment/.test(q)) return { text: `Net sentiment is ${k.netSentiment} across channels this period.`, sources: [], generatedAt: now() };
  return { text: `I can answer from SSD IQ. Try: “CPE trend for Avanade”, “open escalations”, “utilization”, or “on-time delivery”. Snapshot — CPE ${k.rollingCpe.toFixed(1)}, on-time ${k.onTimePct}%, ${k.openEscalations} open escalations.`, sources: [], generatedAt: now() };
}

export function earlyWarnings(d = store.data) {
  const signals = d.sentimentSignals || [];
  const negative = signals.filter((signal) => signal.score <= -0.4);
  const themeCounts = negative.flatMap((signal) => signal.themes).reduce((acc, theme) => { acc[theme] = (acc[theme] || 0) + 1; return acc; }, {});
  const worstTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];
  const byEngagement = new Map();
  signals.forEach((signal) => {
    const items = byEngagement.get(signal.engagementId) || [];
    items.push(signal);
    byEngagement.set(signal.engagementId, items);
  });
  const rapidDeclines = [...byEngagement.values()].filter((items) => {
    const sorted = items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return sorted.length > 1 && sorted[0].score - sorted[1].score < -0.35;
  }).length;
  const critical = negative.filter((signal) => signal.score <= -0.75 && signal.alertStatus === 'open').length;
  const text = negative.length
    ? `Early warning: ${negative.length} negative/very-negative signals${worstTheme ? `, led by ${worstTheme[0]} (${worstTheme[1]})` : ''}. ${critical} critical alerts are open and ${rapidDeclines} engagements show a rapid decline.`
    : 'No negative sentiment concentrations detected in the selected scope.';
  return { text, sources: negative.slice(0, 3).map((signal) => ({ id: signal.id, label: signal.customer })), generatedAt: now() };
}

export function nlSearch(query, d = store.data) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = [];
  const m = (s) => s.toLowerCase().includes(q);
  d.partners.forEach((p) => m(`${p.id} ${p.name} ${p.region} ${p.type}`) && hits.push({ entity: 'Partner', key: 'partners', id: p.id, label: p.name, snippet: `${p.type} · ${p.region} · CPE ${p.cpe}` }));
  d.csas.forEach((c) => m(`${c.id} ${c.name} ${c.vendor} ${c.skills.join(' ')} ${c.tracks.join(' ')} ${(c.accreditations || []).join(' ')} ${(c.languages || []).join(' ')}`) && hits.push({ entity: 'CSA', key: 'csas', id: c.id, label: c.name, snippet: `${c.vendor} · ${c.tracks.join(', ')}` }));
  d.pods.forEach((p) => m(`${p.id} ${p.name} ${p.region} ${p.leadName}`) && hits.push({ entity: 'POD', key: 'pods', id: p.id, label: p.name, snippet: `${p.region} · lead ${p.leadName}` }));
  d.engagements.forEach((e) => m(`${e.id} ${e.customer} ${e.program} ${e.track} ${e.csamName}`) && hits.push({ entity: 'Engagement', key: 'engagements', id: e.id, label: e.customer, snippet: `${e.program} · ${e.status}` }));
  d.successStories.forEach((story) => {
    const engagement = d.engagements.find((item) => item.id === story.engagementId);
    const searchable = `${story.id} ${story.title} ${story.summary} ${story.keyOutcomes} ${story.insights} ${story.impact} ${story.ownerName} ${story.partnerName} ${story.eventNames.join(' ')} ${story.industry} ${story.segment} ${story.country} ${story.tags.join(' ')} ${engagement?.customer || ''}`;
    if (m(searchable)) hits.push({ entity: 'Success Story', key: 'successStories', id: story.id, label: story.title, snippet: `${engagement?.customer || story.engagementId} · ${story.status}${story.cpeId ? ' · VSAT' : ''}` });
  });
  d.financials.forEach((item) => m(`${item.id} ${item.period} ${item.scope} ${item.category} ${item.status}`) && hits.push({ entity: 'Financial', key: 'financials', id: item.id, label: `${item.scope} · ${item.category}`, snippet: `${item.period} · ${item.status}` }));
  d.initiatives.forEach((item) => m(`${item.id} ${item.name} ${item.type} ${item.area} ${item.stage} ${item.ownerName} ${item.status} ${item.impact} ${item.nextStep}`) && hits.push({ entity: 'Strategy / IP', key: 'initiatives', id: item.id, label: item.name, snippet: `${item.type} · ${item.stage} · ${item.status}` }));
  d.sentimentSignals.forEach((signal) => m(`${signal.id} ${signal.customer} ${signal.engagementId} ${signal.sourceId} ${signal.channel} ${signal.level} ${signal.language} ${signal.themes.join(' ')} ${signal.text}`) && hits.push({ entity: 'Sentiment Signal', key: 'sentimentSignals', id: signal.id, label: `${signal.customer} · ${signal.level}`, snippet: `${signal.channel} · ${signal.language} · ${signal.alertStatus}` }));
  d.escalations.forEach((e) => m(`${e.id} ${e.summary} ${e.adoRef} ${e.severity}`) && hits.push({ entity: 'Escalation', key: 'escalations', id: e.id, label: e.id, snippet: `${e.severity} · ${e.summary}` }));
  return hits.slice(0, 25);
}

export function dataQualityFlags(d = store.data) {
  const flags = [];
  d.engagements.filter((e) => e.status === 'in-delivery' && !e.assignedTo).forEach((e) => flags.push({ severity: 'high', message: `Engagement ${e.id} is in-delivery with no assigned CSA.`, ref: e.id }));
  d.escalations.filter((e) => e.status !== 'resolved' && hoursSince(e.opened) > e.slaHours).forEach((e) => flags.push({ severity: 'high', message: `Escalation ${e.id} is past its ${e.slaHours}h SLA.`, ref: e.id }));
  d.csas.filter((c) => c.lifecycle === 'active' && c.utilization > 95).forEach((c) => flags.push({ severity: 'medium', message: `${c.name} is over-utilized at ${c.utilization}%.`, ref: c.id }));
  d.successStories.filter((story) => story.status === 'published' && (!story.publishDate || !story.customerQuote)).forEach((story) => flags.push({ severity: 'medium', message: `Published success story ${story.id} is missing publication evidence.`, ref: story.id }));
  const uncoveredVsats = d.cpe.filter((item) => item.class === 'VSAT' && !d.successStories.some((story) => story.cpeId === item.id || story.engagementIds.includes(item.engagementId)));
  if (uncoveredVsats.length) flags.push({ severity: 'medium', message: `${uncoveredVsats.length} VSAT engagements have no linked success story.`, ref: uncoveredVsats[0].id });
  d.financials.filter((item) => item.status === 'over-plan').forEach((item) => flags.push({ severity: 'medium', message: `${item.scope} ${item.category} is over plan for ${item.period}.`, ref: item.id }));
  d.initiatives.filter((item) => item.status === 'watch').forEach((item) => flags.push({ severity: 'low', message: `Initiative ${item.name} is on watch (${item.targetRelease}).`, ref: item.id }));
  const criticalSentiment = d.sentimentSignals.filter((signal) => signal.score <= -0.75 && signal.alertStatus === 'open');
  if (criticalSentiment.length) flags.push({ severity: 'high', message: `${criticalSentiment.length} very-negative sentiment alerts require acknowledgement.`, ref: criticalSentiment[0].id });
  d.partners.filter((p) => p.podIds.length === 0).forEach((p) => flags.push({ severity: 'low', message: `Partner ${p.name} has no PODs mapped.`, ref: p.id }));
  return flags;
}

export function ask(prompt, role, d = store.data) {
  if (/brief|today|summary/i.test(prompt)) {
    const b = dailyBriefing(role, d);
    return { text: `${b.headline}\n\n• ${b.bullets.join('\n• ')}`, sources: b.sources, generatedAt: now() };
  }
  return askData(prompt, d);
}

// ---- Dispatch / messages / quality / escalations / performance ----
export function draftOutreach(engagement, d = store.data) {
  const csa = d.csas.find((c) => c.id === engagement.assignedTo);
  const text = `Subject: ${engagement.program} — kicking off with ${engagement.customer}\n\n` +
    `Hi ${engagement.csamName.split(' ')[0]},\n\n` +
    `I'm ${csa ? csa.name : 'your assigned Partner CSA'} and I'll be delivering the ${engagement.program} ` +
    `(${engagement.track}) engagement for ${engagement.customer}. I'd like to schedule a short Day 1 sync to align on scope, ` +
    `stakeholders and success criteria. Could you share two windows this week?\n\n` +
    `I'll follow the Day 0–3 outreach cadence and keep you updated in the messages console.\n\nBest regards,\n${csa ? csa.name : ''}`;
  return { text, sources: [{ id: engagement.id, label: engagement.customer }], generatedAt: now() };
}
export function suggestReply(lastBody) {
  const text = /blocker|escalation|permission/i.test(lastBody || '')
    ? 'Thanks for the heads-up. Please raise the escalation with a severity and I’ll pull in the SDM. Share the blocking detail and any customer impact.'
    : 'Thanks for the update — that looks on track. Please confirm the next milestone date and flag anything you need from me.';
  return { text, sources: [], generatedAt: now() };
}
export function toneCheck(text) {
  const harsh = /(asap|immediately|unacceptable|failed|must)/i.test(text || '');
  return { text: harsh ? 'Tone: firm/urgent. Consider softening to keep the partner relationship collaborative — e.g. replace “must” with “could you”.' : 'Tone: professional and collaborative. Reads well for a partner-respectful message.', sources: [], generatedAt: now() };
}
export function summarizeThread(msgs) {
  const neg = msgs.filter((m) => m.sentiment === 'negative').length;
  return { text: `Thread summary: ${msgs.length} messages. ${neg ? `${neg} carry negative sentiment — watch for a brewing issue.` : 'Sentiment is neutral-to-positive.'} Latest: “${msgs[msgs.length - 1] ? msgs[msgs.length - 1].body : ''}”`, sources: [], generatedAt: now() };
}
export function scoreQuality(engagement) {
  const outreach = Object.values(engagement.outreach).filter(Boolean).length;
  const done = engagement.milestones.filter((m) => m.done).length;
  const score = Math.min(5, Math.round((2.6 + outreach * 0.35 + (done / Math.max(1, engagement.milestones.length)) * 1.2) * 10) / 10);
  return { score, text: `Auto-score ${score}/5 against the Proactive Delivery CPE Recommended Practices. Outreach ${outreach}/4, milestones ${done}/${engagement.milestones.length}. ${score < 4 ? 'Improve: close outstanding outreach and evidence milestone completion.' : 'Strong: maintain cadence and capture artifacts for the CPE survey.'}`, sources: [{ id: engagement.id, label: engagement.customer }], generatedAt: now() };
}
export function classifySeverity(notes) {
  const sev = /(down|breach|security|data loss|outage)/i.test(notes || '') ? 'sev1' : /(blocker|at risk|milestone)/i.test(notes || '') ? 'sev2' : /(delay|scheduling)/i.test(notes || '') ? 'sev3' : 'sev4';
  return { severity: sev, text: `Suggested severity: ${sev.toUpperCase()} based on the described impact.`, sources: [], generatedAt: now() };
}
export function similarCases(escId, d = store.data) {
  const esc = d.escalations.find((e) => e.id === escId);
  const similar = d.escalations.filter((e) => e.id !== escId && e.summary === (esc && esc.summary)).slice(0, 3);
  return { text: similar.length ? `Found ${similar.length} similar past escalation(s) with the same signature; prior resolutions averaged mitigation within SLA.` : 'No closely matching past escalations found.', sources: similar.map((e) => ({ id: e.id, label: `${e.id} · ${e.summary}` })), generatedAt: now() };
}
export function extractActions(notes) {
  const out = [];
  if (/stakeholder|sync|meeting/i.test(notes || '')) out.push('Schedule stakeholder sync');
  if (/access|permission/i.test(notes || '')) out.push('Escalate access request to IT');
  if (/milestone|plan|baseline/i.test(notes || '')) out.push('Re-baseline the milestone plan');
  if (/comm|customer|update/i.test(notes || '')) out.push('Draft customer communication');
  return out.length ? out : ['Prepare mitigation options'];
}
export function draftResolution(escId, d = store.data) {
  const esc = d.escalations.find((e) => e.id === escId);
  const eng = d.engagements.find((e) => e.id === (esc && esc.engagementId));
  return { text: esc ? `Resolution summary: the ${esc.severity.toUpperCase()} issue on ${eng ? eng.customer : 'the engagement'} ("${esc.summary}") was mitigated through the tracked action items with the SDM (${esc.sdmName}). Root cause addressed; monitoring for recurrence.` : 'Escalation not found.', sources: esc ? [{ id: esc.id, label: esc.adoRef }] : [], generatedAt: now() };
}
export function performanceSummary(csa, d = store.data) {
  const mine = d.engagements.filter((e) => e.assignedTo === csa.id);
  const complete = mine.filter((e) => e.status === 'complete').length;
  const escs = d.escalations.filter((e) => mine.some((m) => m.id === e.engagementId)).length;
  return { text: `Advisory summary for ${csa.name} (${csa.vendor}). Delivery: ${complete} completed of ${mine.length} assigned. CPE ${csa.cpe.toFixed(1)}, quality ${csa.quality.toFixed(1)}, utilization ${csa.utilization}%, ${escs} linked escalation(s). Sentiment ${csa.sentiment}. This is an advisory input for the POD Lead — not an automated decision.`, sources: mine.slice(0, 4).map((e) => ({ id: e.id, label: e.customer })), generatedAt: now() };
}
export function suggestPipObjectives(csa, d = store.data) {
  const mine = d.engagements.filter((e) => e.assignedTo === csa.id);
  const escs = d.escalations.filter((e) => mine.some((m) => m.id === e.engagementId));
  const pod = d.pods.find((p) => p.id === csa.podId);
  const objectives = [];
  if (csa.quality < 4.2) objectives.push({ label: `Quality check focus: ${QC_CRITERIA[0]} (currently ${csa.quality.toFixed(1)}).`, category: 'delivery-skills', kind: 'quality-check' });
  if (csa.cpe < 4.4) objectives.push({ label: `Raise rolling CPE to 4.4+ within two review periods (currently ${csa.cpe.toFixed(1)}).`, category: 'delivery-skills', kind: 'objective' });
  if (escs.length > 2) objectives.push({ label: `Develop soft skill: stakeholder communication & expectation management (${escs.length} linked escalation(s)).`, category: 'soft-skills', kind: 'objective' });
  const trackPrograms = csa.tracks.flatMap((t) => PROGRAMS[t] || []);
  const missingProgram = trackPrograms.find((p) => !(csa.accreditations || []).includes(p));
  if (missingProgram) objectives.push({ label: `Complete ${missingProgram} training and accreditation.`, category: 'technical-skills', kind: 'training' });
  const tzLangs = (pod && TZ_LANGUAGES[pod.tz]) || [];
  const missingLang = tzLangs.find((l) => !(csa.languages || []).includes(l));
  if (missingLang && (csa.languages || []).length < 2) objectives.push({ label: `Build language proficiency: ${missingLang}.`, category: 'language-proficiency', kind: 'objective' });
  if (csa.utilization < 80) objectives.push({ label: `Increase utilization toward the capacity target (currently ${csa.utilization}%).`, category: 'delivery-skills', kind: 'objective' });
  if (!objectives.length) objectives.push({ label: 'Sustain current delivery cadence and document wins for the next review.', category: 'delivery-skills', kind: 'objective' });
  return {
    text: `Suggested starting objectives for ${csa.name}, drawn from delivery evidence across quality checks, technical/soft skills, language proficiency and certifications. The POD Lead selects, edits and finalizes what goes into the plan — this is advisory only.`,
    objectives: objectives.slice(0, 4),
    sources: mine.slice(0, 4).map((e) => ({ id: e.id, label: e.customer })),
    generatedAt: now(),
  };
}

// ---- Executive summary (Reporting → Executive View) ----
export function execSummary(d = store.data) {
  const k = computeKpis(d);
  const byTrack = {};
  d.deliveries.forEach((dl) => { byTrack[dl.track] = (byTrack[dl.track] || 0) + 1; });
  const topTrack = Object.entries(byTrack).sort((a, b) => b[1] - a[1])[0];
  const text =
    `Success Programs delivery is tracking at CPE ${k.rollingCpe.toFixed(1)} (target ≥ 4.4) and on-time ${k.onTimePct}%, ` +
    `with ${k.deliveriesCompleted} deliveries completed and ${k.activeEngagements} active engagements. ` +
    `${topTrack ? `${topTrack[0]} leads delivery volume (${topTrack[1]}). ` : ''}` +
    `${k.openEscalations} escalations open (${k.slaBreaches} breaching SLA); utilization ${k.utilization}% and net sentiment ${k.netSentiment > 0 ? '+' + k.netSentiment : k.netSentiment}. ` +
    `${k.slaBreaches > 0 ? 'Priority: clear SLA-breaching escalations and protect at-risk engagements.' : 'Operations are within healthy bands.'}`;
  return { text, sources: [], generatedAt: now() };
}

// ---- POD performance summary (Reporting → POD Performance) ----
export function podPerformanceSummary(d = store.data) {
  const perf = computePodPerformance(d);
  const ranked = [...perf].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const needsAttention = ranked.filter((p) => p.tier === 'Needs attention');
  const avgScore = ranked.length ? Math.round(ranked.reduce((s, p) => s + p.score, 0) / ranked.length) : 0;
  const text =
    `Across ${ranked.length} PODs, composite performance averages ${avgScore}/100 (blending CPE, quality, utilization, escalations and sentiment). ` +
    `${top ? `${top.name} leads at ${top.score}/100 (CPE ${top.avgCpe.toFixed(1)}, utilization ${top.util}%). ` : ''}` +
    `${needsAttention.length ? `${needsAttention.length} POD(s) need attention: ${needsAttention.map((p) => p.name).join(', ')}.` : 'No PODs are currently flagged as needing attention.'} ` +
    `This is an advisory read — POD Leads and the CSA Manager should validate before acting.`;
  return { text, sources: ranked.slice(0, 5).map((p) => ({ id: p.id, label: p.name })), generatedAt: now() };
}

// ---- IP Feedback summary (Reporting → IP Feedback) ----
export function ipFeedbackSummary(d = store.data) {
  const stats = ipKitStats(d);
  const rated = stats.filter((s) => s.avgRating != null);
  const ranked = [...rated].sort((a, b) => b.avgRating - a.avgRating);
  const top = ranked[0];
  const needsAttention = stats.filter((s) => s.needsAttention > 0).sort((a, b) => b.needsAttention - a.needsAttention);
  const totalFeedback = stats.reduce((s, a) => s + a.feedbackCount, 0);
  const avgRating = rated.length ? Math.round((rated.reduce((s, a) => s + a.avgRating, 0) / rated.length) * 10) / 10 : 0;
  const text =
    `${totalFeedback} feedback submission(s) across ${stats.length} IP Kits (one per engagement Program), averaging ${avgRating.toFixed(1)}/5. ` +
    `${top ? `${top.name} is the highest-rated (${top.avgRating.toFixed(1)}/5, ${top.feedbackCount} submissions). ` : ''}` +
    `${needsAttention.length ? `Prioritize a refresh for: ${needsAttention.map((s) => `${s.name} (${s.needsAttention} flagged)`).join(', ')}.` : 'No Kits are currently flagged for a refresh.'} ` +
    `This is advisory — the IP Lead should confirm before retiring or updating a Kit.`;
  return { text, sources: stats.filter((s) => s.feedbackCount).map((s) => ({ id: s.id, label: s.name })), generatedAt: now() };
}

// ---- Attrition summary (Capacity & Forecasting → Attrition Analysis) ----
export function attritionSummary(d = store.data) {
  const events = d.attrition;
  const activeCsas = d.csas.filter((c) => c.lifecycle === 'active').length;
  const rate = activeCsas ? Math.round((events.length / (activeCsas + events.length)) * 1000) / 10 : 0;
  const voluntary = events.filter((a) => a.exitType === 'Voluntary').length;
  const voluntaryPct = events.length ? Math.round((voluntary / events.length) * 100) : 0;
  const regretted = events.filter((a) => a.regretted);
  const byFamily = {};
  events.forEach((a) => { byFamily[a.family] = (byFamily[a.family] || 0) + 1; });
  const topFamily = Object.entries(byFamily).sort((a, b) => b[1] - a[1])[0];
  const backfilled = events.filter((a) => a.backfillReqId).length;
  const text =
    `${events.length} exits in the trailing 12 months (${rate}% attrition rate), ${voluntaryPct}% voluntary. ` +
    `${regretted.length ? `${regretted.length} were regrettable (high CPE/quality performers leaving) — worth a retention review. ` : 'No regrettable exits flagged in this window. '}` +
    `${topFamily ? `${topFamily[0]} has the most exits (${topFamily[1]}). ` : ''}` +
    `${backfilled} of ${events.length} exits already have a matched backfill requisition in progress. ` +
    `This is advisory — POD Leads and Operations should validate before acting on retention or backfill priorities.`;
  return { text, sources: regretted.slice(0, 5).map((a) => ({ id: a.id, label: a.name })), generatedAt: now() };
}

// ---- Capacity Trajectory Simulator summary (Capacity & Forecasting → Trajectory Simulator) ----
// Takes the already-computed forecast (computeCapacityForecast) since it depends on user-adjustable
// utilization / onboarding / trajectory inputs — this narrates that specific scenario, not a recompute.
export function capacityForecastSummary(forecast) {
  const breaching = forecast.families.filter((f) => f.breach).sort((a, b) => a.breach.monthKey.localeCompare(b.breach.monthKey));
  const soonest = breaching[0];
  const text =
    `Scenario: ${forecast.utilizationTarget}% expected utilization (effective capacity ${forecast.effectiveCapPerCsa.toFixed(1)} engagements/CSA) ` +
    `and a ${forecast.onboardingMonths}-month onboarding lead time. ` +
    `${soonest
      ? `${soonest.track} is the first Family to go under capacity, in ${soonest.breach.label} (${soonest.breach.quarter}) — a gap of ${soonest.breach.gap}. ` +
        `${soonest.hireByMonth.overdue ? `You are already past the hire-by date (${soonest.hireByMonth.label}) — start hiring now. ` : `Start hiring by ${soonest.hireByMonth.label} to land in time. `}` +
        `${breaching.length > 1 ? `${breaching.length - 1} other Family/Families also go under capacity within the horizon: ${breaching.slice(1).map((f) => `${f.track} (${f.breach.label})`).join(', ')}. ` : ''}`
      : 'No Family is projected to go under capacity within the horizon at this trajectory and utilization. '}` +
    `This is a simulated projection from a detected 3-month demand trend — validate before opening requisitions.`;
  return { text, sources: breaching.slice(0, 5).map((f) => ({ id: f.track, label: f.track })), generatedAt: now() };
}

// ---- Partner performance summary (Delivery Partners / Reporting → Partner Performance) ----
export function partnerPerformanceSummary(d = store.data) {
  const perf = computePartnerPerformance(d);
  const ranked = [...perf].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const needsAttention = ranked.filter((p) => p.tier === 'Needs attention');
  const avgScore = ranked.length ? Math.round(ranked.reduce((s, p) => s + p.score, 0) / ranked.length) : 0;
  const totalFlags = perf.reduce((s, p) => s + p.s500Flags, 0);
  const text =
    `Across ${ranked.length} Delivery Partners, composite performance averages ${avgScore}/100 (blending CPE, quality, utilization, escalations and sentiment). ` +
    `${top ? `${top.name} leads at ${top.score}/100 (CPE ${top.avgCpe.toFixed(1)}, S500-ready ${top.s500ReadyPct}%). ` : ''}` +
    `${needsAttention.length ? `${needsAttention.length} partner(s) need attention: ${needsAttention.map((p) => p.name).join(', ')}. ` : 'No partners are currently flagged as needing attention. '}` +
    `${totalFlags ? `${totalFlags} S500 customer engagement(s) are served by a non-ready CSA — a governance flag to close (target: 0).` : 'No S500 customers are served by a non-ready CSA.'} ` +
    `This is an advisory read — Operations and DPSMs should validate before acting.`;
  return { text, sources: ranked.slice(0, 5).map((p) => ({ id: p.id, label: p.name })), generatedAt: now() };
}

// ---- Agentic Delivery: AI-generated deliverable ----
export function generateDeliverable(engagement, d = store.data) {
  const csa = d.csas.find((c) => c.id === engagement.assignedTo);
  const text =
    `Deliverable — ${engagement.program} · ${engagement.customer}\n\n` +
    `1. Executive summary\n   ${engagement.customer} engaged on the ${engagement.track} track (${engagement.program}). Current status: ${engagement.status}.\n\n` +
    `2. Scope & success criteria\n   Aligned to Success Program outcomes and confirmed with ${engagement.csamName}.\n\n` +
    `3. Findings & recommendations\n   - Prioritised actions across ${engagement.track}.\n   - CPE Recommended Practices applied throughout delivery.\n   - Key risks identified and mitigated.\n\n` +
    `4. Next steps & owners\n   - ${csa ? csa.name : 'Assigned CSA'} to drive follow-up items to closure.\n   - Review at the next milestone (${engagement.dueDate}).\n\n` +
    `Generated by the Compass Delivery Agent from SSD IQ — review before sending.`;
  return { text, sources: [{ id: engagement.id, label: engagement.customer }], generatedAt: now() };
}
