// Native SSD MBR scorecard inspired by the governed Power BI operating model.
import { store, hoursSince } from '../store.js';
import {
  kpiCard, badge, aiChip, esc, clearCharts, bar, donut, line, meter, COLORS, scoreColor, utilColor,
} from '../components.js';
import { icon } from '../icons.js';
import { scoreQuality } from '../ai.js';
import { TRACKS, TZ_MAP } from '../../data/generate.js';
import { navigate } from '../router.js';

const NOW = Date.parse('2026-07-28T09:00:00Z');
const QC_CRITERIA = [
  ['Communication was clear', (engagement) => engagement.outreach.day1],
  ['Roles and expectations aligned', (engagement) => engagement.milestones.length > 0],
  ['Customer was engaged by DP', (engagement) => engagement.outreach.day2],
  ['Presenter was prepared', (engagement) => engagement.outreach.day0],
  ['Customer confident in ownership', (engagement) => engagement.milestones.some((milestone) => milestone.done)],
  ['Handover process was clear', (engagement) => engagement.status === 'complete'],
  ['Agenda was clear', (engagement) => engagement.outreach.day1],
  ['Action items assigned', (engagement) => store.data.actions.some((action) => action.engagementId === engagement.id)],
];
const SECTION_TABS = [
  ['overview', 'Health scorecard'],
  ['execution', 'Execution'],
  ['readiness', 'Readiness'],
  ['quality', 'Quality'],
  ['financials', 'Financials'],
  ['strategy', 'Strategy & actions'],
];

let section = 'overview';
let selectedPeriod = '2026-07';
let selectedTz = 'All';
let selectedPartner = 'All';
let financialScope = 'Success Programs';

const pct = (value, total) => (total ? Math.round((value / total) * 1000) / 10 : 0);
const money = (value) => `${value < 0 ? '-' : ''}$${Math.abs(Math.round(value)).toLocaleString('en-US')}`;
const changePct = (current, previous) => (previous ? Math.round(((current - previous) / previous) * 1000) / 10 : null);
const periodLabel = (period) => new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const daysOverdue = (date) => Math.max(0, Math.floor((NOW - Date.parse(`${date}T00:00:00Z`)) / 864e5));

function metaOf(engagement) {
  const d = store.data;
  const csa = d.csas.find((item) => item.id === engagement.assignedTo);
  const pod = csa ? d.pods.find((item) => item.id === csa.podId) : null;
  return { csa, pod, tz: pod?.tz || 'Unassigned', partnerId: csa?.partnerId || null };
}

function availablePeriods() {
  return [...new Set([
    ...store.data.deliveries.map((item) => item.completedDate.slice(0, 7)),
    ...store.data.cpe.map((item) => item.date.slice(0, 7)),
    ...store.data.financials.map((item) => item.period),
  ])].filter(Boolean).sort();
}

function scopedEngagements() {
  return store.data.engagements.filter((engagement) => {
    const meta = metaOf(engagement);
    return (selectedTz === 'All' || meta.tz === selectedTz)
      && (selectedPartner === 'All' || meta.partnerId === selectedPartner);
  });
}

function context() {
  const d = store.data;
  const periods = availablePeriods();
  if (!periods.includes(selectedPeriod)) selectedPeriod = periods[periods.length - 1];
  const previousPeriod = periods[periods.indexOf(selectedPeriod) - 1] || null;
  const engagements = scopedEngagements();
  const engagementIds = new Set(engagements.map((item) => item.id));
  const currentDeliveries = d.deliveries.filter((item) => engagementIds.has(item.engagementId) && item.completedDate.startsWith(selectedPeriod));
  const previousDeliveries = d.deliveries.filter((item) => engagementIds.has(item.engagementId) && previousPeriod && item.completedDate.startsWith(previousPeriod));
  const currentCpe = d.cpe.filter((item) => engagementIds.has(item.engagementId) && item.date.startsWith(selectedPeriod));
  const previousCpe = d.cpe.filter((item) => engagementIds.has(item.engagementId) && previousPeriod && item.date.startsWith(previousPeriod));
  const activeCsas = d.csas.filter((csa) => {
    if (csa.lifecycle !== 'active') return false;
    const pod = d.pods.find((item) => item.id === csa.podId);
    return (selectedTz === 'All' || pod?.tz === selectedTz)
      && (selectedPartner === 'All' || csa.partnerId === selectedPartner);
  });
  const pending = engagements.filter((item) => item.status !== 'complete' && Date.parse(`${item.dueDate}T00:00:00Z`) < NOW);
  const openEscalations = d.escalations.filter((item) => engagementIds.has(item.engagementId) && item.status !== 'resolved');
  const hiring = d.hiring.filter((item) => {
    const pod = d.pods.find((candidate) => candidate.id === item.podId);
    return item.stage !== 'Hired' && (selectedTz === 'All' || pod?.tz === selectedTz)
      && (selectedPartner === 'All' || item.partnerId === selectedPartner);
  });
  const qualityEngagements = engagements.filter((item) => item.status === 'complete');
  const qcs = qualityEngagements.map((engagement) => ({ engagement, score: scoreQuality(engagement).score }));
  const avgQc = qcs.length ? Math.round((qcs.reduce((sum, item) => sum + item.score, 0) / qcs.length) * 10) / 10 : 0;
  const avgCpe = currentCpe.length ? Math.round((currentCpe.reduce((sum, item) => sum + item.score, 0) / currentCpe.length) * 100) / 100 : 0;
  const vsatRate = pct(currentCpe.filter((item) => item.class === 'VSAT').length, currentCpe.length);
  const dsatRate = pct(currentCpe.filter((item) => item.class === 'DSAT').length, currentCpe.length);
  const accreditationCount = activeCsas.reduce((sum, csa) => sum + csa.accreditations.length, 0);
  const accreditedRate = pct(activeCsas.filter((csa) => csa.accreditations.length).length, activeCsas.length);
  const utilization = activeCsas.length ? Math.round(activeCsas.reduce((sum, csa) => sum + csa.utilization, 0) / activeCsas.length) : 0;
  const financials = d.financials.filter((item) => item.period === selectedPeriod && item.scope === financialScope);
  const totalBudget = financials.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = financials.reduce((sum, item) => sum + item.actual, 0);
  const budgetVariancePct = totalBudget ? Math.round(((totalActual - totalBudget) / totalBudget) * 1000) / 10 : 0;
  const deliveryChange = changePct(currentDeliveries.length, previousDeliveries.length);
  return {
    d, periods, previousPeriod, engagements, engagementIds, currentDeliveries, previousDeliveries,
    currentCpe, previousCpe, activeCsas, pending, openEscalations, hiring, qcs, avgQc, avgCpe,
    vsatRate, dsatRate, accreditationCount, accreditedRate, utilization, financials,
    totalBudget, totalActual, budgetVariancePct, deliveryChange,
  };
}

function rag(label, level, detail) {
  const color = level === 'green' ? COLORS.positive : level === 'amber' ? COLORS.warning : COLORS.negative;
  return { label, level, detail, color };
}

function health(contextValue) {
  const c = contextValue;
  const execution = c.pending.length > 10 || (c.deliveryChange != null && c.deliveryChange < -10)
    ? rag('Execution', 'red', `${c.pending.length} pending; ${trendText(c.deliveryChange)}`)
    : c.pending.length > 4 || (c.deliveryChange != null && c.deliveryChange < 0)
      ? rag('Execution', 'amber', `${c.pending.length} pending; ${trendText(c.deliveryChange)}`)
      : rag('Execution', 'green', `${c.currentDeliveries.length} completed; ${trendText(c.deliveryChange)}`);
  const readiness = c.accreditedRate < 80 || c.utilization > 95
    ? rag('Readiness', 'red', `${c.accreditedRate}% accredited; ${c.utilization}% util.`)
    : c.accreditedRate < 95 || c.utilization < 75 || c.utilization > 92
      ? rag('Readiness', 'amber', `${c.accreditedRate}% accredited; ${c.hiring.length} open roles`)
      : rag('Readiness', 'green', `${c.accreditedRate}% accredited; utilization in band`);
  const quality = c.vsatRate < 65 || c.dsatRate > 10 || c.avgCpe < 4
    ? rag('Quality', 'red', `VSAT ${c.vsatRate}%; DSAT ${c.dsatRate}%; CPE ${c.avgCpe.toFixed(2)}`)
    : c.vsatRate < 75 || c.dsatRate > 5 || c.avgCpe < 4.4
      ? rag('Quality', 'amber', `VSAT ${c.vsatRate}%; DSAT ${c.dsatRate}%; CPE ${c.avgCpe.toFixed(2)}`)
      : rag('Quality', 'green', `VSAT ${c.vsatRate}%; DSAT ${c.dsatRate}%; CPE ${c.avgCpe.toFixed(2)}`);
  const absoluteVariance = Math.abs(c.budgetVariancePct);
  const budget = absoluteVariance > 8 ? rag('Budget', 'red', `${signed(c.budgetVariancePct)} variance`)
    : absoluteVariance > 2 ? rag('Budget', 'amber', `${signed(c.budgetVariancePct)} variance`)
      : rag('Budget', 'green', `${signed(c.budgetVariancePct)} variance`);
  const pillars = [execution, readiness, quality, budget];
  const overallLevel = pillars.some((item) => item.level === 'red') ? 'red' : pillars.some((item) => item.level === 'amber') ? 'amber' : 'green';
  return [...pillars, rag('Overall', overallLevel, overallLevel === 'green' ? 'All pillars within target.' : 'Leadership attention required.')];
}

function trendText(value) {
  if (value == null) return 'no prior-period baseline';
  return `${value >= 0 ? '+' : ''}${value}% MoM`;
}
function signed(value) { return `${value >= 0 ? '+' : ''}${value}%`; }

export function renderMbrScorecard(container) {
  clearCharts();
  const c = context();
  const partners = c.d.partners;
  const tabs = SECTION_TABS.map(([key, label]) => `<button class="tab ${section === key ? 'active' : ''}" data-mbr-section="${key}">${label}</button>`).join('');
  container.innerHTML = `
    <div class="mbr-source-bar">
      <div><strong>SSD Monthly Business Review</strong><span>${periodLabel(selectedPeriod)} · governed SSD IQ measures · Power BI-aligned model</span></div>
      <div class="row wrap">
        <select class="select" id="mbr-period">${c.periods.map((period) => `<option value="${period}" ${period === selectedPeriod ? 'selected' : ''}>${periodLabel(period)}</option>`).join('')}</select>
        <select class="select" id="mbr-tz"><option value="All">All time zones</option>${Object.keys(TZ_MAP).map((tz) => `<option value="${tz}" ${tz === selectedTz ? 'selected' : ''}>${tz}</option>`).join('')}</select>
        <select class="select" id="mbr-partner"><option value="All">All partners</option>${partners.map((partner) => `<option value="${partner.id}" ${partner.id === selectedPartner ? 'selected' : ''}>${esc(partner.name)}</option>`).join('')}</select>
        <select class="select" id="mbr-fin-scope"><option ${financialScope === 'Success Programs' ? 'selected' : ''}>Success Programs</option><option ${financialScope === 'Success Services' ? 'selected' : ''}>Success Services</option></select>
        <button class="btn" id="mbr-print">${icon('report', 15)} Print / PDF</button>
      </div>
    </div>
    <div class="tabs mbr-section-tabs">${tabs}</div>
    <div id="mbr-section"></div>`;
  const sectionHost = container.querySelector('#mbr-section');
  if (section === 'overview') renderOverview(sectionHost, c);
  else if (section === 'execution') renderExecution(sectionHost, c);
  else if (section === 'readiness') renderReadiness(sectionHost, c);
  else if (section === 'quality') renderQuality(sectionHost, c);
  else if (section === 'financials') renderFinancials(sectionHost, c);
  else renderStrategy(sectionHost, c);

  container.querySelectorAll('[data-mbr-section]').forEach((button) => button.addEventListener('click', () => {
    section = button.getAttribute('data-mbr-section');
    renderMbrScorecard(container);
  }));
  container.querySelector('#mbr-period').addEventListener('change', (event) => { selectedPeriod = event.target.value; renderMbrScorecard(container); });
  container.querySelector('#mbr-tz').addEventListener('change', (event) => { selectedTz = event.target.value; renderMbrScorecard(container); });
  container.querySelector('#mbr-partner').addEventListener('change', (event) => { selectedPartner = event.target.value; renderMbrScorecard(container); });
  container.querySelector('#mbr-fin-scope').addEventListener('change', (event) => { financialScope = event.target.value; renderMbrScorecard(container); });
  container.querySelector('#mbr-print').addEventListener('click', () => window.print());
  container.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => navigate(button.getAttribute('data-nav'))));
}

function renderOverview(host, c) {
  const statuses = health(c);
  const activePartners = new Set(c.activeCsas.map((item) => item.partnerId)).size;
  const insights = [
    c.deliveryChange == null ? `${c.currentDeliveries.length} deliveries completed in the selected period.` : `Delivery volume is ${trendText(c.deliveryChange)} with ${c.currentDeliveries.length} completed.`,
    c.vsatRate >= 75 ? `VSAT is above the 75% leadership target at ${c.vsatRate}%.` : `VSAT is ${c.vsatRate}% and needs a recovery plan toward the 75% target.`,
    c.pending.length ? `${c.pending.length} reports are pending; ${c.pending.filter((item) => daysOverdue(item.dueDate) > 14).length} are over 14 days old.` : 'No reports are pending in the selected scope.',
  ];
  host.innerHTML = `
    <div class="row wrap mb8" style="justify-content:space-between"><div><strong class="mbr-section-title">Executive Summary & SSD Scorecard</strong><div class="muted">Execution, readiness, quality, budget, and overall health.</div></div>${aiChip('Data-driven insights')}</div>
    <div class="mbr-rag-grid">${statuses.map((status) => `<div class="mbr-rag-card" style="border-top-color:${status.color}"><span class="mbr-rag-dot" style="background:${status.color}"></span><strong>${status.label}</strong><span style="color:${status.color};font-weight:700">${status.level.toUpperCase()}</span><small>${esc(status.detail)}</small></div>`).join('')}</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Active delivery partners', value: activePartners, iconName: 'building', hint: `${c.activeCsas.length} active resources` })}
      ${kpiCard({ label: 'CPE / VSAT', value: `${c.avgCpe.toFixed(2)} / ${c.vsatRate}%`, iconName: 'star', tone: scoreColor(c.avgCpe), hint: `${c.currentCpe.length} responses` })}
      ${kpiCard({ label: 'Accreditations', value: c.accreditationCount, iconName: 'flag', hint: `${c.accreditedRate}% of active resources accredited` })}
      ${kpiCard({ label: 'Quality checks', value: c.qcs.length, iconName: 'check', hint: `Avg ${c.avgQc.toFixed(1)} / 5` })}
    </div>
    <div class="two-col">
      <div class="card pad"><div class="row mb8">${icon('sparkle', 16)}<strong>Key leadership insights</strong>${aiChip()}</div><ul class="brief-bullets">${insights.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>
      <div class="card pad"><strong>Leadership attention</strong>
        <div class="attn-row"><span class="dot" style="background:${c.pending.length ? COLORS.warning : COLORS.positive}"></span><div class="attn-main"><div class="attn-title">${c.pending.length} reports pending</div><div class="attn-meta">Oldest ${Math.max(0, ...c.pending.map((item) => daysOverdue(item.dueDate)))} days</div></div><button class="btn sm" data-nav="/reports-pending">Open</button></div>
        <div class="attn-row"><span class="dot" style="background:${c.dsatRate > 5 ? COLORS.negative : COLORS.positive}"></span><div class="attn-main"><div class="attn-title">DSAT ${c.dsatRate}%</div><div class="attn-meta">${c.currentCpe.filter((item) => item.class === 'DSAT').length} current-period responses</div></div><button class="btn sm" data-mbr-section="quality">Review</button></div>
        <div class="attn-row"><span class="dot" style="background:${Math.abs(c.budgetVariancePct) > 5 ? COLORS.warning : COLORS.positive}"></span><div class="attn-main"><div class="attn-title">Budget variance ${signed(c.budgetVariancePct)}</div><div class="attn-meta">${financialScope}</div></div><button class="btn sm" data-mbr-section="financials">Review</button></div>
      </div>
    </div>`;
}

function renderExecution(host, c) {
  const currentByTrack = TRACKS.map((track) => c.currentDeliveries.filter((item) => item.track === track).length);
  const previousByTrack = TRACKS.map((track) => c.previousDeliveries.filter((item) => item.track === track).length);
  const tzs = Object.keys(TZ_MAP);
  const currentByTz = tzs.map((tz) => c.currentDeliveries.filter((delivery) => {
    const engagement = c.d.engagements.find((item) => item.id === delivery.engagementId);
    return engagement && metaOf(engagement).tz === tz;
  }).length);
  const previousByTz = tzs.map((tz) => c.previousDeliveries.filter((delivery) => {
    const engagement = c.d.engagements.find((item) => item.id === delivery.engagementId);
    return engagement && metaOf(engagement).tz === tz;
  }).length);
  const dispatched = c.engagements.filter((item) => item.status !== 'new').length;
  const overdue14 = c.pending.filter((item) => daysOverdue(item.dueDate) > 14).length;
  host.innerHTML = `
    <div class="row wrap mb8" style="justify-content:space-between"><div><strong class="mbr-section-title">Execution</strong><div class="muted">Demand, dispatch, completion, pending reports, mix, and geography.</div></div><button class="btn sm" data-nav="/reports-pending">Reports Pending</button></div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Staffing requests', value: c.engagements.length, iconName: 'send', hint: 'Created demand in scope' })}
      ${kpiCard({ label: 'Dispatched', value: dispatched, iconName: 'check', hint: `${pct(dispatched, c.engagements.length)}% of requests` })}
      ${kpiCard({ label: 'Completed this period', value: c.currentDeliveries.length, iconName: 'check', tone: c.deliveryChange != null && c.deliveryChange < 0 ? COLORS.warning : COLORS.positive, hint: trendText(c.deliveryChange) })}
      ${kpiCard({ label: 'Reports pending', value: c.pending.length, iconName: 'clock', tone: c.pending.length ? COLORS.negative : COLORS.positive, hint: `${overdue14} over 14 days` })}
    </div>
    <div class="two-col">
      <div class="card chart-card"><div class="chart-head"><strong>Delivery mix by Family</strong></div><div class="chart-holder" style="height:230px"><canvas id="mbr-ex-family"></canvas></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Delivery performance by geography</strong></div><div class="chart-holder" style="height:230px"><canvas id="mbr-ex-geo"></canvas></div></div>
    </div>
    <div class="two-col">
      ${metricTable('Family mix', ['Family', 'Current', '% mix', 'Previous', 'MoM'], TRACKS.map((track, index) => [
    track, currentByTrack[index], `${pct(currentByTrack[index], c.currentDeliveries.length)}%`, previousByTrack[index], trendText(changePct(currentByTrack[index], previousByTrack[index])),
  ]))}
      ${metricTable('Geography contribution', ['Time zone', 'Current', 'Contribution', 'Previous', 'MoM'], tzs.map((tz, index) => [
    tz, currentByTz[index], `${pct(currentByTz[index], c.currentDeliveries.length)}%`, previousByTz[index], trendText(changePct(currentByTz[index], previousByTz[index])),
  ]))}
    </div>
    <div class="card pad"><div class="row mb8" style="justify-content:space-between"><strong>Pending report aging</strong>${badge(`${c.pending.length} open`, c.pending.length ? 'tint-warn' : 'tint-info')}</div>
      <div class="table-wrap"><table class="grid"><thead><tr><th>Customer</th><th>Family / Event</th><th>TZ</th><th>Due</th><th>Aging</th><th>Cause</th></tr></thead><tbody>
        ${c.pending.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10).map((engagement) => `<tr><td><strong>${esc(engagement.customer)}</strong></td><td>${esc(engagement.track)} · ${esc(engagement.program)}</td><td>${esc(metaOf(engagement).tz)}</td><td>${engagement.dueDate}</td><td class="${daysOverdue(engagement.dueDate) > 14 ? 'due-over' : ''}">${daysOverdue(engagement.dueDate)}d</td><td>${engagement.atRisk ? 'At-risk delivery' : 'Delivery running late'}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No pending reports.</td></tr>'}
      </tbody></table></div>
    </div>`;
  bar(host.querySelector('#mbr-ex-family'), { labels: TRACKS, values: currentByTrack, color: COLORS.brand, label: 'Completed' });
  bar(host.querySelector('#mbr-ex-geo'), { labels: tzs, values: currentByTz, color: '#6b69d6', label: 'Completed' });
}

function renderReadiness(host, c) {
  const openAge = c.hiring.length ? Math.round(c.hiring.reduce((sum, item) => sum + daysOverdue(item.opened), 0) / c.hiring.length) : 0;
  const offboarding = c.d.csas.filter((item) => item.lifecycle === 'offboarding' && (selectedPartner === 'All' || item.partnerId === selectedPartner)).length;
  const partners = c.d.partners.map((partner) => {
    const resources = c.activeCsas.filter((item) => item.partnerId === partner.id);
    const accreditations = resources.reduce((sum, item) => sum + item.accreditations.length, 0);
    return {
      partner, resources, accreditations,
      accredited: pct(resources.filter((item) => item.accreditations.length).length, resources.length),
      utilization: resources.length ? Math.round(resources.reduce((sum, item) => sum + item.utilization, 0) / resources.length) : 0,
      openRoles: c.hiring.filter((item) => item.partnerId === partner.id).length,
    };
  }).filter((item) => item.resources.length || item.openRoles);
  const accreditationCounts = new Map();
  c.activeCsas.forEach((csa) => csa.accreditations.forEach((accreditation) => accreditationCounts.set(accreditation, (accreditationCounts.get(accreditation) || 0) + 1)));
  const accRows = [...accreditationCounts.entries()].sort((a, b) => b[1] - a[1]);
  const stages = ['Sourcing', 'Screening', 'Interview', 'Offer'];
  host.innerHTML = `
    <div class="row wrap mb8" style="justify-content:space-between"><div><strong class="mbr-section-title">Readiness</strong><div class="muted">Capacity, staffing, attrition, accreditation, and enablement coverage.</div></div><button class="btn sm" data-nav="/capacity">Capacity Management</button></div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Active resources', value: c.activeCsas.length, iconName: 'people', hint: `${partners.length} delivery partners` })}
      ${kpiCard({ label: 'Utilization', value: `${c.utilization}%`, iconName: 'trending', tone: utilColor(c.utilization), hint: 'Healthy band 80–90%' })}
      ${kpiCard({ label: 'Open roles', value: c.hiring.length, iconName: 'personAdd', hint: `Avg open age ${openAge}d` })}
      ${kpiCard({ label: 'Offboarding', value: offboarding, iconName: 'warning', tone: offboarding ? COLORS.warning : COLORS.positive, hint: 'Attrition / backfill pressure' })}
      ${kpiCard({ label: 'Accreditations', value: c.accreditationCount, iconName: 'flag', hint: `${c.accreditedRate}% resources accredited` })}
    </div>
    <div class="two-col">
      <div class="card pad"><strong>Partner staffing and accreditation</strong><div class="table-wrap mt8"><table class="grid"><thead><tr><th>Partner</th><th>Active</th><th>Util.</th><th>Accred.</th><th>Coverage</th><th>Open roles</th></tr></thead><tbody>${partners.map((item) => `<tr><td><strong>${esc(item.partner.name)}</strong></td><td>${item.resources.length}</td><td>${item.utilization}%</td><td>${item.accreditations}</td><td>${item.accredited}%</td><td>${item.openRoles}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card chart-card"><div class="chart-head"><strong>Hiring pipeline</strong></div><div class="chart-holder" style="height:250px"><canvas id="mbr-ready-hiring"></canvas></div></div>
    </div>
    <div class="card pad"><div class="row mb8" style="justify-content:space-between"><strong>Accreditation coverage by Program</strong>${badge(`${accRows.length} programs`, 'tint-info')}</div>
      <div class="table-wrap"><table class="grid"><thead><tr><th>Program</th><th>Accredited resources</th><th>% of accreditations</th><th>Coverage status</th></tr></thead><tbody>
        ${accRows.map(([program, count]) => `<tr><td>${esc(program)}</td><td>${count}</td><td>${pct(count, c.accreditationCount)}%</td><td>${count >= 3 ? badge('Covered', 'tint-info') : badge('Gap', 'tint-warn')}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
  bar(host.querySelector('#mbr-ready-hiring'), { labels: stages, values: stages.map((stage) => c.hiring.filter((item) => item.stage === stage).length), color: '#f7a600', label: 'Open roles' });
}

function renderQuality(host, c) {
  const allPeriods = c.periods;
  const cpeForPeriod = (period) => c.d.cpe.filter((item) => c.engagementIds.has(item.engagementId) && item.date.startsWith(period));
  const vsatTrend = allPeriods.map((period) => { const items = cpeForPeriod(period); return pct(items.filter((item) => item.class === 'VSAT').length, items.length); });
  const dsatTrend = allPeriods.map((period) => { const items = cpeForPeriod(period); return pct(items.filter((item) => item.class === 'DSAT').length, items.length); });
  const dsats = c.currentCpe.filter((item) => item.class === 'DSAT');
  const passRate = pct(c.qcs.filter((item) => item.score >= 4).length, c.qcs.length);
  const criteria = QC_CRITERIA.map(([label, test]) => {
    const applicable = c.qcs.map((item) => item.engagement);
    const score = applicable.length ? Math.round((applicable.filter(test).length / applicable.length) * 5 * 100) / 100 : 0;
    return { label, score, responses: applicable.length };
  }).sort((a, b) => a.score - b.score);
  host.innerHTML = `
    <div class="row wrap mb8" style="justify-content:space-between"><div><strong class="mbr-section-title">Quality</strong><div class="muted">CPE, VSAT/DSAT, root causes, QC discipline, and criteria deep dives.</div></div><button class="btn sm" data-nav="/quality">Quality & CPE</button></div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'CPE responses', value: c.currentCpe.length, iconName: 'report', hint: periodLabel(selectedPeriod) })}
      ${kpiCard({ label: 'VSAT', value: `${c.vsatRate}%`, iconName: 'thumbUp', tone: c.vsatRate >= 75 ? COLORS.positive : COLORS.warning, hint: 'Target ≥ 75%' })}
      ${kpiCard({ label: 'DSAT', value: `${c.dsatRate}%`, iconName: 'thumbDown', tone: c.dsatRate <= 5 ? COLORS.positive : COLORS.negative, hint: 'Target ≤ 5%' })}
      ${kpiCard({ label: 'Average score', value: c.avgCpe.toFixed(2), iconName: 'star', tone: scoreColor(c.avgCpe), hint: 'Out of 5' })}
      ${kpiCard({ label: 'QC pass rate', value: `${passRate}%`, iconName: 'check', tone: passRate >= 80 ? COLORS.positive : COLORS.warning, hint: `${c.qcs.length} derived checks · avg ${c.avgQc.toFixed(1)}` })}
    </div>
    <div class="card chart-card mb16"><div class="chart-head"><strong>VSAT / DSAT trend</strong></div><div class="chart-holder" style="height:240px"><canvas id="mbr-quality-trend"></canvas></div></div>
    <div class="card pad mb16"><div class="row mb8" style="justify-content:space-between"><strong>DSAT root-cause analysis</strong>${badge(`${dsats.length} current-period DSAT`, dsats.length ? 'tint-danger' : 'tint-info')}</div>
      <div class="table-wrap"><table class="grid"><thead><tr><th>Customer</th><th>Score</th><th>Partner CSA</th><th>Program</th><th>TZ</th><th>Root cause</th><th>Verbatim / action</th></tr></thead><tbody>
        ${dsats.map((item) => { const engagement = c.d.engagements.find((candidate) => candidate.id === item.engagementId); const meta = engagement ? metaOf(engagement) : {}; return `<tr><td><strong>${esc(engagement?.customer || item.engagementId)}</strong></td><td>${item.score}</td><td>${esc(meta.csa?.name || 'Unassigned')}</td><td>${esc(engagement?.program || item.track)}</td><td>${esc(meta.tz || '—')}</td><td>${esc(item.rootCauseCategory || 'Needs classification')}</td><td style="white-space:normal;min-width:260px">“${esc(item.verbatim)}”<div class="muted mt8">Action: ${esc(item.rootCauseAction || 'Assign owner')}</div></td></tr>`; }).join('') || '<tr><td colspan="7" class="muted">No DSAT responses in the selected period.</td></tr>'}
      </tbody></table></div>
    </div>
    <div class="card pad"><strong>QC criteria deep dive</strong><div class="muted mb8">Prototype checks are derived from engagement evidence; production uses submitted QC records.</div>
      <div class="table-wrap"><table class="grid"><thead><tr><th>Criterion</th><th>Avg score</th><th>Responses</th><th>Status</th></tr></thead><tbody>
        ${criteria.map((item, index) => `<tr><td>${esc(item.label)}</td><td>${item.score.toFixed(2)}</td><td>${item.responses}</td><td>${item.score < 3.5 ? badge(index === 0 ? 'Lowest · focus' : 'Needs focus', 'tint-danger') : item.score < 4 ? badge('Monitor', 'tint-warn') : badge('Good', 'tint-info')}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
  line(host.querySelector('#mbr-quality-trend'), {
    labels: allPeriods.map(periodLabel),
    datasets: [{ label: 'VSAT %', values: vsatTrend, color: COLORS.positive }, { label: 'DSAT %', values: dsatTrend, color: COLORS.negative }],
  });
}

function renderFinancials(host, c) {
  const totalForecast = c.financials.reduce((sum, item) => sum + item.forecast, 0);
  const variance = c.totalActual - c.totalBudget;
  const forecastVariancePct = c.totalBudget ? Math.round(((totalForecast - c.totalBudget) / c.totalBudget) * 1000) / 10 : 0;
  const allActiveCsas = c.d.csas.filter((item) => item.lifecycle === 'active');
  const partnerSpend = c.d.partners.map((partner) => {
    const resources = allActiveCsas.filter((item) => item.partnerId === partner.id).length;
    return { partner, resources, allocated: allActiveCsas.length ? Math.round(c.totalActual * (resources / allActiveCsas.length)) : 0 };
  }).filter((item) => item.resources);
  host.innerHTML = `
    <div><strong class="mbr-section-title">Budget & Financial Status</strong><div class="muted mb16">${financialScope} · current period / forecast · portfolio financials are not sliced by operational partner/TZ filters.</div></div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Budget', value: money(c.totalBudget), iconName: 'report' })}
      ${kpiCard({ label: 'Actuals', value: money(c.totalActual), iconName: 'trending', tone: variance > 0 ? COLORS.warning : COLORS.positive })}
      ${kpiCard({ label: 'Variance', value: money(variance), iconName: 'warning', tone: variance > 0 ? COLORS.negative : COLORS.positive, hint: signed(c.budgetVariancePct) })}
      ${kpiCard({ label: 'Forecast', value: money(totalForecast), iconName: 'clock', hint: `${signed(forecastVariancePct)} to plan` })}
    </div>
    <div class="card pad mb16"><strong>Budget status by category</strong><div class="table-wrap mt8"><table class="grid"><thead><tr><th>Category</th><th>Budget</th><th>Actuals</th><th>Variance</th><th>Variance %</th><th>Consumption</th><th>Status</th></tr></thead><tbody>
      ${c.financials.map((item) => { const variancePct = item.budget ? Math.round(((item.actual - item.budget) / item.budget) * 1000) / 10 : 0; return `<tr><td><strong>${esc(item.category)}</strong></td><td>${money(item.budget)}</td><td>${money(item.actual)}</td><td>${money(item.variance)}</td><td>${signed(variancePct)}</td><td><div class="row">${meter(Math.min(100, pct(item.actual, item.budget)), item.actual > item.budget ? COLORS.negative : COLORS.positive)}<span>${pct(item.actual, item.budget)}%</span></div></td><td>${financialBadge(item.status)}</td></tr>`; }).join('')}
    </tbody></table></div></div>
    <div class="card pad"><strong>Allocated delivery-partner spend view</strong><div class="muted mb8">Prototype allocation uses active-resource share; production uses the finance/vendor ledger.</div><div class="table-wrap"><table class="grid"><thead><tr><th>Partner</th><th>Active resources</th><th>Share</th><th>Allocated actual</th><th>Open roles</th></tr></thead><tbody>
      ${partnerSpend.map((item) => `<tr><td>${esc(item.partner.name)}</td><td>${item.resources}</td><td>${pct(item.resources, allActiveCsas.length)}%</td><td>${money(item.allocated)}</td><td>${c.d.hiring.filter((hire) => hire.stage !== 'Hired' && hire.partnerId === item.partner.id).length}</td></tr>`).join('')}
    </tbody></table></div></div>`;
}

function renderStrategy(host, c) {
  const initiatives = c.d.initiatives;
  const openActions = c.d.actions.filter((item) => item.status !== 'done').sort((a, b) => String(a.due).localeCompare(String(b.due))).slice(0, 12);
  const ltApproved = c.d.successStories.filter((item) => item.ltApproved).length;
  const priorities = [
    { priority: `Recover VSAT toward 75% (currently ${c.vsatRate}%)`, owner: 'Quality & CPE Lead', measure: 'VSAT ≥75%; DSAT ≤5%' },
    { priority: `Close ${c.pending.length} pending reports`, owner: 'POD Leads', measure: 'Pending aging down MoM' },
    { priority: `Fill ${c.hiring.length} open roles`, owner: 'Operations Managers', measure: 'Coverage gaps = 0' },
    { priority: 'Reconcile the SSD IQ semantic model with Power BI', owner: 'Business Manager', measure: 'All MBR measures reconciled' },
  ];
  host.innerHTML = `
    <div><strong class="mbr-section-title">Tech Strategy, Roadmap, IP & Actions</strong><div class="muted mb16">Offering pipeline, reusable IP, platforms, priorities, risks, decisions, and accountable actions.</div></div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Strategic initiatives', value: initiatives.length, iconName: 'grid', hint: `${initiatives.filter((item) => item.status === 'watch').length} on watch` })}
      ${kpiCard({ label: 'Open actions', value: openActions.length, iconName: 'flag', tone: openActions.some((item) => item.due < '2026-07-28') ? COLORS.warning : COLORS.neutral })}
      ${kpiCard({ label: 'LT-approved stories', value: ltApproved, iconName: 'star', hint: 'Leadership promotion assets' })}
      ${kpiCard({ label: 'Roadmap releases', value: new Set(initiatives.map((item) => item.targetRelease)).size, iconName: 'clock', hint: 'Distinct target windows' })}
    </div>
    <div class="card pad mb16"><strong>Offerings, IP & platform pipeline</strong><div class="table-wrap mt8"><table class="grid"><thead><tr><th>Initiative</th><th>Type / Area</th><th>Stage</th><th>Owner</th><th>Target</th><th>Status</th><th>Impact / next step</th></tr></thead><tbody>
      ${initiatives.map((item) => `<tr><td><strong>${esc(item.name)}</strong></td><td>${esc(item.type)} · ${esc(item.area)}</td><td>${esc(item.stage)}</td><td>${esc(item.ownerName)}</td><td>${esc(item.targetRelease)}</td><td>${financialBadge(item.status)}</td><td style="white-space:normal;min-width:260px">${esc(item.impact)}<div class="muted mt8">Next: ${esc(item.nextStep)}</div></td></tr>`).join('')}
    </tbody></table></div></div>
    <div class="two-col">
      <div class="card pad"><strong>Next-month priorities</strong><div class="table-wrap mt8"><table class="grid"><thead><tr><th>Priority</th><th>Owner</th><th>Success measure</th></tr></thead><tbody>${priorities.map((item) => `<tr><td>${esc(item.priority)}</td><td>${esc(item.owner)}</td><td>${esc(item.measure)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card pad"><div class="row mb8" style="justify-content:space-between"><strong>Actions, owners & decisions</strong><button class="btn sm" data-nav="/messages">Open actions</button></div><div class="table-wrap"><table class="grid"><thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>${openActions.map((item) => `<tr><td style="white-space:normal">${esc(item.title)}</td><td>${esc(item.ownerName)}</td><td class="${item.due < '2026-07-28' ? 'due-over' : ''}">${esc(item.due)}</td><td>${badge(item.status, item.status === 'in-progress' ? 'tint-warn' : 'outline')}</td></tr>`).join('')}</tbody></table></div></div>
    </div>`;
}

function metricTable(title, headers, rows) {
  return `<div class="card pad"><strong>${esc(title)}</strong><div class="table-wrap mt8"><table class="grid"><thead><tr>${headers.map((header) => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? `<strong>${esc(cell)}</strong>` : esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}

function financialBadge(status) {
  if (status === 'on-track') return badge('On track', 'tint-info');
  if (status === 'watch') return badge('Watch', 'tint-warn');
  return badge(status === 'over-plan' ? 'Over plan' : status, 'tint-danger');
}
