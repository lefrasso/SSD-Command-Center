// Enablement — accreditations, S500 eligibility, SDM onboarding, Know Your POD Lead, user voice, shadowing.
import { store, hoursSince, requestShadow, respondShadowRequest, computeS500, s500FlaggedEngagements, myCsa, kyplSessionForCsa, scheduleKyplSession, completeKyplSession, evaluateKyplSession, daysFromNowISO } from '../store.js';
import { pageHeader, kpiCard, esc, badge, statusPill, openDrawer, closeDrawer, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { actionItemHtml } from '../actions.js';
import { PERSONAS, can } from '../roles.js';
import { PROGRAMS, TRACKS } from '../../data/generate.js';

const SDM_ONBOARD = ['Role & scope orientation', 'Escalation process training', 'ADO & Power BI access', 'Partner health dashboards', 'Shadow live escalations', 'Readiness sign-off'];
const SDMS = ['Priya Nair', 'Kenji Watanabe', 'Laura Bianchi', 'Mohammed Ali', 'Grace Park', 'Tomás Herrera'];
// The new Partner CSA's first structured session with their POD Lead — scheduled right after their
// Microsoft account is provisioned (Pre-boarding), ahead of tools & access setup.
const KYPL_AGENDA = [
  'Introductions — meet your POD Lead and teammates',
  'POD structure, roster and time zone coverage',
  'Communication cadence — 1:1s, POD stand-ups and Teams channels',
  'Delivery expectations, quality bar and the CPE Recommended Practices',
  'Escalation path — when and how to raise a delivery concern',
  'Career growth, coaching style and feedback cadence',
  'Tools & access walkthrough — SSD IQ, Compass, ADO, Power BI',
  'Open Q&A and next steps',
];

let tab = 'accred';
const userVoice = [
  { title: 'One-click MBR export to PowerPoint', votes: 42, status: 'Planned' },
  { title: 'Auto-suggest best-fit CSA on new demand', votes: 37, status: 'Shipped' },
  { title: 'Mobile view for POD Leads', votes: 28, status: 'Under review' },
  { title: 'Slack/Teams escalation alerts', votes: 21, status: 'Planned' },
];
const seedOf = (s) => [...s].reduce((a, ch) => a + ch.charCodeAt(0), 0);

export function renderEnablement(container, initialTab) {
  if (['accred', 'catalogue', 's500', 'sdm', 'kypl', 'uv', 'shadow'].includes(initialTab)) tab = initialTab;
  const tabs = [['accred', 'Accreditations'], ['catalogue', 'Service Catalogue'], ['s500', 'S500 Eligibility'], ['sdm', 'SDM Onboarding'], ['kypl', 'Know Your POD Lead'], ['uv', 'User Voice'], ['shadow', 'Shadowing']]
    .filter(([key]) => store.role !== 'adoption-lead' || key === 'accred' || key === 'shadow');
  if (!tabs.some(([key]) => key === tab)) tab = 'accred';
  container.innerHTML = `
    ${pageHeader({ title: 'Enablement', description: 'Enablement is positioned as a governed capability in SSD IQ: skills, readiness, quality, and shadowing all feed the people and delivery model.' })}
    <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
    <div id="tabc"></div>`;
  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderEnablement(container); }));
  const tc = container.querySelector('#tabc');
  ({ accred: renderAccred, catalogue: renderCatalogue, s500: renderS500, sdm: renderSdm, kypl: renderKypl, uv: renderUv, shadow: renderShadow })[tab](tc, container);
}

function renderAccred(tc) {
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const accCount = {};
  active.forEach((c) => (c.accreditations || []).forEach((s) => (accCount[s] = (accCount[s] || 0) + 1)));
  const top = Object.entries(accCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const totalPrograms = TRACKS.reduce((s, t) => s + (PROGRAMS[t] || []).length, 0);
  tc.innerHTML = `
    <div class="muted mb8" style="font-size:12px">Each Program (service / event) maps to one accreditation. Partner CSAs hold multiple accreditations and can deliver in any territory.</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Accredited CSAs', value: active.filter((c) => (c.accreditations || []).length).length, iconName: 'check', tone: COLORS.positive })}
      ${kpiCard({ label: 'Accreditations in catalogue', value: totalPrograms, iconName: 'star', hint: '= number of Programs' })}
      ${kpiCard({ label: 'Avg per CSA', value: active.length ? Math.round(active.reduce((s, c) => s + (c.accreditations || []).length, 0) / active.length) : 0, iconName: 'people' })}
    </div>
    <div class="section-title">Top accreditations</div>
    <div class="row wrap mb16" style="gap:6px">${top.map(([s, n]) => `<span class="badge tint-info">${esc(s)} · ${n}</span>`).join('')}</div>
    <div class="section-title">CSA accreditations & languages</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>CSA</th><th>Vendor</th><th>Languages</th><th>Accreditations (Programs)</th></tr></thead><tbody>
      ${active.slice(0, 40).map((c) => `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.vendor)}</td><td>${(c.languages || []).map((l) => `<span class="badge outline" style="margin:1px">${esc(l)}</span>`).join('')}</td><td>${(c.accreditations || []).map((s) => `<span class="badge outline" style="margin:1px">${esc(s)}</span>`).join('')}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function renderCatalogue(tc) {
  const d = store.data;
  const active = d.csas.filter((c) => c.lifecycle === 'active');
  const accredited = (program) => active.filter((c) => (c.accreditations || []).includes(program)).length;
  const totalPrograms = TRACKS.reduce((s, t) => s + (PROGRAMS[t] || []).length, 0);
  tc.innerHTML = `
    <div class="muted mb8" style="font-size:12px">The catalogue of services. Track = Family of services; Program = the service / event. Each Program requires its own accreditation to deliver.</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Families', value: TRACKS.length, iconName: 'grid' })}
      ${kpiCard({ label: 'Programs', value: totalPrograms, iconName: 'star' })}
      ${kpiCard({ label: 'Accreditations', value: totalPrograms, iconName: 'check', hint: '1 per Program' })}
    </div>
    ${TRACKS.map((t) => `
      <div class="section-title">${esc(t)}</div>
      <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Program</th><th>Accreditation</th><th>Accredited CSAs</th></tr></thead><tbody>
        ${(PROGRAMS[t] || []).map((p) => `<tr><td><strong>${esc(p)}</strong></td><td class="muted" style="font-size:12px">${esc(p)} Accreditation</td><td>${accredited(p)}</td></tr>`).join('')}
      </tbody></table></div>`).join('')}`;
}

function renderS500(tc) {
  const d = store.data;
  const rows = computeS500(d);
  const eligibleCount = rows.filter((r) => r.eligible).length;
  const readyCount = rows.filter((r) => r.ready).length;
  const unreconciled = rows.filter((r) => !r.reconciled);
  const flagged = s500FlaggedEngagements(d);
  const partnerName = (id) => (d.partners.find((p) => p.id === id) || {}).name || '—';
  tc.innerHTML = `
    <div class="kpi-grid">
      ${kpiCard({ label: 'S500 eligible', value: eligibleCount, iconName: 'check', tone: COLORS.positive })}
      ${kpiCard({ label: 'S500 ready (reconciled)', value: readyCount, iconName: 'check', tone: COLORS.positive, hint: 'marked ready, e.g. in SharePoint' })}
      ${kpiCard({ label: 'Readiness rate', value: (rows.length ? Math.round((readyCount / rows.length) * 100) : 0) + '%', iconName: 'trending' })}
      ${kpiCard({ label: 'Not reconciled', value: unreconciled.length, iconName: 'warning', tone: unreconciled.length ? COLORS.warning : COLORS.neutral, hint: 'ready flag ≠ eligibility' })}
      ${kpiCard({ label: 'S500 cx by non-ready CSA', value: flagged.length, iconName: 'warning', tone: flagged.length ? COLORS.negative : COLORS.neutral, hint: 'target: 0' })}
    </div>
    <div class="muted mb8" style="font-size:12px">Eligibility: CPE ≥ 4.4, quality ≥ 4.4 and tenure ≥ 6 months. Readiness is marked independently and reconciled against eligibility — a mismatch is a governance flag.</div>
    ${flagged.length ? `<div class="card pad mb16" style="border-left:4px solid ${COLORS.negative}"><strong style="font-size:13px">S500 customers served by a non-ready CSA</strong><div class="table-wrap mt8"><table class="grid"><thead><tr><th>Customer</th><th>Program</th><th>CSA</th><th>Partner</th></tr></thead><tbody>
      ${flagged.map((e) => { const csa = d.csas.find((c) => c.id === e.assignedTo); return `<tr><td><strong>${esc(e.customer)}</strong></td><td>${esc(e.program)}</td><td>${esc(csa ? csa.name : '—')}</td><td>${esc(csa ? partnerName(csa.partnerId) : '—')}</td></tr>`; }).join('')}
    </tbody></table></div></div>` : ''}
    <div class="table-wrap"><table class="grid"><thead><tr><th>CSA</th><th>Vendor</th><th>CPE</th><th>Quality</th><th>Tenure</th><th>Eligible</th><th>Ready</th><th>Reconciled</th><th>Reason</th></tr></thead><tbody>
      ${rows.slice(0, 50).map((r) => `<tr><td><strong>${esc(r.csa.name)}</strong></td><td>${esc(r.csa.vendor)}</td><td>${r.csa.cpe.toFixed(1)}</td><td>${r.csa.quality.toFixed(1)}</td><td>${r.csa.tenureMonths}mo</td><td>${r.eligible ? badge('Eligible', 'tint-info') : badge('No', 'outline')}</td><td>${r.ready ? badge('Ready', 'tint-info') : badge('Not ready', 'outline')}</td><td>${r.reconciled ? badge('Yes', 'tint-info') : badge('Gap', 'tint-warn')}</td><td class="muted" style="font-size:12px">${esc(r.reason)}</td></tr>`).join('')}
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

function kyplStatusBadge(status) {
  if (status === 'completed') return badge('Completed', 'tint-info');
  if (status === 'scheduled') return badge('Scheduled', 'tint-warn');
  return badge('Not scheduled', 'outline');
}

function kyplReadinessBadge(readiness) {
  if (readiness === 'ready') return badge('Ready', 'tint-info');
  if (readiness === 'needs-support') return badge('Needs support', 'tint-warn');
  return badge('At risk', 'tint-danger');
}
function kyplReadinessLabel(readiness) {
  if (readiness === 'ready') return 'Ready for unsupervised delivery';
  if (readiness === 'needs-support') return 'Needs more support / shadowing';
  return 'At risk — needs intervention';
}

function renderKypl(tc, container) {
  const d = store.data;
  const mentees = d.csas.filter((c) => c.resourceType === 'FTC' && c.lifecycle === 'onboarding');
  const statusOf = (c) => (kyplSessionForCsa(c.id, d) || { status: 'not-scheduled' }).status;
  const scheduled = mentees.filter((c) => statusOf(c) === 'scheduled').length;
  const completed = mentees.filter((c) => statusOf(c) === 'completed').length;
  tc.innerHTML = `
    <div class="muted mb8" style="font-size:12px">The Know Your POD Lead (KYPL) session is the new Partner CSA's first structured meeting with their POD Lead — scheduled right after their Microsoft account is provisioned, before tools &amp; access setup.</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Partner CSAs onboarding', value: mentees.length, iconName: 'personAdd' })}
      ${kpiCard({ label: 'KYPL scheduled', value: scheduled, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'KYPL completed', value: completed, iconName: 'check', tone: COLORS.positive })}
    </div>
    <div class="section-title">Onboarding Partner CSAs</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Partner CSA</th><th>Vendor</th><th>POD Lead</th><th>Status</th><th>Session date</th><th>Evaluation</th><th></th></tr></thead><tbody>
      ${mentees.length ? mentees.map((c) => {
        const pod = d.pods.find((p) => p.id === c.podId);
        const session = kyplSessionForCsa(c.id, d);
        const status = session ? session.status : 'not-scheduled';
        const dateLabel = status === 'completed' ? (session.completedAt || '—') : status === 'scheduled' ? (session.scheduledAt || '—') : '—';
        const evalBadge = session && session.evaluation ? kyplReadinessBadge(session.evaluation.readiness) : status === 'completed' ? badge('Not evaluated', 'outline') : '—';
        const btnLabel = status === 'not-scheduled' ? 'Schedule' : status === 'scheduled' ? 'Manage' : (session && session.evaluation) ? 'View' : can(store.role, 'edit:kyplEvaluation') ? 'Evaluate' : 'View';
        return `<tr>
          <td><strong>${esc(c.name)}</strong></td>
          <td>${esc(c.vendor)}</td>
          <td>${esc(pod ? pod.leadName : '—')}</td>
          <td>${kyplStatusBadge(status)}</td>
          <td>${esc(dateLabel)}</td>
          <td>${evalBadge}</td>
          <td><button class="btn sm" data-kypl="${c.id}">${btnLabel}</button></td>
        </tr>`;
      }).join('') : '<tr><td colspan="7" class="muted" style="padding:16px">No Partner CSAs currently in onboarding.</td></tr>'}
    </tbody></table></div>
    <div class="section-title">Session agenda</div>
    <div class="card pad">${KYPL_AGENDA.map((t) => `<div class="check-item"><span class="check-box"></span><span>${esc(t)}</span></div>`).join('')}</div>`;
  tc.querySelectorAll('[data-kypl]').forEach((b) => b.addEventListener('click', () => openKyplDrawer(b.getAttribute('data-kypl'), tc, container)));
}

function openKyplDrawer(csaId, tc, container) {
  const d = store.data;
  const c = d.csas.find((x) => x.id === csaId);
  if (!c) return;
  const pod = d.pods.find((p) => p.id === c.podId);
  const session = kyplSessionForCsa(csaId, d);
  const status = session ? session.status : 'not-scheduled';
  const canEvaluate = can(store.role, 'edit:kyplEvaluation');
  const linkedAction = session && session.evaluation && session.evaluation.actionId ? d.actions.find((a) => a.id === session.evaluation.actionId) : null;

  const evaluationSection = status !== 'completed' ? '' : session.evaluation ? `
    <div class="section-title">PCSA evaluation</div>
    <div class="card pad mb16" style="background:var(--bg-2)">
      <div class="row wrap mb8" style="justify-content:space-between;gap:8px">
        <div class="row" style="gap:6px">${kyplReadinessBadge(session.evaluation.readiness)}<strong>${session.evaluation.rating}/5</strong></div>
        <span class="muted" style="font-size:12px">${esc(session.evaluation.evaluatedBy)} · ${esc(session.evaluation.evaluatedAt.slice(0, 10))}</span>
      </div>
      <div style="font-size:13px;margin-bottom:6px">${esc(kyplReadinessLabel(session.evaluation.readiness))}</div>
      ${session.evaluation.strengths ? `<div class="field"><span class="field-key">Strengths</span><span class="field-val">${esc(session.evaluation.strengths)}</span></div>` : ''}
      ${session.evaluation.concerns ? `<div class="field"><span class="field-key">Concerns</span><span class="field-val">${esc(session.evaluation.concerns)}</span></div>` : ''}
      ${linkedAction ? `<div class="mt8">${actionItemHtml(linkedAction)}</div>` : ''}
    </div>` : canEvaluate ? `
    <div class="section-title">Evaluate Partner CSA</div>
    <label class="muted" style="font-size:12px">Overall rating</label>
    <select class="select" id="kypl-eval-rating" style="width:100%;margin-bottom:10px">
      <option value="5">5 — Excellent first impression</option>
      <option value="4">4 — Strong</option>
      <option value="3" selected>3 — Solid, some follow-up needed</option>
      <option value="2">2 — Concerns raised</option>
      <option value="1">1 — Significant concerns</option>
    </select>
    <label class="muted" style="font-size:12px">Readiness call</label>
    <select class="select" id="kypl-eval-readiness" style="width:100%;margin-bottom:10px">
      <option value="ready">Ready for unsupervised delivery</option>
      <option value="needs-support" selected>Needs more support / shadowing</option>
      <option value="not-ready">At risk — needs intervention</option>
    </select>
    <label class="muted" style="font-size:12px">Strengths (optional)</label>
    <textarea id="kypl-eval-strengths" style="width:100%;min-height:50px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="What stood out positively?"></textarea>
    <label class="muted" style="font-size:12px">Concerns / follow-up needed (optional)</label>
    <textarea id="kypl-eval-concerns" style="width:100%;min-height:50px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="Anything that needs follow-up?"></textarea>
    <label class="row" style="gap:6px;font-size:13px;margin:4px 0 10px"><input type="checkbox" id="kypl-eval-assign"/> Assign a follow-up activity to the SDM</label>
    <div id="kypl-eval-assign-fields" hidden>
      <label class="muted" style="font-size:12px">SDM</label>
      <select class="select" id="kypl-eval-sdm" style="width:100%;margin-bottom:10px">${SDMS.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
      <label class="muted" style="font-size:12px">Activity</label>
      <textarea id="kypl-eval-activity" style="width:100%;min-height:50px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="e.g. Check in on ${esc(c.name)}'s ramp-up in 2 weeks.">${esc(`Follow up on ${c.name}'s KYPL evaluation`)}</textarea>
      <label class="muted" style="font-size:12px">Due date</label>
      <input class="input" type="date" id="kypl-eval-due" style="width:100%;margin-bottom:10px" value="${daysFromNowISO(7)}"/>
    </div>
    <button class="btn sm primary" id="kypl-eval-submit">${icon('check', 14)} Save evaluation</button>
    <div id="kypl-eval-error"></div>` : '<div class="muted" style="font-size:12px">Awaiting POD Lead evaluation.</div>';

  const body = `
    <div class="field"><span class="field-key">Partner CSA</span><span class="field-val">${esc(c.name)}</span></div>
    <div class="field"><span class="field-key">Vendor</span><span class="field-val">${esc(c.vendor)}</span></div>
    <div class="field"><span class="field-key">POD Lead</span><span class="field-val">${esc(pod ? pod.leadName : '—')}</span></div>
    <div class="field"><span class="field-key">Status</span><span class="field-val">${kyplStatusBadge(status)}</span></div>
    <div class="section-title">Agenda</div>
    <div class="card pad mb16">${KYPL_AGENDA.map((t) => `<div class="check-item"><span class="check-box"></span><span>${esc(t)}</span></div>`).join('')}</div>
    ${status !== 'completed' ? `
    <label class="muted" style="font-size:12px">Session date</label>
    <input class="input" type="date" id="kypl-date" style="width:100%;margin-bottom:10px" value="${esc(session && session.scheduledAt ? session.scheduledAt : '')}"/>
    <label class="muted" style="font-size:12px">Notes (optional)</label>
    <textarea id="kypl-notes" style="width:100%;min-height:70px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="Anything specific to cover…">${esc(session ? session.notes : '')}</textarea>
    <div class="row wrap" style="gap:6px">
      <button class="btn sm primary" id="kypl-schedule">${icon('clock', 14)} ${status === 'scheduled' ? 'Update schedule' : 'Schedule session'}</button>
      ${status === 'scheduled' ? `<button class="btn sm" id="kypl-complete">${icon('check', 14)} Mark completed</button>` : ''}
    </div>
    <div id="kypl-error"></div>` : `<div class="muted" style="font-size:12px">Completed on ${esc(session.completedAt)}.</div>`}
    ${evaluationSection}`;

  openDrawer(`Know Your POD Lead · ${esc(c.name)}`, body, (dr) => {
    const scheduleBtn = dr.querySelector('#kypl-schedule');
    if (scheduleBtn) scheduleBtn.addEventListener('click', () => {
      try {
        scheduleKyplSession({ csaId, scheduledAt: dr.querySelector('#kypl-date').value, notes: dr.querySelector('#kypl-notes').value });
        closeDrawer();
        renderKypl(tc, container);
      } catch (err) {
        dr.querySelector('#kypl-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
      }
    });
    const completeBtn = dr.querySelector('#kypl-complete');
    if (completeBtn) completeBtn.addEventListener('click', () => {
      completeKyplSession(csaId, dr.querySelector('#kypl-notes').value);
      closeDrawer();
      renderKypl(tc, container);
    });
    const assignToggle = dr.querySelector('#kypl-eval-assign');
    if (assignToggle) assignToggle.addEventListener('change', () => { dr.querySelector('#kypl-eval-assign-fields').hidden = !assignToggle.checked; });
    const evalBtn = dr.querySelector('#kypl-eval-submit');
    if (evalBtn) evalBtn.addEventListener('click', () => {
      try {
        const assignActivity = dr.querySelector('#kypl-eval-assign').checked;
        evaluateKyplSession(csaId, {
          rating: dr.querySelector('#kypl-eval-rating').value,
          readiness: dr.querySelector('#kypl-eval-readiness').value,
          strengths: dr.querySelector('#kypl-eval-strengths').value,
          concerns: dr.querySelector('#kypl-eval-concerns').value,
          assignActivity,
          sdmName: assignActivity ? dr.querySelector('#kypl-eval-sdm').value : '',
          activityTitle: assignActivity ? dr.querySelector('#kypl-eval-activity').value : '',
          due: assignActivity ? dr.querySelector('#kypl-eval-due').value : '',
          evaluatedBy: PERSONAS[store.role].name,
        });
        openKyplDrawer(csaId, tc, container);
      } catch (err) {
        dr.querySelector('#kypl-eval-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
      }
    });
  });
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

let selRequester = null;
const daysUntil = (dateStr) => Math.round(-hoursSince(`${dateStr}T00:00:00Z`) / 24);

function renderShadow(tc, container) {
  const d = store.data;
  const mentees = d.csas.filter((c) => c.lifecycle === 'onboarding' || c.lifecycle === 'selection' || c.lifecycle === 'sourcing');
  if (!selRequester || !mentees.find((m) => m.id === selRequester)) selRequester = mentees[0] && mentees[0].id;

  const upcoming = d.engagements
    .filter((e) => e.assignedTo && (e.status === 'assigned' || e.status === 'in-delivery') && daysUntil(e.dueDate) >= 0 && daysUntil(e.dueDate) <= 21)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));

  const myRequests = d.shadowRequests.filter((s) => s.requesterId === selRequester);
  const requestedIds = new Set(myRequests.filter((s) => s.status !== 'declined').map((s) => s.engagementId));
  const my = myCsa(store.role, d);
  const pending = d.shadowRequests.filter((s) => s.status === 'requested' && (!my || s.ownerId === my.id));

  tc.innerHTML = `
    <div class="muted mb8" style="font-size:12px">Shadowing lets a CSA observe a live delivery — listen-only — before taking on similar work. Requests are sent to the delivery's assigned CSA for confirmation, and a confirmed request marks the engagement.</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Available deliveries (3 wks)', value: upcoming.length, iconName: 'send' })}
      ${kpiCard({ label: 'Requests pending', value: pending.length, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'Confirmed', value: d.shadowRequests.filter((s) => s.status === 'confirmed').length, iconName: 'check', tone: COLORS.positive })}
    </div>

    <div class="row mb16" style="gap:8px"><strong>Requesting to shadow as</strong><select class="select" id="sel-requester">${mentees.map((m) => `<option value="${m.id}" ${m.id === selRequester ? 'selected' : ''}>${esc(m.name)} · ${esc(m.vendor)}</option>`).join('')}</select></div>

    <div class="section-title">Available deliveries to shadow — next 3 weeks</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Customer</th><th>Family / Program</th><th>Delivery resource</th><th>Due</th><th></th></tr></thead><tbody>
      ${upcoming.length ? upcoming.map((e) => {
        const owner = d.csas.find((c) => c.id === e.assignedTo);
        return `<tr><td><strong>${esc(e.customer)}</strong></td><td>${esc(e.track)} · ${esc(e.program)}</td><td>${esc(owner ? owner.name : '—')}</td><td>${esc(e.dueDate)} <span class="muted" style="font-size:11px">(${daysUntil(e.dueDate)}d)</span></td><td>${requestedIds.has(e.id) ? badge('Already requested', 'outline') : `<button class="btn sm" data-shadow-req="${e.id}">Request to shadow</button>`}</td></tr>`;
      }).join('') : '<tr><td colspan="5" class="muted" style="padding:16px">No deliveries are due to complete in the next 3 weeks.</td></tr>'}
    </tbody></table></div>

    <div class="section-title">My shadow requests</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Customer</th><th>Delivery resource</th><th>Requested</th><th>Status</th></tr></thead><tbody>
      ${myRequests.length ? myRequests.map((s) => {
        const eng = d.engagements.find((e) => e.id === s.engagementId);
        const owner = d.csas.find((c) => c.id === s.ownerId);
        return `<tr><td><strong>${esc(eng ? eng.customer : s.engagementId)}</strong></td><td>${esc(owner ? owner.name : '—')}</td><td>${esc(s.requestedAt)}</td><td>${statusPill(s.status)}</td></tr>`;
      }).join('') : '<tr><td colspan="4" class="muted" style="padding:16px">No shadow requests yet.</td></tr>'}
    </tbody></table></div>

    <div class="section-title">Requests awaiting the delivery resource's response${my ? ` (${esc(my.name)})` : ''}</div>
    <div class="table-wrap"><table class="grid"><thead><tr><th>Requester</th><th>Customer</th><th>Delivery resource</th><th>Note</th><th></th></tr></thead><tbody>
      ${pending.length ? pending.map((s) => {
        const requester = d.csas.find((c) => c.id === s.requesterId);
        const eng = d.engagements.find((e) => e.id === s.engagementId);
        const owner = d.csas.find((c) => c.id === s.ownerId);
        return `<tr><td><strong>${esc(requester ? requester.name : s.requesterId)}</strong></td><td>${esc(eng ? eng.customer : s.engagementId)}</td><td>${esc(owner ? owner.name : '—')}</td><td class="muted" style="font-size:12px">${esc(s.note)}</td><td class="row" style="gap:6px"><button class="btn sm" data-shadow-confirm="${s.id}">Confirm</button><button class="btn sm subtle" data-shadow-decline="${s.id}">Decline</button></td></tr>`;
      }).join('') : '<tr><td colspan="5" class="muted" style="padding:16px">No pending shadow requests.</td></tr>'}
    </tbody></table></div>`;

  tc.querySelector('#sel-requester').addEventListener('change', (ev) => { selRequester = ev.target.value; renderShadow(tc, container); });
  tc.querySelectorAll('[data-shadow-req]').forEach((b) => b.addEventListener('click', () => openShadowRequest(b.getAttribute('data-shadow-req'), tc, container)));
  tc.querySelectorAll('[data-shadow-confirm]').forEach((b) => b.addEventListener('click', () => { respondShadowRequest(b.getAttribute('data-shadow-confirm'), 'confirmed'); renderShadow(tc, container); }));
  tc.querySelectorAll('[data-shadow-decline]').forEach((b) => b.addEventListener('click', () => { respondShadowRequest(b.getAttribute('data-shadow-decline'), 'declined'); renderShadow(tc, container); }));
}

function openShadowRequest(engagementId, tc, container) {
  const d = store.data;
  const eng = d.engagements.find((e) => e.id === engagementId);
  const owner = d.csas.find((c) => c.id === (eng && eng.assignedTo));
  const body = `
    <div class="field"><span class="field-key">Customer</span><span class="field-val">${esc(eng.customer)}</span></div>
    <div class="field"><span class="field-key">Family / Program</span><span class="field-val">${esc(eng.track)} · ${esc(eng.program)}</span></div>
    <div class="field"><span class="field-key">Delivery resource</span><span class="field-val">${esc(owner ? owner.name : '—')}</span></div>
    <div class="field"><span class="field-key">Due</span><span class="field-val">${esc(eng.dueDate)}</span></div>
    <label class="muted" style="font-size:12px;display:block;margin-top:10px">Message to the delivery resource</label>
    <textarea id="shd-note" style="width:100%;min-height:80px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin-bottom:10px" placeholder="Why would you like to shadow this delivery?"></textarea>
    <button class="btn primary" id="shd-send">Request permission to shadow</button>
    <div id="shd-error"></div>`;
  openDrawer(`Request to shadow · ${esc(eng.customer)}`, body, (dr) => {
    dr.querySelector('#shd-send').addEventListener('click', () => {
      try {
        requestShadow({ engagementId, requesterId: selRequester, note: dr.querySelector('#shd-note').value });
        closeDrawer();
        renderShadow(tc, container);
      } catch (err) {
        dr.querySelector('#shd-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
      }
    });
  });
}
