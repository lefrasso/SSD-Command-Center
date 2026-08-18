// PODs & People — roster, capacity, utilization, skills, time-zone rollup.
import { store, computePodPerformance } from '../store.js';
import { pageHeader, kpiCard, badge, statusPill, aiChip, esc, meter, utilColor, scoreColor, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { TZ_MAP, LEADERSHIP } from '../../data/generate.js';

const TIER_BADGE = { Leading: 'tint-info', 'On track': 'outline', 'Needs attention': 'tint-danger' };

let tz = 'All';
let podFilter = 'All';

export function renderPods(container) {
  const d = store.data;
  // POD Lead is scoped to their own POD only — a stable stand-in since the persona isn't
  // individually linked to a generated POD lead name.
  const myPod = store.role === 'pod-lead' ? d.pods[0] : null;
  const active = (myPod ? d.csas.filter((c) => c.podId === myPod.id) : d.csas).filter((c) => c.lifecycle === 'active');
  const ftcs = active.filter((c) => c.resourceType === 'FTC');
  const podLeadsByTz = Object.fromEntries(Object.keys(TZ_MAP).map((timeZone) => [timeZone, new Set(d.pods.filter((pod) => pod.tz === timeZone).map((pod) => pod.leadName)).size]));

  const podsByTz = (region) => Object.entries(TZ_MAP).find(([, i]) => i.regions.includes(region))?.[0] || 'Global';
  const pods = myPod ? [myPod] : d.pods.filter((p) => (tz === 'All' || p.tz === tz));
  const roster = myPod ? active : active.filter((c) => {
    const pod = d.pods.find((p) => p.id === c.podId);
    return (tz === 'All' || (pod && pod.tz === tz)) && (podFilter === 'All' || c.podId === podFilter);
  });

  const avgUtil = active.length ? Math.round(active.reduce((s, c) => s + c.utilization, 0) / active.length) : 0;
  const podPerf = computePodPerformance(d).filter((p) => myPod ? p.id === myPod.id : ((tz === 'All' || p.tz === tz) && (podFilter === 'All' || p.id === podFilter))).sort((a, b) => b.score - a.score);

  // Skills coverage
  const skillCount = {};
  active.forEach((c) => c.skills.forEach((s) => (skillCount[s] = (skillCount[s] || 0) + 1)));
  const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 12);

  // AI: capacity balancing + skill gap
  const over = active.filter((c) => c.utilization > 92);
  const under = active.filter((c) => c.utilization < 72);
  const demand = {};
  d.engagements.filter((e) => e.status !== 'complete').forEach((e) => (demand[e.track] = (demand[e.track] || 0) + 1));
  const gap = Object.entries(demand).map(([t, n]) => ({ t, ratio: n / Math.max(1, active.filter((c) => c.tracks.includes(t)).length) })).sort((a, b) => b.ratio - a.ratio)[0];
  const aiText = `Capacity balancing: ${over.length} CSA(s) over 92% utilization and ${under.length} under 72%. ` +
    (over[0] && under[0] ? `Consider shifting demand from ${over[0].name} to ${under[0].name}. ` : '') +
    (gap ? `Skill-gap watch: ${gap.t} shows the highest demand-to-supply ratio — prioritise hiring/enablement there.` : '');

  // Org hierarchy: WW Lead → TZ Lead → CSA Manager → POD Leads (multiple POD Leads per territory/OU).
  const tzGroups = Object.keys(TZ_MAP).map((tz) => {
    const tzPods = d.pods.filter((p) => p.tz === tz);
    const managers = [...new Set(tzPods.map((p) => p.csaManager))];
    return { tz, lead: TZ_MAP[tz].lead, managers: managers.map((m) => ({ m, leads: tzPods.filter((p) => p.csaManager === m).map((p) => p.leadName) })) };
  });

  const tzOpts = ['All', ...Object.keys(TZ_MAP)].map((t) => `<option value="${t}" ${t === tz ? 'selected' : ''}>${t === 'All' ? 'All time zones' : t}</option>`).join('');
  const podOpts = ['All', ...pods.map((p) => p.id)].map((p) => { const label = p === 'All' ? 'All PODs' : d.pods.find((x) => x.id === p)?.name; return `<option value="${p}" ${p === podFilter ? 'selected' : ''}>${esc(label)}</option>`; }).join('');

  container.innerHTML = `
    ${pageHeader({
      title: myPod ? `PODs & People — ${myPod.name}` : 'PODs & People',
      description: myPod ? 'Your POD — roster, capacity, utilization and skills.' : 'POD structure, FTC workforce, capacity, utilization and skills — rolled up by time zone.',
      actions: myPod ? '' : `<select class="select" id="f-tz">${tzOpts}</select><select class="select" id="f-pod">${podOpts}</select>`,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'FTC workforce', value: ftcs.length, iconName: 'people', hint: 'All lifecycle stages' })}
      ${kpiCard({ label: 'Active Partner CSAs', value: active.length, iconName: 'people' })}
      ${kpiCard({ label: 'Avg utilization', value: avgUtil + '%', iconName: 'trending', tone: utilColor(avgUtil), hint: 'Healthy 80–90%' })}
      ${myPod
        ? kpiCard({ label: 'Time zone', value: myPod.tz, iconName: 'database', hint: myPod.region })
        : kpiCard({ label: 'POD Leads', value: d.pods.length, iconName: 'database', hint: Object.entries(podLeadsByTz).map(([timeZone, count]) => `${timeZone} ${count}`).join(' · ') })}
      ${myPod
        ? kpiCard({ label: 'CSA Manager', value: myPod.csaManager, iconName: 'building' })
        : kpiCard({ label: 'Delivery Partners', value: d.partners.length, iconName: 'building' })}
    </div>

    <div class="card pad mb16">
      <div class="row mb8">${icon('sparkle', 18)}<strong>Capacity & skills insight</strong>${aiChip()}</div>
      <div>${esc(aiText)}</div>
    </div>

    ${myPod ? '' : `<div class="card pad mb16">
      <div class="row mb8"><strong style="font-size:15px">Org hierarchy</strong>${badge('WW → TZ → Manager → POD Lead', 'tint-info')}</div>
      <div class="muted mb8" style="font-size:12px">${esc(LEADERSHIP.wwLead)} · Worldwide Lead</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
        ${tzGroups.map((g) => `<div class="card pad" style="background:var(--bg-2)">
          <div style="font-weight:600">${esc(g.tz)} · TZ Lead ${esc(g.lead)} · ${g.managers.reduce((sum, manager) => sum + manager.leads.length, 0)} POD Leads</div>
          ${g.managers.map((mm) => `<div class="mt8"><div style="font-size:13px;font-weight:600">${esc(mm.m)} <span class="muted" style="font-weight:400">· CSA Manager</span></div><div class="muted" style="font-size:12px">POD Leads: ${esc(mm.leads.join(', '))}</div></div>`).join('')}
        </div>`).join('')}
      </div>
    </div>`}

    <div class="section-title">Capacity heatmap by POD</div>
    <div class="card pad mb16">
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px">
        ${pods.map((p) => {
          const csas = active.filter((c) => c.podId === p.id);
          const u = csas.length ? Math.round(csas.reduce((s, c) => s + c.utilization, 0) / csas.length) : p.utilization;
          return `<div class="heat-cell" style="background:${utilColor(u)}">
            <div style="display:flex;justify-content:space-between"><span>${esc(p.name)}</span><strong>${u}%</strong></div>
            <div style="font-size:11px;opacity:.9;margin-top:2px">${esc(p.tz)} · ${csas.length} CSAs · Lead ${esc(p.leadName)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="section-title">POD performance leaderboard</div>
    <div class="card pad mb16">
      <div class="muted mb8" style="font-size:12px">Composite score (0–100) blends CPE, quality, utilization, open escalations and sentiment — a POD-level read of the CSA scorecard used on Performance &amp; PIPs.</div>
      <div class="table-wrap">
        <table class="grid">
          <thead><tr><th>POD</th><th>Lead</th><th>TZ</th><th>CSAs</th><th>Utilization</th><th>CPE</th><th>Quality</th><th>On-time</th><th>Open esc</th><th>Attrition (12mo)</th><th>Sentiment</th><th>Score</th><th>Tier</th></tr></thead>
          <tbody>
            ${podPerf.map((p) => `<tr>
              <td><strong>${esc(p.name)}</strong></td>
              <td>${esc(p.leadName)}</td>
              <td>${esc(p.tz)}</td>
              <td>${p.csaCount}</td>
              <td><div class="row" style="gap:6px">${meter(p.util, utilColor(p.util))}<span>${p.util}%</span></div></td>
              <td style="color:${scoreColor(p.avgCpe)}">${p.avgCpe.toFixed(1)}</td>
              <td style="color:${scoreColor(p.avgQuality)}">${p.avgQuality.toFixed(1)}</td>
              <td>${p.onTimePct == null ? '—' : p.onTimePct + '%'}</td>
              <td>${p.slaBreach ? `<span style="color:${COLORS.negative}">${p.openEsc}</span>` : p.openEsc}</td>
              <td>${p.attritionCount ? `<span style="color:${COLORS.warning}">${p.attritionCount}</span>` : '0'}</td>
              <td style="color:${p.netSentiment >= 0 ? COLORS.positive : COLORS.negative}">${p.netSentiment > 0 ? '+' + p.netSentiment : p.netSentiment}</td>
              <td><strong>${p.score}</strong></td>
              <td>${badge(p.tier, TIER_BADGE[p.tier])}</td>
            </tr>`).join('') || '<tr><td colspan="13" class="muted" style="padding:16px">No PODs in scope.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="two-col">
      <div>
        <div class="section-title">Roster (${roster.length})</div>
        <div class="table-wrap">
          <table class="grid">
            <thead><tr><th>Name</th><th>Type</th><th>Vendor</th><th>POD</th><th>Families</th><th>Utilization</th><th>Tenure</th><th>Status</th></tr></thead>
            <tbody>
              ${roster.map((c) => { const pod = d.pods.find((p) => p.id === c.podId); return `<tr>
                <td><strong>${esc(c.name)}</strong></td>
                <td>${badge(c.resourceType, c.resourceType === 'FTC' ? 'tint-info' : 'outline')}</td>
                <td>${esc(c.vendor)}</td>
                <td>${esc(pod ? pod.name : '—')}</td>
                <td>${esc(c.tracks.join(', '))}</td>
                <td><div class="row" style="gap:6px">${meter(c.utilization, utilColor(c.utilization))}<span>${c.utilization}%</span></div></td>
                <td>${c.tenureMonths} mo</td>
                <td>${statusPill(c.lifecycle)}</td>
              </tr>`; }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="section-title">Skills coverage</div>
        <div class="card pad">
          ${topSkills.map(([s, n]) => `<div class="row mb8" style="gap:8px"><div style="width:150px;font-size:13px">${esc(s)}</div><div class="flex1">${meter((n / active.length) * 100, COLORS.brand)}</div><div style="width:28px;text-align:right;font-size:12px">${n}</div></div>`).join('')}
        </div>
      </div>
    </div>`;

  const fTz = container.querySelector('#f-tz');
  const fPod = container.querySelector('#f-pod');
  if (fTz) fTz.addEventListener('change', (e) => { tz = e.target.value; podFilter = 'All'; renderPods(container); });
  if (fPod) fPod.addEventListener('change', (e) => { podFilter = e.target.value; renderPods(container); });
}
