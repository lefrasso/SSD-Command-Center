// PODs & People — roster, capacity, utilization, skills, time-zone rollup.
import { store } from '../store.js';
import { pageHeader, kpiCard, badge, statusPill, aiChip, esc, meter, utilColor, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { TZ_MAP, LEADERSHIP } from '../../data/generate.js';

let tz = 'All';
let podFilter = 'All';

export function renderPods(container) {
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');

  const podsByTz = (region) => Object.entries(TZ_MAP).find(([, i]) => i.regions.includes(region))?.[0] || 'Global';
  const pods = d.pods.filter((p) => (tz === 'All' || p.tz === tz));
  const roster = active.filter((c) => {
    const pod = d.pods.find((p) => p.id === c.podId);
    return (tz === 'All' || (pod && pod.tz === tz)) && (podFilter === 'All' || c.podId === podFilter);
  });

  const avgUtil = active.length ? Math.round(active.reduce((s, c) => s + c.utilization, 0) / active.length) : 0;

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
      title: 'PODs & People',
      description: 'POD structure, capacity, utilization and skills — rolled up by time zone.',
      actions: `<select class="select" id="f-tz">${tzOpts}</select><select class="select" id="f-pod">${podOpts}</select>`,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Active Partner CSAs', value: active.length, iconName: 'people' })}
      ${kpiCard({ label: 'Avg utilization', value: avgUtil + '%', iconName: 'trending', tone: utilColor(avgUtil), hint: 'Healthy 80–90%' })}
      ${kpiCard({ label: 'PODs', value: d.pods.length, iconName: 'database' })}
      ${kpiCard({ label: 'Delivery Partners', value: d.partners.length, iconName: 'building' })}
    </div>

    <div class="card pad mb16">
      <div class="row mb8">${icon('sparkle', 18)}<strong>Capacity & skills insight</strong>${aiChip()}</div>
      <div>${esc(aiText)}</div>
    </div>

    <div class="card pad mb16">
      <div class="row mb8"><strong style="font-size:15px">Org hierarchy</strong>${badge('WW → TZ → Manager → POD Lead', 'tint-info')}</div>
      <div class="muted mb8" style="font-size:12px">${esc(LEADERSHIP.wwLead)} · Worldwide Lead</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
        ${tzGroups.map((g) => `<div class="card pad" style="background:var(--bg-2)">
          <div style="font-weight:600">${esc(g.tz)} · TZ Lead ${esc(g.lead)}</div>
          ${g.managers.map((mm) => `<div class="mt8"><div style="font-size:13px;font-weight:600">${esc(mm.m)} <span class="muted" style="font-weight:400">· CSA Manager</span></div><div class="muted" style="font-size:12px">POD Leads: ${esc(mm.leads.join(', '))}</div></div>`).join('')}
        </div>`).join('')}
      </div>
    </div>

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

    <div class="two-col">
      <div>
        <div class="section-title">Roster (${roster.length})</div>
        <div class="table-wrap">
          <table class="grid">
            <thead><tr><th>Name</th><th>Vendor</th><th>POD</th><th>Families</th><th>Utilization</th><th>Tenure</th><th>Status</th></tr></thead>
            <tbody>
              ${roster.map((c) => { const pod = d.pods.find((p) => p.id === c.podId); return `<tr>
                <td><strong>${esc(c.name)}</strong></td>
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

  container.querySelector('#f-tz').addEventListener('change', (e) => { tz = e.target.value; podFilter = 'All'; renderPods(container); });
  container.querySelector('#f-pod').addEventListener('change', (e) => { podFilter = e.target.value; renderPods(container); });
}
