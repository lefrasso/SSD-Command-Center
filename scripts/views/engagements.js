// Engagements & Dispatch — dispatch board + engagement detail with AI dispatch.
import { store, assignEngagement, respondShadowRequest, myCsa, toggleOutreachDay, sendOutreachStep, sendAllRemainingSteps } from '../store.js';
import { pageHeader, badge, statusPill, aiChip, esc, kanban, openDrawer, closeDrawer, COLORS } from '../components.js';
import { icon } from '../icons.js';
import { recommendCSA, draftOutreach } from '../ai.js';
import { navigate } from '../router.js';
import { can, PERSONAS } from '../roles.js';
import { T3W_STEPS, t3wContacts, t3wDraft, nextStepIndex, isStepDue } from '../t3w.js';

const COLS = [['new', 'New'], ['assigned', 'Assigned'], ['in-delivery', 'In delivery'], ['complete', 'Complete']];
export const OUTREACH_DAYS = T3W_STEPS.map((s) => s.key);
function relativeTime(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function renderEngagements(container) {
  const d = store.data;
  const my = myCsa(store.role, d);
  const scoped = my ? d.engagements.filter((e) => e.assignedTo === my.id) : d.engagements;
  const columns = COLS.map(([status, title]) => {
    const engs = scoped.filter((e) => e.status === status);
    return {
      title, count: engs.length,
      cards: engs.slice(0, 40).map((e) => {
        const csa = d.csas.find((c) => c.id === e.assignedTo);
        const shadowConfirmed = d.shadowRequests.some((s) => s.engagementId === e.id && s.status === 'confirmed');
        return `<div class="kan-card" data-id="${e.id}">
          <div class="kc-title">${esc(e.customer)}${e.atRisk ? ` <span style="color:${COLORS.warning}">${icon('warning', 13)}</span>` : ''}</div>
          <div class="kc-meta">${esc(e.track)} · ${esc(e.program)}</div>
          <div class="kc-foot">${badge(e.dispatchStage, 'outline')}${csa ? `<span class="muted" style="font-size:11px">${esc(csa.name)}</span>` : badge('Unassigned', 'tint-warn')}${shadowConfirmed ? `<span class="badge tint-info" title="A shadow request is confirmed for this delivery">${icon('people', 12)} Shadow confirmed</span>` : ''}</div>
        </div>`;
      }),
    };
  });

  container.innerHTML = `
    ${pageHeader({ title: 'Engagements & Dispatch', description: my ? `Your assigned engagements only — as ${esc(my.name)}.` : 'Demand enters the platform as an engagement record, is governed in SSD IQ, and is routed through dispatch with human review and AI guidance.' })}
    ${kanban(columns)}`;

  container.querySelectorAll('.kan-card').forEach((el) => el.addEventListener('click', () => openEngagement(el.getAttribute('data-id'))));
}

export function openEngagement(id, { autoDraft = false } = {}) {
  const d = store.data;
  const e = d.engagements.find((x) => x.id === id);
  if (!e) return;
  const csa = d.csas.find((c) => c.id === e.assignedTo);
  const stories = d.successStories.filter((story) => story.engagementIds.includes(e.id));
  const shadowRequests = d.shadowRequests.filter((s) => s.engagementId === e.id);
  const my = myCsa(store.role, d);
  // The assigned CSA runs their own cadence; POD Lead/CSA Manager can act on any engagement.
  const canManageOutreach = (my && my.id === e.assignedTo) || can(store.role, 'edit:dispatch');
  const remaining = OUTREACH_DAYS.filter((k) => !e.outreach[k]);
  const nextIdx = nextStepIndex(e);
  const due = nextIdx >= 0 && isStepDue(e);
  const contacts = t3wContacts(e, d, csa ? csa.name : null);
  const roleName = { csam: contacts.csam, podLead: contacts.podLead, csamM1: contacts.csamM1, resourceManager: contacts.resourceManager };
  const steps = T3W_STEPS.map((s, i) => {
    const done = e.outreach[s.key];
    const isNext = i === nextIdx;
    const status = done ? 'Sent' : isNext ? (due ? 'Ready to send' : 'Waiting on response') : 'Not started';
    const tone = done ? 'tint-info' : isNext && due ? 'tint-warn' : 'outline';
    const cc = s.ccRoles.map((r) => roleName[r]).join(', ');
    const border = done ? COLORS.positive : isNext ? COLORS.warning : 'var(--border-2, #d8d8d8)';
    return `<div class="card pad mb8" style="border-left:3px solid ${border}">
      <div class="row wrap" style="justify-content:space-between;gap:6px">
        <strong>${esc(s.stage)} · ${esc(s.name)}</strong>
        ${canManageOutreach ? `<button class="badge ${tone}" data-outreach-day="${s.key}" style="cursor:pointer;border:none">${esc(status)}</button>` : `<span class="badge ${tone}">${esc(status)}</span>`}
      </div>
      <div class="muted mt4" style="font-size:12px">${esc(s.action)}</div>
      <div class="muted mt4" style="font-size:11px">To: ${esc(roleName[s.toRole])} · Cc: ${esc(cc)} · Advance when: ${esc(s.advanceWhen)}</div>
    </div>`;
  }).join('');
  const automation = !canManageOutreach ? '' : nextIdx < 0
    ? `<div class="muted mt8" style="font-size:12px">${icon('check', 12)} Full Day 0–3 cadence complete — engagement is fully engaged.</div>`
    : `<div class="row wrap mt8" style="gap:6px">
        <button class="btn sm" id="t3w-preview">${icon('sparkle', 14)} Draft ${esc(T3W_STEPS[nextIdx].stage)} email</button>
        ${remaining.length > 1 ? `<button class="btn sm subtle" id="t3w-auto">${icon('send', 14)} Send all remaining steps</button>` : ''}
      </div><div id="t3w-out"></div>`;
  const log = (e.outreachLog || []).slice(0, 6).map((l) => {
    const step = T3W_STEPS.find((s) => s.key === l.day);
    const label = step ? `${step.stage} · ${step.name}` : l.day;
    const modeLabel = l.mode === 'automated' ? 'Sent' : l.mode === 'manual-complete' ? 'Marked done' : 'Reopened';
    return `<div class="muted" style="font-size:12px">${icon(l.mode === 'automated' ? 'send' : 'check', 11)} ${esc(label)} — ${modeLabel} by ${esc(l.by)} · ${relativeTime(l.at)}${l.subject ? `<br><span style="padding-left:16px">To: ${esc(l.to || '')}${l.cc && l.cc.length ? ' · Cc: ' + esc(l.cc.join(', ')) : ''}<br>“${esc(l.subject)}”</span>` : ''}</div>`;
  }).join('');
  const milestones = e.milestones.map((m) => `<div class="check-item"><span class="check-box ${m.done ? 'done' : ''}">${m.done ? icon('check', 12) : ''}</span><span>${esc(m.label)} <span class="muted">· ${m.done ? 'done' : 'due ' + m.due}</span></span></div>`).join('');

  const body = `
    <div class="row wrap mb8" style="gap:8px">${statusPill(e.status)} ${e.atRisk ? badge('At risk', 'tint-warn') : ''}</div>
    <div class="field"><span class="field-key">Customer</span><span class="field-val">${esc(e.customer)}</span></div>
    <div class="field"><span class="field-key">CSAM</span><span class="field-val">${esc(e.csamName)}</span></div>
    <div class="field"><span class="field-key">Family / Program</span><span class="field-val">${esc(e.track)} · ${esc(e.program)}</span></div>
    <div class="field"><span class="field-key">Assigned CSA</span><span class="field-val">${csa ? esc(csa.name) + ' (' + esc(csa.vendor) + ')' : 'Unassigned'}</span></div>
    <div class="field"><span class="field-key">Due</span><span class="field-val">${esc(e.dueDate)}</span></div>
    <div class="section-title">T-3W Proactive Dispatch</div>
    <div class="muted" style="font-size:12px">${canManageOutreach ? 'CSA-owned escalation cadence to confirm the kickoff meeting — draft and send each step, or mark it done directly.' : 'The assigned Partner CSA owns this cadence.'}</div>
    <div class="mt8">${steps}</div>
    ${automation}
    ${log ? `<div class="section-title">Outreach activity</div><div class="col-stack" style="gap:4px">${log}</div>` : ''}
    <div class="section-title">Milestones</div>${milestones}
    <div class="section-title">Success stories</div>
    ${stories.length ? `<div class="col-stack" style="gap:6px">${stories.map((story) => `<button class="btn" data-story-link="${story.id}" style="justify-content:space-between">${esc(story.title)} ${statusPill(story.status)}</button>`).join('')}</div>` : '<div class="muted">No success story is linked to this engagement.</div>'}
    <div class="section-title">Shadowing</div>
    ${shadowRequests.length ? shadowRequests.map((s) => {
      const requester = d.csas.find((c) => c.id === s.requesterId);
      return `<div class="field"><span class="field-key">${esc(requester ? requester.name : s.requesterId)}</span><span class="field-val">${statusPill(s.status)}${s.status === 'requested' ? `<button class="btn sm" data-shadow-confirm="${s.id}" style="margin-left:6px">Confirm</button><button class="btn sm subtle" data-shadow-decline="${s.id}" style="margin-left:4px">Decline</button>` : ''}</span></div>`;
    }).join('') : '<div class="muted">No shadow requests for this delivery.</div>'}
    <div class="section-title">AI dispatch</div>
    <div class="row wrap mb8" style="gap:6px">
      <button class="btn sm" id="rec">${icon('sparkle', 14)} Recommend best-fit CSA</button>
      <button class="btn sm" id="draft">${icon('sparkle', 14)} Draft outreach</button>
    </div>
    <div id="ai-out"></div>`;

  openDrawer(`${esc(e.customer)} · ${esc(e.id)}`, body, (dr) => {
    const out = dr.querySelector('#ai-out');
    dr.querySelectorAll('[data-story-link]').forEach((button) => button.addEventListener('click', () => {
      closeDrawer();
      navigate(`/success-stories?q=${encodeURIComponent(button.getAttribute('data-story-link'))}`);
    }));
    dr.querySelectorAll('[data-shadow-confirm]').forEach((b) => b.addEventListener('click', () => { respondShadowRequest(b.getAttribute('data-shadow-confirm'), 'confirmed'); closeDrawer(); openEngagement(e.id); }));
    dr.querySelectorAll('[data-shadow-decline]').forEach((b) => b.addEventListener('click', () => { respondShadowRequest(b.getAttribute('data-shadow-decline'), 'declined'); closeDrawer(); openEngagement(e.id); }));
    dr.querySelectorAll('[data-outreach-day]').forEach((b) => b.addEventListener('click', () => {
      toggleOutreachDay(e.id, b.getAttribute('data-outreach-day'), PERSONAS[store.role].name);
      closeDrawer(); openEngagement(e.id);
    }));
    const t3wOut = dr.querySelector('#t3w-out');
    const previewBtn = dr.querySelector('#t3w-preview');
    const showPreview = () => {
      const idx = nextStepIndex(e);
      if (idx < 0) return;
      const step = T3W_STEPS[idx];
      const draft = t3wDraft(step, e, d, csa ? csa.name : null);
      t3wOut.innerHTML = `<div class="card pad mt8" style="background:var(--bg-2)">
        <div class="row mb8">${aiChip()}<span class="muted" style="font-size:12px">Editable — ${esc(step.stage)}: ${esc(step.name)}</span></div>
        <div class="field"><span class="field-key">To</span><span class="field-val">${esc(draft.to)}</span></div>
        <div class="field"><span class="field-key">Cc</span><span class="field-val">${esc(draft.cc.join(', '))}</span></div>
        <div class="field"><span class="field-key">Subject</span><span class="field-val">${esc(draft.subject)}</span></div>
        <textarea id="t3w-body" class="input" style="width:100%;min-height:110px;font-family:inherit;font-size:13px;margin-top:6px">${esc(draft.body)}</textarea>
        <div class="row mt8" style="gap:6px"><button class="btn sm" id="t3w-send">${icon('send', 14)} Send &amp; mark done</button></div>
      </div>`;
      t3wOut.querySelector('#t3w-send').addEventListener('click', () => {
        const bodyText = t3wOut.querySelector('#t3w-body').value;
        sendOutreachStep(e.id, { to: draft.to, cc: draft.cc, subject: draft.subject, body: bodyText }, PERSONAS[store.role].name);
        closeDrawer(); openEngagement(e.id);
      });
    };
    if (previewBtn) previewBtn.addEventListener('click', showPreview);
    if (autoDraft && previewBtn) showPreview();
    const autoBtn = dr.querySelector('#t3w-auto');
    if (autoBtn) autoBtn.addEventListener('click', () => {
      const drafts = {};
      T3W_STEPS.forEach((s) => { if (!e.outreach[s.key]) drafts[s.key] = t3wDraft(s, e, d, csa ? csa.name : null); });
      sendAllRemainingSteps(e.id, drafts, PERSONAS[store.role].name);
      closeDrawer(); openEngagement(e.id);
    });
    dr.querySelector('#rec').addEventListener('click', () => {
      const r = recommendCSA(e, d);
      out.innerHTML = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}</div><div>${esc(r.text)}</div>
        <div class="row wrap mt8" style="gap:6px">${r.sources.map((s) => `<button class="btn sm" data-assign="${s.id}">Assign ${esc(s.label)}</button>`).join('')}</div></div>`;
      out.querySelectorAll('[data-assign]').forEach((b) => b.addEventListener('click', () => { assignEngagement(e.id, b.getAttribute('data-assign')); closeDrawer(); }));
    });
    dr.querySelector('#draft').addEventListener('click', () => {
      const r = draftOutreach(e, d);
      out.innerHTML = `<div class="card pad" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}<span class="muted" style="font-size:12px">Editable draft</span></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0">${esc(r.text)}</pre></div>`;
    });
  });
}
