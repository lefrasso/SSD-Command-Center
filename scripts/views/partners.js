// Delivery Partners — provider/DP management, DP onboarding, and profile management.
import { store, computePartnerPerformance } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, statusPill, scoreColor, COLORS, clearCharts, bar, openDrawer, meter, utilColor } from '../components.js';
import { icon } from '../icons.js';
import { partnerPerformanceSummary } from '../ai.js';

const DP_ONBOARD = ['MOSA contract signed', 'Security & compliance review', 'Tooling & access provisioned', 'POD alignment & ramp plan', 'First CSA cohort onboarded', 'Go-live sign-off'];
const TIER_BADGE = { Leading: 'tint-info', 'On track': 'outline', 'Needs attention': 'tint-danger' };
const TIER_COLOR = { Leading: COLORS.positive, 'On track': COLORS.info, 'Needs attention': COLORS.negative };

let fRegion = 'All';
let fStatus = 'All';

export function renderPartners(container) {
  clearCharts();
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const onboarding = d.partners.filter((p) => p.status === 'onboarding').length;
  const avgCpe = d.partners.length ? Math.round((d.partners.reduce((s, p) => s + p.cpe, 0) / d.partners.length) * 10) / 10 : 0;
  const perfAll = computePartnerPerformance(d);
  const regions = [...new Set(d.partners.map((p) => p.region))].sort();
  const statuses = [...new Set(d.partners.map((p) => p.status))].sort();
  const perf = perfAll.filter((p) => (fRegion === 'All' || p.region === fRegion) && (fStatus === 'All' || p.status === fStatus));
  const summary = partnerPerformanceSummary(d);
  const totalS500Flags = perfAll.reduce((s, p) => s + p.s500Flags, 0);
  const opt = (v, sel, label) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(label)}</option>`;

  container.innerHTML = `
    ${pageHeader({ title: 'Delivery Partners', description: 'Delivery Partner (provider) management — scorecards, contracts, onboarding and profiles, governed under MOSA.', actions: aiChip('Governance') })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Delivery Partners', value: d.partners.length, iconName: 'building' })}
      ${kpiCard({ label: 'Partner CSAs', value: active.length, iconName: 'people' })}
      ${kpiCard({ label: 'Avg partner CPE', value: avgCpe.toFixed(1), iconName: 'star', tone: scoreColor(avgCpe) })}
      ${kpiCard({ label: 'Onboarding', value: onboarding, iconName: 'personAdd', tone: onboarding ? COLORS.warning : COLORS.neutral })}
      ${kpiCard({ label: 'Needs attention', value: perfAll.filter((p) => p.tier === 'Needs attention').length, iconName: 'warning', tone: perfAll.some((p) => p.tier === 'Needs attention') ? COLORS.negative : COLORS.neutral })}
      ${kpiCard({ label: 'S500 cx by non-ready CSA', value: totalS500Flags, iconName: 'warning', tone: totalS500Flags ? COLORS.negative : COLORS.neutral, hint: 'target: 0' })}
    </div>

    <div class="card pad mb16" style="border-left:4px solid var(--brand-primary)"><div class="row mb8">${icon('sparkle', 16)}<strong>Partner performance insight</strong>${aiChip()}</div><div>${esc(summary.text)}</div></div>

    <div class="row wrap mb16" style="gap:8px;align-items:center">
      <select class="select" id="p-region">${opt('All', fRegion, 'All regions')}${regions.map((v) => opt(v, fRegion, v)).join('')}</select>
      <select class="select" id="p-status">${opt('All', fStatus, 'All statuses')}${statuses.map((v) => opt(v, fStatus, v)).join('')}</select>
      <button class="btn sm" id="p-reset">Reset</button>
    </div>

    <div class="card chart-card mb16"><div class="chart-head"><strong>Composite score by partner</strong></div><div class="chart-holder" style="height:240px"><canvas id="p-score"></canvas></div></div>

    <div class="section-title">Partner scorecards (${perf.length})</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Partner</th><th>Region</th><th>Status</th><th>CPE</th><th>Quality</th><th>Deliveries</th><th>CSAs</th><th>Active HC</th><th>Open reqs</th><th>Open esc</th><th>Sentiment</th><th>S500 ready</th><th>S500 flags</th><th>Score</th><th>Tier</th><th></th></tr></thead><tbody>
      ${perf.map((p) => { const pcsas = d.csas.filter((c) => c.partnerId === p.id); const csasCount = pcsas.length; const activeHC = pcsas.filter((c) => c.lifecycle === 'active').length; const openReq = (d.hiring || []).filter((h) => h.partnerId === p.id && h.stage !== 'Hired').length; return `<tr>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${esc(p.region)}</td>
        <td>${statusPill(p.status)}</td>
        <td style="color:${scoreColor(p.avgCpe)};font-weight:600">${p.avgCpe.toFixed(1)}</td>
        <td style="color:${scoreColor(p.avgQuality)}">${p.avgQuality.toFixed(1)}</td>
        <td>${d.partners.find((x) => x.id === p.id).deliveries}</td>
        <td>${csasCount}</td>
        <td>${activeHC}</td>
        <td>${openReq}</td>
        <td>${p.slaBreach ? `<span style="color:${COLORS.negative}">${p.openEsc}</span>` : p.openEsc}</td>
        <td style="color:${p.netSentiment >= 0 ? COLORS.positive : COLORS.negative}">${p.netSentiment > 0 ? '+' + p.netSentiment : p.netSentiment}</td>
        <td>${p.s500ReadyPct}%</td>
        <td>${p.s500Flags ? `<span style="color:${COLORS.negative}">${p.s500Flags}</span>` : '0'}</td>
        <td><strong>${p.score}</strong></td>
        <td>${badge(p.tier, TIER_BADGE[p.tier])}</td>
        <td><button class="btn sm" data-p="${p.id}">Profile</button></td>
      </tr>`; }).join('') || '<tr><td colspan="16" class="muted" style="padding:16px">No partners in scope.</td></tr>'}
    </tbody></table></div>`;

  bar(container.querySelector('#p-score'), { labels: perf.map((p) => p.name), values: perf.map((p) => p.score), color: perf.map((p) => TIER_COLOR[p.tier]), label: 'Score' });

  container.querySelector('#p-region').addEventListener('change', (e) => { fRegion = e.target.value; renderPartners(container); });
  container.querySelector('#p-status').addEventListener('change', (e) => { fStatus = e.target.value; renderPartners(container); });
  container.querySelector('#p-reset').addEventListener('click', () => { fRegion = 'All'; fStatus = 'All'; renderPartners(container); });
  container.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => openProfile(b.getAttribute('data-p'))));
}

function openProfile(id) {
  const d = store.data;
  const p = d.partners.find((x) => x.id === id); if (!p) return;
  const csas = d.csas.filter((c) => c.partnerId === p.id);
  const active = csas.filter((c) => c.lifecycle === 'active');
  const engs = d.engagements.filter((e) => csas.some((c) => c.id === e.assignedTo));
  const escs = d.escalations.filter((e) => engs.some((x) => x.id === e.engagementId));
  const util = active.length ? Math.round(active.reduce((s, c) => s + c.utilization, 0) / active.length) : 0;
  const perf = computePartnerPerformance(d).find((x) => x.id === p.id);
  const attritionCount = d.attrition.filter((a) => a.partnerId === p.id).length;
  const doneCount = p.status === 'active' ? DP_ONBOARD.length : p.status === 'exiting' ? DP_ONBOARD.length : Math.max(2, [...p.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % DP_ONBOARD.length);
  const checklist = DP_ONBOARD.map((t, i) => `<div class="check-item"><span class="check-box ${i < doneCount ? 'done' : ''}">${i < doneCount ? icon('check', 12) : ''}</span><span>${esc(t)}</span></div>`).join('');

  const body = `
    <div class="row wrap mb8" style="gap:8px">${statusPill(p.status)}${badge(p.type, 'outline')}${badge(p.contractRef, 'outline')}${perf ? badge(perf.tier, TIER_BADGE[perf.tier]) : ''}</div>
    <div class="field"><span class="field-key">Region</span><span class="field-val">${esc(p.region)}</span></div>
    <div class="field"><span class="field-key">CPE</span><span class="field-val" style="color:${scoreColor(p.cpe)}">${p.cpe.toFixed(1)}</span></div>
    <div class="field"><span class="field-key">Quality</span><span class="field-val" style="color:${scoreColor(p.quality)}">${p.quality.toFixed(1)}</span></div>
    <div class="field"><span class="field-key">Deliveries</span><span class="field-val">${p.deliveries}</span></div>
    <div class="field"><span class="field-key">Partner CSAs</span><span class="field-val">${csas.length} (${active.length} active)</span></div>
    <div class="field"><span class="field-key">Open escalations</span><span class="field-val">${escs.filter((e) => e.status !== 'resolved').length}</span></div>
    <div class="field"><span class="field-key">Utilization</span><span class="field-val"><div class="row" style="gap:6px;justify-content:flex-end">${meter(util, utilColor(util))}${util}%</div></span></div>
    ${perf ? `<div class="field"><span class="field-key">Sentiment</span><span class="field-val" style="color:${perf.netSentiment >= 0 ? COLORS.positive : COLORS.negative}">${perf.netSentiment > 0 ? '+' + perf.netSentiment : perf.netSentiment}</span></div>
    <div class="field"><span class="field-key">S500 readiness</span><span class="field-val">${perf.s500ReadyPct}%${perf.s500Flags ? ` · ${perf.s500Flags} S500 cx by non-ready CSA` : ''}</span></div>
    <div class="field"><span class="field-key">Composite score</span><span class="field-val"><strong>${perf.score}</strong>/100</span></div>` : ''}
    <div class="field"><span class="field-key">Attrition (12mo)</span><span class="field-val">${attritionCount}</span></div>
    <div class="section-title">DP onboarding</div>${checklist}`;
  openDrawer(`${esc(p.name)}`, body);
}
