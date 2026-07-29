// Enablement — accreditations, S500 eligibility, SDM onboarding, user voice, shadowing.
import { store } from '../store.js';
import { pageHeader, kpiCard, esc, badge, COLORS } from '../components.js';
import { icon } from '../icons.js';

const SDM_ONBOARD = ['Role & scope orientation', 'Escalation process training', 'ADO & Power BI access', 'Partner health dashboards', 'Shadow live escalations', 'Readiness sign-off'];
const SDMS = ['Priya Nair', 'Kenji Watanabe', 'Laura Bianchi', 'Mohammed Ali', 'Grace Park', 'Tomás Herrera'];

let tab = 'accred';
const userVoice = [
  { title: 'One-click MBR export to PowerPoint', votes: 42, status: 'Planned' },
  { title: 'Auto-suggest best-fit CSA on new demand', votes: 37, status: 'Shipped' },
  { title: 'Mobile view for POD Leads', votes: 28, status: 'Under review' },
  { title: 'Slack/Teams escalation alerts', votes: 21, status: 'Planned' },
];
const seedOf = (s) => [...s].reduce((a, ch) => a + ch.charCodeAt(0), 0);

export function renderEnablement(container) {
  const tabs = [['accred', 'Accreditations'], ['s500', 'S500 Eligibility'], ['sdm', 'SDM Onboarding'], ['uv', 'User Voice'], ['shadow', 'Shadowing']];
  container.innerHTML = `
    ${pageHeader({ title: 'Enablement', description: 'Accreditations, S500 eligibility, SDM onboarding, User Voice and shadowing management.' })}
    <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
    <div id="tabc"></div>`;
  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderEnablement(container); }));
  const tc = container.querySelector('#tabc');
  ({ accred: renderAccred, s500: renderS500, sdm: renderSdm, uv: renderUv, shadow: renderShadow })[tab](tc, container);
}

function renderAccred(tc) {
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const skillCount = {};
  active.forEach((c) => c.skills.forEach((s) => (skillCount[s] = (skillCount[s] || 0) + 1)));
  const top = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  tc.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard({ label: 'Accredited CSAs', value: active.length, iconName: 'check', tone: COLORS.positive })}
      ${kpiCard({ label: 'Distinct accreditations', value: Object.keys(skillCount).length, iconName: 'star' })}
      ${kpiCard({ label: 'Avg per CSA', value: active.length ? Math.round(active.reduce((s, c) => s + c.skills.length, 0) / active.length) : 0, iconName: 'people' })}
    </div>
    <div class="section-title">Top accreditations</div>
    <div class="row wrap mb16" style="gap:6px">${top.map(([s, n]) => `<span class="badge tint-info">${esc(s)} · ${n}</span>`).join('')}</div>
    <div class="section-title">CSA accreditations</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>CSA</th><th>Vendor</th><th>Accreditations</th></tr></thead><tbody>
      ${active.slice(0, 40).map((c) => `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.vendor)}</td><td>${c.skills.map((s) => `<span class="badge outline" style="margin:1px">${esc(s)}</span>`).join('')}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function renderS500(tc) {
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const rows = active.map((c) => { const eligible = c.cpe >= 4.4 && c.quality >= 4.4 && c.tenureMonths >= 6; const reason = eligible ? 'Meets CPE, quality & tenure' : c.cpe < 4.4 ? 'CPE below 4.4' : c.quality < 4.4 ? 'Quality below 4.4' : 'Tenure < 6 months'; return { c, eligible, reason }; });
  const eligibleCount = rows.filter((r) => r.eligible).length;
  tc.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard({ label: 'S500 eligible', value: eligibleCount, iconName: 'check', tone: COLORS.positive })}
      ${kpiCard({ label: 'Not yet eligible', value: active.length - eligibleCount, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'Eligibility rate', value: (active.length ? Math.round((eligibleCount / active.length) * 100) : 0) + '%', iconName: 'trending' })}
    </div>
    <div class="muted mb8" style="font-size:12px">Criteria: CPE ≥ 4.4, quality ≥ 4.4 and tenure ≥ 6 months.</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>CSA</th><th>Vendor</th><th>CPE</th><th>Quality</th><th>Tenure</th><th>S500</th><th>Reason</th></tr></thead><tbody>
      ${rows.slice(0, 50).map((r) => `<tr><td><strong>${esc(r.c.name)}</strong></td><td>${esc(r.c.vendor)}</td><td>${r.c.cpe.toFixed(1)}</td><td>${r.c.quality.toFixed(1)}</td><td>${r.c.tenureMonths}mo</td><td>${r.eligible ? badge('Eligible', 'tint-info') : badge('No', 'tint-warn')}</td><td class="muted" style="font-size:12px">${esc(r.reason)}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function renderSdm(tc) {
  tc.innerHTML = `
    <div class="section-title">SDM onboarding</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>SDM</th><th>Progress</th><th>Status</th></tr></thead><tbody>
      ${SDMS.map((s) => { const done = seedOf(s) % (SDM_ONBOARD.length + 1); const pct = Math.round((done / SDM_ONBOARD.length) * 100); return `<tr><td><strong>${esc(s)}</strong></td><td>${done}/${SDM_ONBOARD.length} (${pct}%)</td><td>${pct === 100 ? badge('Ready', 'tint-info') : badge('Onboarding', 'tint-warn')}</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="section-title">Onboarding checklist</div>
    <div class="card pad">${SDM_ONBOARD.map((t) => `<div class="check-item"><span class="check-box"></span><span>${esc(t)}</span></div>`).join('')}</div>`;
}

function renderUv(tc, container) {
  tc.innerHTML = `
    <div class="row mb16" style="gap:6px;max-width:640px">
      <input class="input" id="uv-in" style="flex:1" placeholder="Share an idea to improve Compass…"/>
      <button class="btn primary sm" id="uv-add">Submit</button>
    </div>
    <div class="section-title">Ideas (${userVoice.length})</div>
    ${userVoice.slice().sort((a, b) => b.votes - a.votes).map((i) => `<div class="card pad mb8" style="display:flex;align-items:center;gap:12px">
      <button class="btn sm" data-vote="${esc(i.title)}">${icon('trending', 14)} ${i.votes}</button>
      <div style="flex:1"><strong>${esc(i.title)}</strong></div>
      ${badge(i.status, i.status === 'Shipped' ? 'tint-info' : 'outline')}
    </div>`).join('')}`;
  tc.querySelector('#uv-add').addEventListener('click', () => { const v = tc.querySelector('#uv-in').value.trim(); if (v) { userVoice.push({ title: v, votes: 1, status: 'New' }); renderEnablement(container); } });
  tc.querySelectorAll('[data-vote]').forEach((b) => b.addEventListener('click', () => { const it = userVoice.find((x) => x.title === b.getAttribute('data-vote')); if (it) { it.votes += 1; renderEnablement(container); } }));
}

function renderShadow(tc) {
  const d = d0();
  const mentees = d.csas.filter((c) => c.lifecycle === 'onboarding' || c.lifecycle === 'selection' || c.lifecycle === 'sourcing');
  const pairs = mentees.map((m) => { const mentor = d.csas.find((c) => c.lifecycle === 'active' && c.podId === m.podId) || d.csas.find((c) => c.lifecycle === 'active' && c.tracks.some((t) => m.tracks.includes(t))); const seed = seedOf(m.id); const status = ['Scheduled', 'In progress', 'Completed'][seed % 3]; return { m, mentor, status }; });
  tc.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard({ label: 'Shadowing pairs', value: pairs.length, iconName: 'people' })}
      ${kpiCard({ label: 'In progress', value: pairs.filter((p) => p.status === 'In progress').length, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'Completed', value: pairs.filter((p) => p.status === 'Completed').length, iconName: 'check', tone: COLORS.positive })}
    </div>
    <div class="section-title">Shadowing assignments</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Mentee</th><th>Mentor</th><th>Track</th><th>Status</th></tr></thead><tbody>
      ${pairs.map((p) => `<tr><td><strong>${esc(p.m.name)}</strong></td><td>${esc(p.mentor ? p.mentor.name : '—')}</td><td>${esc(p.m.tracks.join(', '))}</td><td>${p.status === 'Completed' ? badge('Completed', 'tint-info') : p.status === 'In progress' ? badge('In progress', 'tint-warn') : badge('Scheduled', 'outline')}</td></tr>`).join('') || '<tr><td colspan="4" class="muted" style="padding:16px">No shadowing pairs in progress.</td></tr>'}
    </tbody></table></div>`;
}
function d0() { return store.data; }
