// Delivery Partners — provider/DP management, DP onboarding, and profile management.
import { store } from '../store.js';
import { pageHeader, kpiCard, esc, badge, statusPill, scoreColor, COLORS, openDrawer, meter } from '../components.js';
import { icon } from '../icons.js';

const DP_ONBOARD = ['MOSA contract signed', 'Security & compliance review', 'Tooling & access provisioned', 'POD alignment & ramp plan', 'First CSA cohort onboarded', 'Go-live sign-off'];

export function renderPartners(container) {
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const onboarding = d.partners.filter((p) => p.status === 'onboarding').length;
  const avgCpe = d.partners.length ? Math.round((d.partners.reduce((s, p) => s + p.cpe, 0) / d.partners.length) * 10) / 10 : 0;

  container.innerHTML = `
    ${pageHeader({ title: 'Delivery Partners', description: 'Delivery Partner (provider) management — scorecards, contracts, onboarding and profiles, governed under MOSA.' })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Delivery Partners', value: d.partners.length, iconName: 'building' })}
      ${kpiCard({ label: 'Partner CSAs', value: active.length, iconName: 'people' })}
      ${kpiCard({ label: 'Avg partner CPE', value: avgCpe.toFixed(1), iconName: 'star', tone: scoreColor(avgCpe) })}
      ${kpiCard({ label: 'Onboarding', value: onboarding, iconName: 'personAdd', tone: onboarding ? COLORS.warning : COLORS.neutral })}
    </div>

    <div class="section-title">Partner scorecards</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Partner</th><th>Region</th><th>Status</th><th>CPE</th><th>Deliveries</th><th>CSAs</th><th>PODs</th><th>Contract</th><th></th></tr></thead><tbody>
      ${d.partners.map((p) => { const csas = d.csas.filter((c) => c.partnerId === p.id).length; return `<tr>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${esc(p.region)}</td>
        <td>${statusPill(p.status)}</td>
        <td style="color:${scoreColor(p.cpe)};font-weight:600">${p.cpe.toFixed(1)}</td>
        <td>${p.deliveries}</td>
        <td>${csas}</td>
        <td>${p.podIds.length}</td>
        <td class="muted" style="font-size:12px">${esc(p.contractRef)}</td>
        <td><button class="btn sm" data-p="${p.id}">Profile</button></td>
      </tr>`; }).join('')}
    </tbody></table></div>`;

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
  const doneCount = p.status === 'active' ? DP_ONBOARD.length : p.status === 'exiting' ? DP_ONBOARD.length : Math.max(2, [...p.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % DP_ONBOARD.length);
  const checklist = DP_ONBOARD.map((t, i) => `<div class="check-item"><span class="check-box ${i < doneCount ? 'done' : ''}">${i < doneCount ? icon('check', 12) : ''}</span><span>${esc(t)}</span></div>`).join('');

  const body = `
    <div class="row wrap mb8" style="gap:8px">${statusPill(p.status)}${badge(p.type, 'outline')}${badge(p.contractRef, 'outline')}</div>
    <div class="field"><span class="field-key">Region</span><span class="field-val">${esc(p.region)}</span></div>
    <div class="field"><span class="field-key">CPE</span><span class="field-val" style="color:${scoreColor(p.cpe)}">${p.cpe.toFixed(1)}</span></div>
    <div class="field"><span class="field-key">Deliveries</span><span class="field-val">${p.deliveries}</span></div>
    <div class="field"><span class="field-key">Partner CSAs</span><span class="field-val">${csas.length} (${active.length} active)</span></div>
    <div class="field"><span class="field-key">Open escalations</span><span class="field-val">${escs.filter((e) => e.status !== 'resolved').length}</span></div>
    <div class="field"><span class="field-key">Utilization</span><span class="field-val"><div class="row" style="gap:6px;justify-content:flex-end">${meter(util, COLORS.brand)}${util}%</div></span></div>
    <div class="section-title">DP onboarding</div>${checklist}`;
  openDrawer(`${esc(p.name)}`, body);
}
