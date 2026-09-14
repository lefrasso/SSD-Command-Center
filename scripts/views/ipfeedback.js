// IP Feedback — submit content issues on the Delivery Guide/IP Kits to the IP Leads and track the
// agentic triage live. Replaces the manual "POD - IP Feedback" tracking process with a self-service
// panel: five simulated agents validate, scope, draft and triage every submission before an IP Lead
// confirms, rejects or postpones the change.
import {
  store, ipFeedbackMine, addIpFeedbackCase, decideIpFeedback, progressIpFeedbackWork,
} from '../store.js';
import { pageHeader, kpiCard, badge, statusPill, aiChip, esc, openDrawer, closeDrawer, kanban, COLORS, emptyState } from '../components.js';
import { icon } from '../icons.js';
import { PERSONAS, can } from '../roles.js';
import { PROGRAMS } from '../../data/generate.js';
import { AGENTS } from '../ipFeedbackAgents.js';

const KAN_COLS = [['backlog', 'Backlog — awaiting you'], ['confirmed', 'Confirmed'], ['in-progress', 'In progress'], ['done', 'Done']];
const CLOSED_STATUSES = ['resolved-by-guide', 'rejected', 'postponed'];

function priorityBadge(p) {
  if (!p) return '';
  return badge(p, p === 'P1' ? 'tint-danger' : p === 'P2' ? 'tint-warn' : 'outline');
}
function programOptions() {
  return Object.entries(PROGRAMS).map(([track, programs]) => `<optgroup label="${esc(track)}">${programs.map((p) => `<option value="${esc(p)}" data-track="${esc(track)}">${esc(p)}</option>`).join('')}</optgroup>`).join('');
}
function submitterLabel(c) {
  const p = PERSONAS[c.submittedByRole];
  return p ? `${esc(c.submittedByName)} · ${esc(p.title)}` : esc(c.submittedByName);
}

export function renderIpFeedback(container) {
  const d = store.data;
  const persona = PERSONAS[store.role];
  const isIpLead = can(store.role, 'decide:ipFeedback');
  const mine = ipFeedbackMine(persona.name, d);
  const scope = isIpLead ? d.ipFeedbackCases : mine;
  const autoResolved = scope.filter((c) => c.status === 'resolved-by-guide').length;
  const awaiting = scope.filter((c) => ['backlog', 'postponed'].includes(c.status)).length;
  const active = scope.filter((c) => ['confirmed', 'in-progress'].includes(c.status)).length;
  const done = scope.filter((c) => c.status === 'done').length;

  container.innerHTML = `
    ${pageHeader({
      title: 'IP Feedback', description: 'Flag an issue with the Delivery Guide or an IP Kit — a simulated 5-agent pipeline validates, scopes and drafts a fix before the IP Lead confirms, rejects or postpones it.',
      actions: aiChip('5-agent pipeline'),
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: isIpLead ? 'All submissions' : 'My submissions', value: scope.length, iconName: 'docSearch', tone: COLORS.brand })}
      ${kpiCard({ label: 'Auto-resolved by Guide Sentinel', value: autoResolved, iconName: 'check', tone: COLORS.positive, hint: 'already answered by the guide' })}
      ${kpiCard({ label: isIpLead ? 'Awaiting your decision' : 'Awaiting IP Lead', value: awaiting, iconName: 'clock', tone: COLORS.warning })}
      ${kpiCard({ label: 'Confirmed & in progress', value: active, iconName: 'wrench', hint: `${done} completed` })}
    </div>

    <div class="two-col">
      <div class="card pad">
        <div class="section-title">Submit feedback</div>
        <label class="muted" style="font-size:12px">Program / IP Kit</label>
        <select class="select" id="cfb-program" style="width:100%;margin-bottom:10px">${programOptions()}</select>
        <label class="muted" style="font-size:12px">Title</label>
        <input class="input" id="cfb-title" style="width:100%;margin-bottom:10px" placeholder="Short summary — e.g. “Migration Runbook rollback steps are outdated”"/>
        <label class="muted" style="font-size:12px">What's the issue?</label>
        <textarea id="cfb-desc" style="width:100%;min-height:90px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="Describe what's wrong, outdated or missing — be specific, the agents read this text."></textarea>
        <label class="muted" style="font-size:12px">Propose a change (optional)</label>
        <textarea id="cfb-proposed" style="width:100%;min-height:70px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin:6px 0 10px" placeholder="If you already know the fix, draft it here — Content Sage will validate it."></textarea>
        <button class="btn primary" id="cfb-submit">${icon('sparkle', 14)} Submit &amp; run agents</button>
        <div id="cfb-error"></div>
      </div>
      <div class="card pad">
        <div class="row mb8">${icon('sparkle', 16)}<strong>How the agents work</strong>${aiChip()}</div>
        <div style="font-size:13px;line-height:1.5;margin-bottom:10px">Every submission runs through the same pipeline, in order. If Guide Sentinel finds the answer already exists, the case closes immediately — nothing else runs.</div>
        ${AGENTS.map((a, i) => `<div class="check-item" style="align-items:flex-start">
          <span class="check-box done" style="background:${COLORS.brand};border-color:${COLORS.brand}">${i + 1}</span>
          <span><strong>${icon(a.icon, 14)} ${esc(a.name)}</strong> <span class="muted">· ${esc(a.role)}</span><div class="muted" style="font-size:12px">${esc(a.blurb)}</div></span>
        </div>`).join('')}
      </div>
    </div>

    ${isIpLead ? `
    <div class="section-title">IP Feedback Backlog</div>
    ${kanban(KAN_COLS.map(([status, title]) => {
      const items = d.ipFeedbackCases.filter((c) => c.status === status);
      return {
        title, count: items.length,
        cards: items.map((c) => `<div class="kan-card" data-id="${c.id}">
          <div class="row" style="justify-content:space-between">${priorityBadge(c.priority)}${c.category ? badge(c.category, 'outline') : ''}</div>
          <div class="kc-title mt8">${esc(c.title)}</div>
          <div class="kc-meta">${esc(c.program)}</div>
          <div class="kc-foot"><span class="muted" style="font-size:11px">${esc(c.submittedByName)}</span></div>
        </div>`),
      };
    }))}
    ${(() => {
      const closed = d.ipFeedbackCases.filter((c) => CLOSED_STATUSES.includes(c.status));
      if (!closed.length) return '';
      return `<div class="section-title">Resolved automatically / closed</div>
      <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Title</th><th>Program</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
        ${closed.map((c) => `<tr><td><strong>${esc(c.title)}</strong></td><td>${esc(c.program)}</td><td>${statusPill(c.status)}</td><td>${esc(c.updatedAt.slice(0, 10))}</td><td><button class="btn sm subtle" data-view-cfb="${c.id}">View</button></td></tr>`).join('')}
      </tbody></table></div>`;
    })()}` : ''}

    <div class="section-title">${isIpLead ? 'All submissions' : 'My submissions'}</div>
    ${scope.length ? `<div class="table-wrap"><table class="grid"><thead><tr>${isIpLead ? '<th>Submitted by</th>' : ''}<th>Title</th><th>Program</th><th>Category</th><th>Priority</th><th>Status</th><th>Submitted</th><th></th></tr></thead><tbody>
      ${[...scope].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((c) => `<tr>
        ${isIpLead ? `<td>${submitterLabel(c)}</td>` : ''}
        <td><strong>${esc(c.title)}</strong></td>
        <td>${esc(c.program)}</td>
        <td>${c.category ? badge(c.category, 'outline') : '—'}</td>
        <td>${priorityBadge(c.priority) || '—'}</td>
        <td>${statusPill(c.status)}</td>
        <td>${esc(c.createdAt.slice(0, 10))}</td>
        <td><button class="btn sm subtle" data-view-cfb="${c.id}">View</button></td>
      </tr>`).join('')}
    </tbody></table></div>` : emptyState({ title: 'No feedback yet', description: isIpLead ? 'Nothing has been submitted to the backlog yet.' : 'Submit your first piece of feedback above — the agents run immediately.' })}`;

  container.querySelector('#cfb-submit').addEventListener('click', () => {
    const select = container.querySelector('#cfb-program');
    const opt = select.selectedOptions[0];
    try {
      const id = addIpFeedbackCase({
        title: container.querySelector('#cfb-title').value,
        description: container.querySelector('#cfb-desc').value,
        proposedChange: container.querySelector('#cfb-proposed').value,
        program: select.value,
        track: opt ? opt.getAttribute('data-track') : null,
        submittedByName: persona.name,
        submittedByRole: store.role,
      });
      openCaseDrawer(id, container);
    } catch (err) {
      container.querySelector('#cfb-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
    }
  });

  container.querySelectorAll('.kan-card[data-id]').forEach((el) => el.addEventListener('click', () => openCaseDrawer(el.getAttribute('data-id'), container)));
  container.querySelectorAll('[data-view-cfb]').forEach((b) => b.addEventListener('click', () => openCaseDrawer(b.getAttribute('data-view-cfb'), container)));
}

function agentTimeline(c) {
  if (!c.agentSteps.length) return '<div class="muted">The pipeline has not run yet.</div>';
  return `<div class="timeline">${c.agentSteps.map((s) => {
    const agentDef = AGENTS.find((a) => a.name === s.agent);
    return `<div class="tl-item">
      <div><strong>${agentDef ? icon(agentDef.icon, 14) : ''} ${esc(s.agent)}</strong> <span class="muted">· ${esc(s.role)}</span> ${s.status === 'skipped' ? badge('Skipped', 'outline') : badge('Complete', 'tint-info')}</div>
      <div style="font-size:13px;margin:2px 0">${esc(s.summary)}</div>
      <div class="tl-date">${esc(new Date(s.at).toLocaleString())}</div>
    </div>`;
  }).join('')}</div>`;
}

function openCaseDrawer(id, container) {
  const d = store.data;
  const c = d.ipFeedbackCases.find((x) => x.id === id);
  if (!c) return;
  const isIpLead = can(store.role, 'decide:ipFeedback');
  const persona = PERSONAS[store.role];

  const body = `
    <div class="row wrap mb8" style="gap:8px">${statusPill(c.status)}${priorityBadge(c.priority)}${c.category ? badge(c.category, 'outline') : ''}${c.assignedIpLead ? badge(`Owner: ${c.assignedIpLead}`, 'tint-info') : ''}</div>
    <div class="field"><span class="field-key">Program / Kit</span><span class="field-val">${esc(c.program)}${c.track ? ` · ${esc(c.track)}` : ''}</span></div>
    <div class="field"><span class="field-key">Submitted by</span><span class="field-val">${submitterLabel(c)}</span></div>
    <div class="field"><span class="field-key">Submitted</span><span class="field-val">${esc(c.createdAt.slice(0, 10))}</span></div>
    <div class="field"><span class="field-key">Description</span><span class="field-val">${esc(c.description)}</span></div>
    ${c.proposedChange ? `<div class="field"><span class="field-key">Proposed change</span><span class="field-val">${esc(c.proposedChange)}</span></div>` : ''}

    ${c.status === 'resolved-by-guide' && c.guideResolution ? `
      <div class="section-title">Delivery Guide response</div>
      <div class="card pad" style="background:var(--bg-2)">
        <div class="row mb8">${icon('docSearch', 16)}<strong>${esc(c.guideResolution.section)}</strong></div>
        <div style="font-size:13px">${esc(c.guideResolution.answer)}</div>
      </div>` : ''}

    ${c.ipLeadDecision ? `
      <div class="section-title">IP Lead response</div>
      <div class="card pad" style="background:var(--bg-2)">
        <div class="row mb8" style="gap:8px">${badge(c.ipLeadDecision.decision, c.ipLeadDecision.decision === 'confirmed' ? 'tint-info' : c.ipLeadDecision.decision === 'rejected' ? 'tint-danger' : 'tint-warn')}<span class="muted" style="font-size:12px">${esc(c.ipLeadDecision.by)} · ${esc(new Date(c.ipLeadDecision.at).toLocaleString())}</span></div>
        ${c.ipLeadDecision.note ? `<div style="font-size:13px">${esc(c.ipLeadDecision.note)}</div>` : ''}
      </div>` : ''}

    <div class="section-title">Agent pipeline${aiChip()}</div>
    ${agentTimeline(c)}

    ${isIpLead && ['backlog', 'postponed'].includes(c.status) ? `
      <div class="section-title">Your decision</div>
      <textarea id="cfb-note" style="width:100%;min-height:60px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin-bottom:10px" placeholder="Optional note back to the submitter…"></textarea>
      <div class="row wrap" style="gap:6px">
        <button class="btn sm primary" data-decide="confirmed">${icon('check', 14)} Confirm change</button>
        <button class="btn sm" data-decide="postponed">${icon('clock', 14)} Postpone</button>
        <button class="btn sm subtle" data-decide="rejected">${icon('x', 14)} Reject</button>
      </div>` : ''}
    ${isIpLead && c.status === 'confirmed' ? `<div class="section-title">Work</div><button class="btn sm primary" id="cfb-start">${icon('wrench', 14)} Start work</button>` : ''}
    ${isIpLead && c.status === 'in-progress' ? `<div class="section-title">Work</div><button class="btn sm primary" id="cfb-done">${icon('check', 14)} Mark done</button>` : ''}
    <div id="cfb-drawer-error"></div>`;

  openDrawer(`IP Feedback · ${esc(c.id)}`, body, (dr) => {
    dr.querySelectorAll('[data-decide]').forEach((b) => b.addEventListener('click', () => {
      try {
        decideIpFeedback(c.id, b.getAttribute('data-decide'), { by: persona.name, note: dr.querySelector('#cfb-note').value });
        openCaseDrawer(c.id, container);
      } catch (err) {
        dr.querySelector('#cfb-drawer-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
      }
    }));
    const startBtn = dr.querySelector('#cfb-start');
    if (startBtn) startBtn.addEventListener('click', () => { progressIpFeedbackWork(c.id, 'in-progress'); openCaseDrawer(c.id, container); });
    const doneBtn = dr.querySelector('#cfb-done');
    if (doneBtn) doneBtn.addEventListener('click', () => { progressIpFeedbackWork(c.id, 'done'); openCaseDrawer(c.id, container); });
  });
}
