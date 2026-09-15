// Agentic Delivery — tailored, per-engagement support agents across pre-delivery, delivery and
// post-delivery, plus in-flight feedback and an urgent "ask for support" fast path.
import {
  store, addIpFeedback, engagementFeedbackFor, addEngagementFeedback, addEscalation,
  syncAgentSchedule, runAgentNow, runAllAgentsNow, setAgentSchedule,
} from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, sentimentPill, COLORS, openDrawer } from '../components.js';
import { icon } from '../icons.js';
import { generateDeliverable } from '../ai.js';
import { PERSONAS } from '../roles.js';
import { IP_ASSETS, IP_TAGS } from '../../data/generate.js';
import { PHASES, COMMON_AGENTS, EXPERT_AGENTS, SCHEDULES, phaseForEngagement, agentsForEngagement } from '../agenticSupportAgents.js';
import { computeT3W, T3W_WINDOW_DAYS } from '../t3w.js';
import { TASK_INVENTORY, OPS_AGENTS, OPS_PHASE_LABEL, runOpsAgentById } from '../opsAutomation.js';

let generated = 0;
// Ops agents are cross-engagement (not tied to one delivery), so their run state lives here rather
// than in store.js's per-engagement schedule — same simulated, advisory-only contract as the rest
// of Agentic Delivery.
const opsAgentState = {};

const T3W_RISK = { 'not-started': 'medium', 'in-progress': 'low', 'on-track': 'low' };
const RISK_RANK = { low: 0, medium: 1, high: 2 };

function phasePill(phase) {
  const label = PHASES.find(([k]) => k === phase)?.[1] || phase;
  const color = phase === 'post-delivery' ? COLORS.positive : phase === 'delivery' ? COLORS.warning : COLORS.info;
  return `<span class="pill" style="color:${color}">${icon('clock', 14)}<span class="pill-label">${esc(label)}</span></span>`;
}
function riskBadge(risk) {
  if (risk === 'high') return badge('High risk', 'tint-danger');
  if (risk === 'medium') return badge('Watch', 'tint-warn');
  return badge('Low risk', 'outline');
}
function potentialBadge(potential) {
  if (potential === 'high') return badge('High potential', 'tint-info');
  if (potential === 'medium') return badge('Medium potential', 'outline');
  return badge('Low potential', 'outline');
}
function agentNameById(agentId) {
  if (!agentId) return null;
  const common = COMMON_AGENTS.find((a) => a.id === agentId);
  if (common) return common.name;
  const expert = Object.values(EXPERT_AGENTS).find((a) => a.id === agentId);
  if (expert) return expert.name;
  const ops = OPS_AGENTS.find((a) => a.id === agentId);
  return ops ? ops.name : null;
}
function opsAgentCardHtml(agentMeta) {
  const state = opsAgentState[agentMeta.id] || { output: null, lastRunAt: null };
  return `<div class="card pad mb8" style="background:var(--bg-2)">
    <div class="row wrap" style="justify-content:space-between;gap:8px">
      <div class="row">${icon(agentMeta.icon, 16)}<strong>${esc(agentMeta.name)}</strong><span class="muted" style="font-size:12px">· ${esc(agentMeta.role)}</span></div>
      ${state.lastRunAt ? badge(`Ran ${relativeTime(state.lastRunAt)}`, 'outline') : badge('Not run yet', 'outline')}
    </div>
    <div class="mt8">${agentOutputHtml(state.output)}</div>
    <div class="row wrap mt8" style="gap:6px"><button class="btn sm" data-run-ops-agent="${agentMeta.id}">${icon('sparkle', 14)} Run now</button></div>
  </div>`;
}
function phaseStepper(currentPhase) {
  const idx = PHASES.findIndex(([k]) => k === currentPhase);
  return `<div class="row wrap" style="gap:6px">${PHASES.map(([, label], i) => {
    const state = i < idx ? 'done' : i === idx ? 'current' : 'upcoming';
    const color = state === 'done' ? COLORS.positive : state === 'current' ? COLORS.brand : COLORS.neutral;
    const ic = state === 'done' ? 'check' : state === 'current' ? 'sparkle' : 'clock';
    return `${i > 0 ? `<span class="muted">${icon('chevronRight', 14)}</span>` : ''}<span class="pill" style="color:${color}">${icon(ic, 14)}<span class="pill-label">${esc(label)}</span></span>`;
  }).join('')}</div>`;
}

function relativeTime(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
function agentStatusPill(state) {
  if (!state.lastRunAt) return badge('Not run yet', 'outline');
  return badge(`${state.lastTrigger === 'scheduled' ? 'Auto-ran' : 'Ran'} ${relativeTime(state.lastRunAt)}`, state.lastTrigger === 'scheduled' ? 'tint-info' : 'outline');
}
function agentOutputHtml(output) {
  if (output == null) return '<div class="muted" style="font-size:13px">Not run yet — click "Run now" or leave it on a schedule.</div>';
  if (Array.isArray(output)) return output.map((t) => `<div class="check-item"><span class="check-box"></span><span>${esc(t)}</span></div>`).join('');
  return `<div style="font-size:13px">${esc(output)}</div>`;
}
function agentCardHtml(agentMeta, engagementId) {
  const state = syncAgentSchedule(engagementId, agentMeta.id);
  return `<div class="card pad mb8" style="background:var(--bg-2)">
    <div class="row wrap" style="justify-content:space-between;gap:8px">
      <div class="row">${icon(agentMeta.icon, 16)}<strong>${esc(agentMeta.name)}</strong><span class="muted" style="font-size:12px">· ${esc(agentMeta.role)}</span></div>
      ${agentStatusPill(state)}
    </div>
    <div class="mt8">${agentOutputHtml(state.lastOutput)}</div>
    <div class="row wrap mt8" style="gap:6px">
      <button class="btn sm" data-run-agent="${agentMeta.id}">${icon('sparkle', 14)} Run now</button>
      <select class="select" data-schedule-agent="${agentMeta.id}" style="height:26px;font-size:12px">${SCHEDULES.map(([k, label]) => `<option value="${k}" ${state.schedule === k ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>
      ${state.runCount ? `<span class="muted" style="font-size:11px">${state.runCount} run(s)</span>` : ''}
    </div>
  </div>`;
}

function t3wCardHtml(engagement) {
  const t3w = computeT3W(engagement);
  const color = t3w.status === 'overdue' || t3w.status === 'not-started' ? COLORS.negative : t3w.status === 'in-progress' ? COLORS.warning : COLORS.positive;
  const window = t3w.inWindow ? `Due in ${t3w.daysUntil}d — within the ${T3W_WINDOW_DAYS}-day T-3W window.` : t3w.status === 'overdue' ? `${Math.abs(t3w.daysUntil)}d past due.` : `Due in ${t3w.daysUntil}d — outside the ${T3W_WINDOW_DAYS}-day T-3W window yet.`;
  return `<div class="card pad mb16" style="border-left:4px solid ${color}">
    <div class="row" style="justify-content:space-between">
      <div class="row">${icon('send', 16)}<strong>T-3W proactive tracker</strong></div>
      <span class="pill" style="color:${color}"><span class="pill-label">${esc(t3w.label)}</span></span>
    </div>
    <div class="mt8" style="font-size:13px">${esc(window)} ${t3w.outreach}/4 Day 0–3 outreach touches logged.</div>
    <a class="btn sm subtle mt8" href="#/reports-pending">${icon('clock', 14)} Open T-3W tracker ${icon('chevronRight', 12)}</a>
  </div>`;
}

export function renderAgentic(container) {
  const d = store.data;
  const active = d.engagements.filter((e) => e.assignedTo && (e.status === 'in-delivery' || e.status === 'assigned'));
  const openUrgent = d.escalations.filter((e) => e.channel === 'agentic-support' && e.status !== 'resolved').length;
  const nonCustomerFacing = TASK_INVENTORY.filter((t) => !t.customerFacing);
  const highPotential = nonCustomerFacing.filter((t) => t.potential === 'high');
  const agentCovered = nonCustomerFacing.filter((t) => t.agentId);

  container.innerHTML = `
    ${pageHeader({ title: 'Agentic Delivery', description: 'Every engagement gets a tailored crew of AI agents — common agents cover insights, outreach, content and surveys across pre-delivery, delivery and post-delivery; a track specialist joins for domain expertise.', actions: aiChip('Agentic') })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Active delivery agents', value: active.length, iconName: 'sparkle', tone: COLORS.brand })}
      ${kpiCard({ label: 'Deliverables generated', value: generated, iconName: 'report', hint: 'this session' })}
      ${kpiCard({ label: 'Open urgent requests', value: openUrgent, iconName: 'warning', tone: openUrgent ? COLORS.negative : COLORS.positive, hint: 'via Ask for support' })}
      ${kpiCard({ label: 'Engagement feedback logged', value: d.engagementFeedback.length, iconName: 'chat' })}
      ${kpiCard({ label: 'IP Kit feedback', value: d.ipFeedback.length, iconName: 'star', hint: 'across all engagements' })}
    </div>

    <div class="section-title">Delivery agent roster</div>
    <div class="muted mb8" style="font-size:12px">Five common agents support every engagement; a track specialist joins for domain-specific guidance.</div>
    <div class="catalog">
      ${COMMON_AGENTS.map((a) => `<div class="card tile" style="cursor:default"><span class="tile-ico">${icon(a.icon, 20)}</span><div><strong>${esc(a.name)}</strong><div class="muted" style="font-size:12px">${esc(a.role)}</div><div class="mt8">${badge('Common agent', 'tint-info')}</div></div></div>`).join('')}
      ${Object.values(EXPERT_AGENTS).map((a) => `<div class="card tile" style="cursor:default"><span class="tile-ico">${icon(a.icon, 20)}</span><div><strong>${esc(a.name)}</strong><div class="muted" style="font-size:12px">${esc(a.role)}</div><div class="mt8">${badge(`${a.track} specialist`, 'outline')}</div></div></div>`).join('')}
    </div>

    <div class="section-title">Active engagements</div>
    <div class="muted mb8" style="font-size:12px">Open the support plan to see the full agent read for the current phase, generate deliverables, rate the IP Kit, submit feedback or ask for urgent support.</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Customer</th><th>CSA</th><th>Family</th><th>Program</th><th>Phase</th><th>Risk</th><th></th></tr></thead><tbody>
      ${active.slice(0, 50).map((e) => {
        const c = d.csas.find((x) => x.id === e.assignedTo);
        const phase = phaseForEngagement(e);
        const openEsc = d.escalations.filter((x) => x.engagementId === e.id && x.status !== 'resolved');
        let risk = openEsc.length ? 'high' : e.atRisk ? 'medium' : 'low';
        if (phase === 'pre-delivery') {
          const t3w = computeT3W(e);
          const t3wRisk = t3w.status === 'overdue' ? 'high' : t3w.inWindow ? T3W_RISK[t3w.status] : 'low';
          if (RISK_RANK[t3wRisk] > RISK_RANK[risk]) risk = t3wRisk;
        }
        return `<tr>
        <td><strong>${esc(e.customer)}</strong>${e.s500Customer ? ` ${badge('S500', 'tint-info')}` : ''}</td>
        <td>${esc(c ? c.name : '—')}</td>
        <td>${esc(e.track)}</td>
        <td>${esc(e.program)}</td>
        <td>${phasePill(phase)}</td>
        <td>${riskBadge(risk)}</td>
        <td><button class="btn sm" data-open-support="${e.id}">${icon('sparkle', 14)} Open support plan</button></td>
      </tr>`; }).join('') || '<tr><td colspan="7" class="muted" style="padding:16px">No active engagements.</td></tr>'}
    </tbody></table></div>

    <div class="section-title">Non-customer-facing automation \u2014 Events Task Inventory</div>
    <div class="muted mb8" style="font-size:12px">Every recurring activity across an engagement's lifecycle, read from the Events Task Inventory and classified customer-facing vs. back office. Back-office activities are where an agent can run furthest ahead of a human; customer-facing ones keep a human in the loop by design \u2014 agents there only draft and prep.</div>
    <div class="kpi-grid">
      ${kpiCard({ label: 'Activities inventoried', value: TASK_INVENTORY.length, iconName: 'grid' })}
      ${kpiCard({ label: 'Non-customer-facing', value: nonCustomerFacing.length, iconName: 'database', hint: 'the automation opportunity' })}
      ${kpiCard({ label: 'High automation potential', value: highPotential.length, iconName: 'trending', tone: COLORS.positive, hint: 'back office only' })}
      ${kpiCard({ label: 'Covered by an agent today', value: agentCovered.length, iconName: 'sparkle', hint: `of ${nonCustomerFacing.length} back-office activities` })}
    </div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Activity</th><th>Phase</th><th>Customer-facing</th><th>Automation potential</th><th>Agent</th></tr></thead><tbody>
      ${TASK_INVENTORY.map((t) => { const agentName = agentNameById(t.agentId); return `<tr>
        <td><strong>${esc(t.activity)}</strong><div class="muted" style="font-size:11px">${esc(t.note)}</div></td>
        <td>${esc(OPS_PHASE_LABEL[t.phase] || t.phase)}</td>
        <td>${t.customerFacing ? badge('Customer-facing', 'outline') : badge('Back office', 'tint-info')}</td>
        <td>${potentialBadge(t.potential)}</td>
        <td>${agentName ? esc(agentName) : '<span class="muted">Human-only</span>'}</td>
      </tr>`; }).join('')}
    </tbody></table></div>

    <div class="section-title">Back-office ops agents</div>
    <div class="muted mb8" style="font-size:12px">New simulated agents purpose-built for the non-customer-facing side of delivery \u2014 they read across the whole portfolio rather than one engagement at a time. Advisory only: every recommendation still needs a human approval.</div>
    ${OPS_AGENTS.map((a) => opsAgentCardHtml(a)).join('')}

    <div class="section-title">IP library</div>
    <div class="muted mb8" style="font-size:12px">Reference templates behind each engagement's Kit — informational only; feedback is captured per engagement above.</div>
    <div class="catalog">
      ${IP_ASSETS.map((a) => `<div class="card tile" style="cursor:default">
        <span class="tile-ico">${icon('star', 20)}</span>
        <div><strong>${esc(a.name)}</strong><div class="muted" style="font-size:12px">${esc(a.type)} · ${esc(a.track)}</div><div class="mt8">${badge('Reusable IP', 'tint-info')}</div></div>
      </div>`).join('')}
    </div>`;

  container.querySelectorAll('[data-open-support]').forEach((b) => b.addEventListener('click', () => openSupportDrawer(b.getAttribute('data-open-support'), container)));
  container.querySelectorAll('[data-run-ops-agent]').forEach((b) => b.addEventListener('click', () => {
    const id = b.getAttribute('data-run-ops-agent');
    opsAgentState[id] = { output: runOpsAgentById(id, d), lastRunAt: new Date().toISOString() };
    renderAgentic(container);
  }));
}

function ipKitRatingFormHtml() {
  return `
    <label class="muted" style="font-size:12px">Rating</label>
    <select class="select" id="sp-ipf-rating" style="width:100%;margin-bottom:8px">
      <option value="5">5 — Excellent, used as-is</option>
      <option value="4">4 — Good</option>
      <option value="3" selected>3 — Usable, minor gaps</option>
      <option value="2">2 — Weak, needed rework</option>
      <option value="1">1 — Poor</option>
    </select>
    <label class="muted" style="font-size:12px">Status</label>
    <select class="select" id="sp-ipf-tag" style="width:100%;margin-bottom:8px">${IP_TAGS.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
    <textarea id="sp-ipf-comment" style="width:100%;min-height:60px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin-bottom:8px" placeholder="What worked, what didn't?"></textarea>
    <button class="btn sm primary" id="sp-ipf-submit">Submit rating</button>
    <div id="sp-ipf-error"></div>`;
}

function openSupportDrawer(engagementId, container) {
  const d = store.data;
  const e = d.engagements.find((x) => x.id === engagementId);
  if (!e) return;
  const csa = d.csas.find((x) => x.id === e.assignedTo);
  const phase = phaseForEngagement(e);
  const roster = agentsForEngagement(e);
  const feedback = [...engagementFeedbackFor(e.id, d)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const body = `
    <div class="row wrap mb8" style="gap:8px">${e.s500Customer ? badge('S500 strategic account', 'tint-info') : ''}${badge(e.track, 'outline')}</div>
    <div class="field"><span class="field-key">Program</span><span class="field-val">${esc(e.program)}</span></div>
    <div class="field"><span class="field-key">CSA</span><span class="field-val">${esc(csa ? csa.name : 'Unassigned')}</span></div>
    <div class="field"><span class="field-key">CSAM</span><span class="field-val">${esc(e.csamName)}</span></div>
    <div class="field"><span class="field-key">Due date</span><span class="field-val">${esc(e.dueDate)}</span></div>

    <div class="section-title">Delivery phase</div>
    ${phaseStepper(phase)}

    ${phase === 'pre-delivery' ? t3wCardHtml(e) : ''}

    <div class="row mb8" style="justify-content:space-between">
      <div class="section-title" style="margin:0">Delivery agents${aiChip()}</div>
      <button class="btn sm subtle" id="sp-run-all">${icon('sparkle', 14)} Run all agents now</button>
    </div>
    <div class="muted mb8" style="font-size:12px">Each agent runs on its own schedule (by default, whenever the phase changes) — run one on demand, or change its schedule.</div>
    ${roster.map((a) => agentCardHtml(a, e.id)).join('')}

    <div class="section-title">Other actions</div>
    <div class="row wrap mb8" style="gap:6px">
      <button class="btn sm" id="sp-generate">${icon('sparkle', 14)} Generate deliverable</button>
      <button class="btn sm subtle" id="sp-rate-kit">${icon('star', 14)} Rate IP Kit</button>
    </div>
    <div id="sp-out"></div>

    <div class="section-title" style="color:${COLORS.negative}">${icon('warning', 16)} Ask for support (urgent)</div>
    <div class="muted mb8" style="font-size:12px">Opens a fast-tracked escalation with the POD Lead and SDM.</div>
    <textarea id="sp-support-desc" style="width:100%;min-height:70px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin-bottom:8px" placeholder="What do you need help with right now?"></textarea>
    <select class="select" id="sp-support-sev" style="width:100%;margin-bottom:8px">
      <option value="sev1">Sev 1 — urgent, need help now</option>
      <option value="sev2">Sev 2 — needed today</option>
    </select>
    <button class="btn sm" style="border-color:${COLORS.negative};color:${COLORS.negative}" id="sp-support-submit">${icon('warning', 14)} Request support</button>
    <div id="sp-support-out"></div>

    <div class="section-title">Submit feedback</div>
    <textarea id="sp-feedback-msg" style="width:100%;min-height:60px;border:1px solid var(--stroke-1);border-radius:4px;padding:8px;font-family:inherit;margin-bottom:8px" placeholder="Share a quick check-in note on how this delivery is going…"></textarea>
    <button class="btn sm" id="sp-feedback-submit">${icon('chat', 14)} Submit feedback</button>
    <div id="sp-feedback-out"></div>

    <div class="section-title">Feedback &amp; check-ins</div>
    ${feedback.length ? `<div class="timeline">${feedback.map((f) => `<div class="tl-item">
      <div><strong>${esc(f.authorName)}</strong> <span class="muted">· ${esc(f.authorRole)} · ${esc((PHASES.find(([k]) => k === f.phase) || [, f.phase])[1])}</span> ${sentimentPill(f.sentiment)}</div>
      <div style="font-size:13px;margin:2px 0">${esc(f.message)}</div>
      <div class="tl-date">${esc(f.createdAt.slice(0, 10))}</div>
    </div>`).join('')}</div>` : '<div class="muted">No feedback logged yet for this engagement.</div>'}`;

  openDrawer(`Support plan · ${esc(e.customer)}`, body, (dr) => {
    dr.querySelector('#sp-run-all').addEventListener('click', () => {
      runAllAgentsNow(e.id);
      openSupportDrawer(e.id, container);
    });
    dr.querySelectorAll('[data-run-agent]').forEach((b) => b.addEventListener('click', () => {
      runAgentNow(e.id, b.getAttribute('data-run-agent'));
      openSupportDrawer(e.id, container);
    }));
    dr.querySelectorAll('[data-schedule-agent]').forEach((s) => s.addEventListener('change', () => {
      setAgentSchedule(e.id, s.getAttribute('data-schedule-agent'), s.value);
      openSupportDrawer(e.id, container);
    }));
    dr.querySelector('#sp-generate').addEventListener('click', () => {
      const r = generateDeliverable(e, d);
      generated += 1;
      dr.querySelector('#sp-out').innerHTML = `<div class="card pad mb8" style="background:var(--bg-2)"><div class="row mb8">${aiChip()}<span class="muted" style="font-size:12px">Draft — review before sending</span></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0">${esc(r.text)}</pre></div>`;
    });
    dr.querySelector('#sp-rate-kit').addEventListener('click', () => {
      dr.querySelector('#sp-out').innerHTML = ipKitRatingFormHtml();
      dr.querySelector('#sp-ipf-submit').addEventListener('click', () => {
        try {
          addIpFeedback({ engagementId: e.id, rating: dr.querySelector('#sp-ipf-rating').value, tag: dr.querySelector('#sp-ipf-tag').value, comment: dr.querySelector('#sp-ipf-comment').value });
          openSupportDrawer(e.id, container);
        } catch (err) {
          dr.querySelector('#sp-ipf-error').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
        }
      });
    });
    dr.querySelector('#sp-support-submit').addEventListener('click', () => {
      try {
        const desc = dr.querySelector('#sp-support-desc').value;
        if (!desc.trim()) throw new Error('Describe what you need help with.');
        const pod = csa && d.pods.find((p) => p.id === csa.podId);
        const persona = PERSONAS[store.role];
        const id = addEscalation({
          engagementId: e.id, severity: dr.querySelector('#sp-support-sev').value,
          summary: `[Ask for support] ${desc.trim()}`,
          ownerName: pod ? pod.leadName : 'Alex Navarro', sdmName: 'Priya Nair',
          raisedBy: persona.name, channel: 'agentic-support',
        });
        openSupportDrawer(e.id, container);
        const out = document.querySelector('#sp-support-out');
        if (out) out.innerHTML = `<div class="muted" style="font-size:12px;margin-top:6px">${icon('check', 14)} Support requested — escalation ${esc(id)} opened with the POD Lead and SDM.</div>`;
      } catch (err) {
        dr.querySelector('#sp-support-out').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
      }
    });
    dr.querySelector('#sp-feedback-submit').addEventListener('click', () => {
      try {
        const msg = dr.querySelector('#sp-feedback-msg').value;
        const persona = PERSONAS[store.role];
        addEngagementFeedback({ engagementId: e.id, phase, message: msg, authorName: persona.name, authorRole: persona.title });
        openSupportDrawer(e.id, container);
      } catch (err) {
        dr.querySelector('#sp-feedback-out').innerHTML = `<div class="muted" style="color:${COLORS.negative};font-size:12px;margin-top:6px">${esc(err.message)}</div>`;
      }
    });
  });
}
