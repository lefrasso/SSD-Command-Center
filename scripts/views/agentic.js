// Agentic Delivery — AI delivery agents, Deliverables Generation, and the IP library.
import { store } from '../store.js';
import { pageHeader, kpiCard, aiChip, esc, badge, COLORS, openDrawer } from '../components.js';
import { icon } from '../icons.js';
import { generateDeliverable } from '../ai.js';

const IP_ASSETS = [
  { name: 'Landing Zone Playbook', track: 'Cloud Deployment', type: 'Playbook' },
  { name: 'Migration Runbook', track: 'Cloud Deployment', type: 'Runbook' },
  { name: 'Expert Security Assessment Template', track: 'Health', type: 'Template' },
  { name: 'Copilot Readiness Kit', track: 'AI Innovation', type: 'Kit' },
  { name: 'AI Foundry Enablement Deck', track: 'AI Innovation', type: 'Deck' },
  { name: 'Customer Health Scorecard', track: 'Health', type: 'Template' },
  { name: 'Plan & Envision Workshop Deck', track: 'Foundations', type: 'Deck' },
];

let generated = 0;

function agentStatus(e) {
  const done = e.milestones.filter((m) => m.done).length;
  if (e.status === 'complete') return { label: 'Complete', color: COLORS.positive };
  if (done >= Math.ceil(e.milestones.length / 2)) return { label: 'Drafting deliverable', color: COLORS.info };
  if (e.status === 'in-delivery') return { label: 'In delivery', color: COLORS.warning };
  return { label: 'Queued', color: COLORS.neutral };
}

export function renderAgentic(container) {
  const d = store.data;
  const active = d.engagements.filter((e) => e.assignedTo && (e.status === 'in-delivery' || e.status === 'assigned'));
  const automation = d.engagements.filter((e) => e.status !== 'new').length;
  const coverage = d.engagements.length ? Math.round((automation / d.engagements.length) * 100) : 0;

  container.innerHTML = `
    ${pageHeader({ title: 'Agentic Delivery', description: 'AI delivery agents assist every engagement — drafting deliverables from SSD IQ, with a reusable IP library. Human-owned: agents draft, the CSA reviews and sends.', actions: aiChip('Agentic') })}

    <div class="kpi-grid">
      ${kpiCard({ label: 'Active delivery agents', value: active.length, iconName: 'sparkle', tone: COLORS.brand })}
      ${kpiCard({ label: 'Deliverables generated', value: generated, iconName: 'report', hint: 'this session' })}
      ${kpiCard({ label: 'IP assets', value: IP_ASSETS.length, iconName: 'star' })}
      ${kpiCard({ label: 'Automation coverage', value: coverage + '%', iconName: 'check', tone: COLORS.positive, hint: 'engagements with an agent' })}
    </div>

    <div class="section-title">Delivery agents</div>
    <div class="table-wrap mb16"><table class="grid"><thead><tr><th>Customer</th><th>CSA</th><th>Family</th><th>Program</th><th>Agent status</th><th></th></tr></thead><tbody>
      ${active.slice(0, 40).map((e) => { const c = d.csas.find((x) => x.id === e.assignedTo); const st = agentStatus(e); return `<tr>
        <td><strong>${esc(e.customer)}</strong></td>
        <td>${esc(c ? c.name : '—')}</td>
        <td>${esc(e.track)}</td>
        <td>${esc(e.program)}</td>
        <td><span class="pill" style="color:${st.color}"><span class="pill-label">${esc(st.label)}</span></span></td>
        <td><button class="btn sm" data-gen="${e.id}">${icon('sparkle', 14)} Generate deliverable</button></td>
      </tr>`; }).join('') || '<tr><td colspan="6" class="muted" style="padding:16px">No active engagements.</td></tr>'}
    </tbody></table></div>

    <div class="section-title">IP library</div>
    <div class="catalog">
      ${IP_ASSETS.map((a) => `<div class="card tile" style="cursor:default">
        <span class="tile-ico">${icon('star', 20)}</span>
        <div><strong>${esc(a.name)}</strong><div class="muted" style="font-size:12px">${esc(a.type)} · ${esc(a.track)}</div><div class="mt8">${badge('Reusable IP', 'tint-info')}</div></div>
      </div>`).join('')}
    </div>`;

  container.querySelectorAll('[data-gen]').forEach((b) => b.addEventListener('click', () => {
    const e = d.engagements.find((x) => x.id === b.getAttribute('data-gen'));
    const r = generateDeliverable(e, d);
    generated += 1;
    openDrawer(`Deliverable · ${esc(e.customer)}`, `<div class="row mb8" style="gap:8px">${aiChip()}<span class="muted" style="font-size:12px">Draft — review before sending</span></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;margin:0">${esc(r.text)}</pre>`);
    // refresh the KPI counter
    const doc = container.querySelector('.kpi-grid'); if (doc) renderAgentic(container);
  }));
}
