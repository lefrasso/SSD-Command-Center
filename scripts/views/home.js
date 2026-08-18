// Home — Delivery Cockpit.
import { store, computeKpis, sentimentBreakdown, hoursSince, openActions, todayISO, canonicalEntityMap } from '../store.js';
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
  const resourceMix = d.csas.reduce((acc, c) => {
    const type = c.resourceType || (c.vendor === 'Nebula' || c.vendor === 'GSCD' ? 'FTE' : 'FTC');
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, { FTC: 0, FTE: 0 });

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
      title: 'True North',
      description: `Welcome, ${esc(persona.name.split(' ')[0])}. Your priorities for today and this week — personalized for ${esc(persona.title)}.`,
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
      <div class="brief-head">${icon('sparkle', 18)}<strong style="font-size:16px">Your priorities — today &amp; this week</strong>${aiChip()}</div>
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

    <div class="card pad mb16">
      <div class="row mb8"><strong style="font-size:15px">SSD Leadership</strong>${badge('Org', 'tint-info')}</div>
      <div class="lead-people">
        ${[{ name: LEADERSHIP.wwLead, role: 'Worldwide Lead' }, ...LEADERSHIP.timeZones.map((t) => ({ name: t.lead, role: `${t.tz} TZ Lead` })), { name: LEADERSHIP.businessManager, role: 'Business Manager' }]
          .map((l, i) => `<div class="lead-person"><span class="lead-av" style="background:${CHART_PALETTE[i % CHART_PALETTE.length]}">${esc(initials(l.name))}</span><span><div style="font-weight:600">${esc(l.name)}</div><div class="lead-role">${esc(l.role)}</div></span></div>`)
          .join('')}
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
    </div>

    <section class="card pad mb16" aria-label="Resource mix and platform overview">
      <div class="row" style="justify-content:space-between; margin-bottom: 12px;">
        <strong style="font-size:16px">Resource mix</strong>
        ${badge('FTC = pCSAs · FTE = Nebula / GSCD', 'tint-info')}
      </div>
      <div class="record-grid">
        <div class="record-card">
          <div class="record-label">FTC resources</div>
          <div class="record-value">${resourceMix.FTC}</div>
          <div class="record-foot">pCSAs / partner-sourced</div>
        </div>
        <div class="record-card">
          <div class="record-label">FTE resources</div>
          <div class="record-value">${resourceMix.FTE}</div>
          <div class="record-foot">Nebula + GSCD employees</div>
        </div>
        <div class="record-card">
          <div class="record-label">Active engagements</div>
          <div class="record-value">${k.activeEngagements}</div>
          <div class="record-foot">Delivery demand in flight</div>
        </div>
        <div class="record-card">
          <div class="record-label">Open escalations</div>
          <div class="record-value">${k.openEscalations}</div>
          <div class="record-foot">SLA and issue watchlist</div>
        </div>
      </div>
    </section>

    <section class="card pad mb16" aria-label="Operational workflow">
      <div class="row" style="justify-content:space-between; margin-bottom: 12px;">
        <strong style="font-size:16px">Operational flow</strong>
        ${badge('Source → SSD IQ → Action → Insight', 'tint-info')}
      </div>
      <div class="workflow-steps">
        <div class="workflow-step">
          <div class="workflow-number">1</div>
          <div class="workflow-body">
            <div class="workflow-title">Intake</div>
            <div class="workflow-text">Requests, surveys, labor, capacity, and offerings feed the platform.</div>
          </div>
        </div>
        <div class="workflow-step">
          <div class="workflow-number">2</div>
          <div class="workflow-body">
            <div class="workflow-title">Normalize in SSD IQ</div>
            <div class="workflow-text">People, targets, KPIs, and operational records become the canonical source of truth.</div>
          </div>
        </div>
        <div class="workflow-step">
          <div class="workflow-number">3</div>
          <div class="workflow-body">
            <div class="workflow-title">Drive action</div>
            <div class="workflow-text">Dispatch, escalations, lifecycle moves, and assigned work operate from those records.</div>
          </div>
        </div>
        <div class="workflow-step">
          <div class="workflow-number">4</div>
          <div class="workflow-body">
            <div class="workflow-title">Reporting & AI</div>
            <div class="workflow-text">Insights, MBRs, and agent-generated recommendations are derived from the governed data layer.</div>
          </div>
        </div>
      </div>
    </section>

    <section class="card pad mb16" aria-label="System of record overview">
      <div class="row" style="justify-content:space-between; margin-bottom: 12px;">
        <strong style="font-size:16px">System of record</strong>
        ${badge('SSD IQ canonical model', 'tint-info')}
      </div>
      <div class="record-grid">
        <div class="record-card">
          <div class="record-label">People</div>
          <div class="record-value">${d.csas.length + d.partners.length}</div>
          <div class="record-foot">CSAs + partner profiles</div>
        </div>
        <div class="record-card">
          <div class="record-label">PODs</div>
          <div class="record-value">${d.pods.length}</div>
          <div class="record-foot">Org structure + coverage</div>
        </div>
        <div class="record-card">
          <div class="record-label">Engagements</div>
          <div class="record-value">${d.engagements.length}</div>
          <div class="record-foot">Delivery demand + assignments</div>
        </div>
        <div class="record-card">
          <div class="record-label">Escalations</div>
          <div class="record-value">${d.escalations.length}</div>
          <div class="record-foot">Issues, SLA and actions</div>
        </div>
        <div class="record-card">
          <div class="record-label">Actions</div>
          <div class="record-value">${d.actions.length}</div>
          <div class="record-foot">Operational follow-through</div>
        </div>
        <div class="record-card">
          <div class="record-label">Quality</div>
          <div class="record-value">${d.cpe.length}</div>
          <div class="record-foot">CPE, checks and readiness</div>
        </div>
      </div>
      <div class="entity-list" style="margin-top: 14px;">
        ${['People','PODs','Partners','Engagements','Escalations','Actions','Messages','Quality','Capacity','Sentiment'].map((name) => `<span class="entity-pill">${name}</span>`).join('')}
      </div>
      <div class="governance-list" style="margin-top: 14px;">
        ${canonicalEntityMap(d).map(({ entity, owner, source, count }) => `
          <div class="governance-item">
            <div class="governance-meta">${esc(entity)}</div>
            <div class="governance-owner">${esc(owner)}</div>
            <div class="governance-source">${esc(source)}</div>
            <div class="governance-count">${count}</div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="card pad mb16" aria-label="Delivery roadmap">
      <div class="row" style="justify-content:space-between; margin-bottom: 12px;">
        <strong style="font-size:16px">Implementation roadmap</strong>
        ${badge('9-stage platform rollout', 'tint-info')}
      </div>
      <div class="roadmap-grid">
        ${[
          'Design data model',
          'Connect sources',
          'Implement coding harnesses',
          'Identity management',
          'Platform basics',
          'Implement pCSA lifecycle',
          'Implement POD management capabilities',
          'Capacity management',
          'Agentic delivery automation'
        ].map((label, index) => `
          <div class="roadmap-step">
            <div class="roadmap-step-number">${index + 1}</div>
            <div class="roadmap-step-label">${esc(label)}</div>
          </div>
        `).join('')}
      </div>
    </section>`;


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
