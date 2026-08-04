// Home — Delivery Cockpit.
import { store, computeKpis, sentimentBreakdown, hoursSince, openActions, todayISO } from '../store.js';
import { PERSONAS } from '../roles.js';
import { dailyBriefing } from '../ai.js';
import { navigate } from '../router.js';
import { TRACKS, LEADERSHIP } from '../../data/generate.js';
import {
  pageHeader, kpiCard, aiChip, badge, severityPill, esc,
  scoreColor, utilColor, COLORS, CHART_PALETTE, clearCharts, donut, bar,
} from '../components.js';
import { icon } from '../icons.js';
import { openAssignActionDrawer, actionItemHtml, wireActionToggles } from '../actions.js';

const initials = (n) => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

let track = 'All';
let partner = 'All';

export function renderHome(container) {
  clearCharts();
  const d = store.data;
  const role = store.role;
  const persona = PERSONAS[role];
  const k = computeKpis(d);
  const briefing = dailyBriefing(role, d);
  const sent = sentimentBreakdown(d);

  const partnerOf = (csaId) => { const c = d.csas.find((x) => x.id === csaId); return c ? c.partnerId : ''; };
  const filteredEngs = d.engagements.filter((e) => (track === 'All' || e.track === track) && (partner === 'All' || partnerOf(e.assignedTo) === partner));

  // Needs attention
  const breaches = d.escalations
    .filter((e) => e.status !== 'resolved' && hoursSince(e.opened) > e.slaHours)
    .map((e) => { const eng = d.engagements.find((x) => x.id === e.engagementId); return { priority: 1, severity: e.severity, title: `${e.severity.toUpperCase()} escalation — ${eng ? eng.customer : e.engagementId}`, meta: `${e.summary} · SLA ${e.slaHours}h breached · owner ${e.ownerName}`, q: eng ? eng.customer : e.id, track: eng && eng.track, partner: partnerOf(eng && eng.assignedTo) }; });
  const risky = filteredEngs.filter((e) => e.atRisk).map((e) => ({ priority: 2, title: `At-risk — ${e.customer} (${e.program})`, meta: `${e.track} · due ${e.dueDate} · outreach ${Object.values(e.outreach).filter(Boolean).length}/4`, q: e.customer, track: e.track, partner: partnerOf(e.assignedTo) }));
  const demand = filteredEngs.filter((e) => e.status === 'new').map((e) => ({ priority: 3, title: `New demand — ${e.customer}`, meta: `${e.track} · ${e.program} · awaiting dispatch`, q: e.customer, track: e.track, partner: '' }));
  const attention = [...breaches, ...risky, ...demand]
    .filter((a) => (track === 'All' || a.track === track) && (partner === 'All' || a.partner === partner || a.priority === 3))
    .sort((a, b) => a.priority - b.priority).slice(0, 9);

  // Action items (assigned from Messages / Escalations) — checkable here.
  const actionEng = (a) => {
    if (a.engagementId) return d.engagements.find((e) => e.id === a.engagementId);
    if (a.escalationId) { const es = d.escalations.find((x) => x.id === a.escalationId); return es && d.engagements.find((e) => e.id === es.engagementId); }
    return null;
  };
  const actInFilter = (a) => { const e = actionEng(a); if (!e) return track === 'All' && partner === 'All'; return (track === 'All' || e.track === track) && (partner === 'All' || partnerOf(e.assignedTo) === partner); };
  const openActs = openActions(d);
  const overdueActs = openActs.filter((a) => a.due && a.due < todayISO()).length;
  const actionsFiltered = openActs.filter(actInFilter).sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const actionsDone = d.actions.filter((a) => a.status === 'done').length;

  const engCount = (st) => filteredEngs.filter((e) => e.status === st).length;
  const cpeByTrack = TRACKS.map((t) => { const items = d.cpe.filter((c) => c.track === t); return { t: t.replace(' (P&E)', ''), v: items.length ? Math.round((items.reduce((s, c) => s + c.score, 0) / items.length) * 10) / 10 : 0 }; });

  const podHealth = d.pods.map((pod) => {
    const csas = d.csas.filter((c) => c.podId === pod.id);
    const active = csas.filter((c) => c.lifecycle === 'active');
    const avgUtil = active.length ? Math.round(active.reduce((s, c) => s + c.utilization, 0) / active.length) : pod.utilization;
    const avgCpe = csas.length ? Math.round((csas.reduce((s, c) => s + c.cpe, 0) / csas.length) * 10) / 10 : 0;
    const engs = d.engagements.filter((e) => e.assignedTo && csas.some((c) => c.id === e.assignedTo));
    const atRisk = engs.filter((e) => e.atRisk).length;
    const openEsc = d.escalations.filter((e) => e.status !== 'resolved' && engs.some((x) => x.id === e.engagementId)).length;
    return { pod, avgUtil, avgCpe, atRisk, openEsc, headcount: active.length };
  });

  const trackOpts = ['All', ...TRACKS].map((t) => `<option value="${esc(t)}" ${t === track ? 'selected' : ''}>${t === 'All' ? 'All families' : esc(t)}</option>`).join('');
  const partnerOpts = ['All', ...d.partners.map((p) => p.id)].map((p) => { const label = p === 'All' ? 'All partners' : d.partners.find((x) => x.id === p).name; return `<option value="${esc(p)}" ${p === partner ? 'selected' : ''}>${esc(label)}</option>`; }).join('');

  container.innerHTML = `
    ${pageHeader({
      title: 'Delivery Cockpit',
      description: `Welcome, ${esc(persona.name.split(' ')[0])}. Here's what needs your attention today.`,
      actions: `<select class="select" id="f-track" aria-label="Filter by family">${trackOpts}</select>
                <select class="select" id="f-partner" aria-label="Filter by partner">${partnerOpts}</select>`,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Active engagements', value: k.activeEngagements, iconName: 'send', hint: 'Assigned + in delivery' })}
      ${kpiCard({ label: 'On-time delivery', value: k.onTimePct + '%', iconName: 'check', tone: k.onTimePct >= 90 ? COLORS.positive : COLORS.warning, hint: 'Target ≥ 90%' })}
      ${kpiCard({ label: 'Rolling CPE', value: k.rollingCpe.toFixed(1), iconName: 'star', tone: scoreColor(k.rollingCpe), hint: 'Target ≥ 4.4 / 5' })}
      ${kpiCard({ label: 'Open escalations', value: k.openEscalations, iconName: 'warning', tone: k.slaBreaches > 0 ? COLORS.negative : COLORS.neutral, hint: `${k.slaBreaches} breaching SLA` })}
      ${kpiCard({ label: 'Utilization', value: k.utilization + '%', iconName: 'people', tone: utilColor(k.utilization), hint: 'Healthy band 80–90%' })}
      ${kpiCard({ label: 'Net sentiment', value: k.netSentiment > 0 ? '+' + k.netSentiment : k.netSentiment, iconName: 'emoji', tone: k.netSentiment >= 0 ? COLORS.positive : COLORS.negative, hint: 'Across channels' })}
      ${kpiCard({ label: 'Open actions', value: openActs.length, iconName: 'flag', tone: overdueActs > 0 ? COLORS.warning : COLORS.neutral, hint: `${overdueActs} overdue` })}
    </div>

    <div class="card pad mb16">
      <div class="row mb8"><strong style="font-size:15px">SSD Leadership</strong>${badge('Org', 'tint-info')}</div>
      <div class="lead-people">
        ${[{ name: LEADERSHIP.wwLead, role: 'Worldwide Lead' }, ...LEADERSHIP.timeZones.map((t) => ({ name: t.lead, role: `${t.tz} TZ Lead` })), { name: LEADERSHIP.businessManager, role: 'Business Manager' }]
          .map((l, i) => `<div class="lead-person"><span class="lead-av" style="background:${CHART_PALETTE[i % CHART_PALETTE.length]}">${esc(initials(l.name))}</span><span><div style="font-weight:600">${esc(l.name)}</div><div class="lead-role">${esc(l.role)}</div></span></div>`)
          .join('')}
      </div>
    </div>

    <div class="card pad mb16">
      <div class="brief-head">${icon('sparkle', 18)}<strong style="font-size:16px">Daily briefing</strong>${aiChip()}</div>
      <div class="brief-grid">
        <div>
          <div class="brief-headline">${esc(briefing.headline)}</div>
          <ul class="brief-bullets">${briefing.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        </div>
        <div class="anomaly-box">
          <div class="muted" style="font-weight:600; font-size:12px">Anomaly callouts</div>
          ${briefing.anomalies.length ? briefing.anomalies.map((a) => `<span class="anomaly">${esc(a)}</span>`).join('') : '<div class="muted mt8">No anomalies detected.</div>'}
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="card pad">
        <div class="row" style="justify-content:space-between" >
          <strong style="font-size:16px">Needs attention</strong>
          ${badge(attention.length + ' items', 'tint-info')}
        </div>
        <hr class="divider"/>
        <div id="attn-list">
          ${attention.length ? attention.map((a) => `
            <div class="attn-row">
              ${a.severity ? severityPill(a.severity) : `<span style="color:${a.priority === 2 ? COLORS.warning : COLORS.info}">${icon('warning', 16)}</span>`}
              <div class="attn-main">
                <div class="attn-title">${esc(a.title)}</div>
                <div class="attn-meta">${esc(a.meta)}</div>
              </div>
              <button class="btn subtle sm" data-q="${esc(a.q)}">View ${icon('chevronRight', 14)}</button>
            </div>`).join('') : '<div class="muted">Nothing needs attention for this filter.</div>'}
        </div>
      </div>

      <div class="col-stack">
        <div class="card chart-card">
          <div class="chart-head"><strong>Engagements by status</strong></div>
          <div class="chart-holder" style="height:200px"><canvas id="c-status"></canvas></div>
        </div>
        <div class="card chart-card">
          <div class="chart-head"><strong>Sentiment mix</strong>${aiChip('NLP')}</div>
          <div class="chart-holder" style="height:200px"><canvas id="c-sent"></canvas></div>
        </div>
      </div>
    </div>

    <div class="card pad mb16">
      <div class="row" style="justify-content:space-between">
        <div class="row" style="gap:8px"><strong style="font-size:16px">Action items</strong>${badge(actionsFiltered.length + ' open', 'tint-info')}${actionsDone ? badge(actionsDone + ' done', 'outline') : ''}</div>
        <div class="row" style="gap:6px">
          <button class="btn sm" id="assign-action">${icon('flag', 14)} Assign action</button>
          <button class="btn subtle sm" id="open-messages">${icon('send', 14)} Messages</button>
        </div>
      </div>
      <hr class="divider"/>
      <div id="home-actions">
        ${actionsFiltered.length ? actionsFiltered.map((a) => actionItemHtml(a, { showSource: true, withOpen: true })).join('') : '<div class="muted">No open actions for this filter. Assign one from a message thread or an escalation.</div>'}
      </div>
    </div>

    <div class="card chart-card mb16">
      <div class="chart-head"><strong>Average CPE by family</strong></div>
      <div class="chart-holder" style="height:220px"><canvas id="c-cpe"></canvas></div>
    </div>

    <div class="section-title">POD health</div>
    <div class="pod-grid">
      ${podHealth.map(({ pod, avgUtil, avgCpe, atRisk, openEsc, headcount }) => `
        <div class="card pod-card">
          <div class="row" style="justify-content:space-between">
            <strong>${esc(pod.name)}</strong>
            <span class="dot" style="background:${utilColor(avgUtil)}"></span>
          </div>
          <div class="muted" style="font-size:12px">${esc(pod.region)} · ${esc(pod.tz)} TZ · ${headcount} active CSAs</div>
          <hr class="divider"/>
          <div class="pod-stat"><span>Utilization</span><strong style="color:${utilColor(avgUtil)}">${avgUtil}%</strong></div>
          <div class="pod-stat"><span>Avg CPE</span><strong style="color:${scoreColor(avgCpe)}">${avgCpe.toFixed(1)}</strong></div>
          <div class="pod-stat"><span>At-risk / Open esc.</span><strong>${atRisk} / ${openEsc}</strong></div>
        </div>`).join('')}
    </div>`;

  // Charts
  donut(container.querySelector('#c-status'), {
    labels: ['New', 'Assigned', 'In delivery', 'Complete'],
    values: [engCount('new'), engCount('assigned'), engCount('in-delivery'), engCount('complete')],
    colors: [COLORS.info, '#6b69d6', COLORS.warning, COLORS.positive],
  });
  donut(container.querySelector('#c-sent'), {
    labels: ['Positive', 'Neutral', 'Negative'],
    values: [sent.positive, sent.neutral, sent.negative],
    colors: [COLORS.positive, COLORS.neutral, COLORS.negative],
  });
  bar(container.querySelector('#c-cpe'), { labels: cpeByTrack.map((x) => x.t), values: cpeByTrack.map((x) => x.v), color: COLORS.brand, label: 'Avg CPE' });

  // Events
  container.querySelector('#f-track').addEventListener('change', (e) => { track = e.target.value; renderHome(container); });
  container.querySelector('#f-partner').addEventListener('change', (e) => { partner = e.target.value; renderHome(container); });
  container.querySelector('#attn-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-q]');
    if (btn) navigate(`/ssdiq?q=${encodeURIComponent(btn.getAttribute('data-q'))}`);
  });

  // Action items
  wireActionToggles(container);
  container.querySelector('#assign-action').addEventListener('click', () => openAssignActionDrawer({}));
  container.querySelector('#open-messages').addEventListener('click', () => navigate('/messages'));
  container.querySelector('#home-actions').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]'); if (!btn) return;
    const v = btn.getAttribute('data-open');
    if (v.startsWith('thread:')) navigate(`/messages?thread=${encodeURIComponent(v.slice(7))}`);
    else if (v === 'esc') navigate('/escalations');
  });
}
