// Partner CSA Lifecycle — pipeline Kanban + per-CSA profile drawer.
import { store } from '../store.js';
import { pageHeader, badge, aiChip, esc, kanban, openDrawer, meter, COLORS, sentimentPill } from '../components.js';
import { icon } from '../icons.js';

const STAGES = ['sourcing', 'selection', 'onboarding', 'active', 'offboarding'];
const STAGE_LABEL = { sourcing: 'Sourcing', selection: 'Selection', onboarding: 'Onboarding', active: 'Active delivery', offboarding: 'Offboarding' };
const ONBOARDING_PLAN = [
  { phase: 'Pre-boarding', owner: 'DPSM / Ops', tasks: ['Vendor validation & MOSA confirmation', 'Background & NDA verification', 'Provision Microsoft account & MFA'] },
  { phase: 'Tools & access', owner: 'Ops', tasks: ['Delivery workspace & SharePoint access', 'Azure DevOps & Power BI access', 'Teams channels & distribution lists', 'CPE tooling & Forms access'] },
  { phase: 'Bootcamp', owner: 'POD Lead', tasks: ['Delivery fundamentals bootcamp', 'Success Programs track deep-dive', 'Proactive Dispatch & Day 0–3 outreach cadence', 'CPE Recommended Practices training'] },
  { phase: 'Ramp & shadowing', owner: 'POD Lead', tasks: ['Role guidance & POD orientation', 'Shadow an active engagement', 'Mock delivery & QC review', 'First supervised delivery'] },
  { phase: 'Sign-off', owner: 'POD Lead', tasks: ['Onboarding review with POD Lead', 'Readiness sign-off for unsupervised delivery'] },
];
const OFFBOARD_TASKS = ['Reassign open engagements', 'Knowledge transfer', 'Access removal', 'Vendor validation & sign-off'];

const seedOf = (id) => [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0);

export function renderLifecycle(container) {
  const d = store.data;

  const columns = STAGES.map((stage) => {
    const csas = d.csas.filter((c) => c.lifecycle === stage);
    return {
      title: STAGE_LABEL[stage],
      count: csas.length,
      cards: csas.map((c) => {
        const pod = d.pods.find((p) => p.id === c.podId);
        return `<div class="kan-card" data-id="${c.id}">
          <div class="kc-title">${esc(c.name)}</div>
          <div class="kc-meta">${esc(c.vendor)} · ${esc(pod ? pod.name : '')}</div>
          <div class="kc-foot">${c.tracks.slice(0, 2).map((t) => badge(t, 'outline')).join('')}</div>
        </div>`;
      }),
    };
  });

  container.innerHTML = `
    ${pageHeader({ title: 'Partner CSA Lifecycle', description: 'Sourcing → selection → onboarding → active delivery → offboarding. Click a card for the profile, onboarding tracker and offboarding checklist.' })}
    ${kanban(columns)}`;

  container.querySelectorAll('.kan-card').forEach((el) => el.addEventListener('click', () => openProfile(el.getAttribute('data-id'))));
}

function openProfile(id) {
  const d = store.data;
  const c = d.csas.find((x) => x.id === id);
  if (!c) return;
  const pod = d.pods.find((p) => p.id === c.podId);
  const partner = d.partners.find((p) => p.id === c.partnerId);
  const openEngs = d.engagements.filter((e) => e.assignedTo === c.id && e.status !== 'complete');
  const idx = STAGES.indexOf(c.lifecycle);

  const seed = seedOf(c.id);
  const ALL_ONBOARD = ONBOARDING_PLAN.flatMap((p) => p.tasks);
  const total = ALL_ONBOARD.length;
  const onboardDone = (c.lifecycle === 'active' || c.lifecycle === 'offboarding') ? total : seed % (total + 1);
  const readiness = Math.round((onboardDone / total) * 100);
  const offDone = c.lifecycle === 'offboarding' ? seed % (OFFBOARD_TASKS.length + 1) : 0;

  const timeline = `<div class="timeline">${STAGES.map((s, i) => `<div class="tl-item"><div style="font-weight:${i === idx ? 700 : 400};color:${i <= idx ? 'var(--fg-1)' : 'var(--fg-4)'}">${STAGE_LABEL[s]}${i === idx ? ' · current' : ''}</div></div>`).join('')}</div>`;

  const checklist = (tasks, doneCount) => tasks.map((t, i) => `<div class="check-item"><span class="check-box ${i < doneCount ? 'done' : ''}">${i < doneCount ? icon('check', 12) : ''}</span><span>${esc(t)}</span></div>`).join('');

  let gi = 0;
  const onboardGroups = ONBOARDING_PLAN.map((p) => {
    const rows = p.tasks.map((t) => { const done = gi < onboardDone; gi += 1; return `<div class="check-item"><span class="check-box ${done ? 'done' : ''}">${done ? icon('check', 12) : ''}</span><span>${esc(t)}</span></div>`; }).join('');
    return `<div class="mt8"><div class="row" style="justify-content:space-between"><strong style="font-size:13px">${esc(p.phase)}</strong><span class="badge outline">${esc(p.owner)}</span></div>${rows}</div>`;
  }).join('');

  const stageSection = c.lifecycle === 'offboarding'
    ? `<div class="section-title">Offboarding checklist</div>${checklist(OFFBOARD_TASKS, offDone)}
       <div class="card pad mt8" style="background:var(--bg-2)"><div class="row mb8">${icon('sparkle', 16)}<strong>Offboarding risk</strong>${aiChip()}</div>
       <div>${openEngs.length ? `⚠ ${openEngs.length} open engagement(s) still assigned — reassign before access removal. Knowledge-transfer ${offDone >= 2 ? 'in progress' : 'not started'}.` : 'No open engagements. Low offboarding risk.'}</div></div>`
    : `<div class="row" style="justify-content:space-between"><div class="section-title">Onboarding plan</div><span class="muted" style="font-size:12px">${onboardDone}/${total} complete</span></div>${onboardGroups}
       <div class="card pad mt8" style="background:var(--bg-2)"><div class="row mb8">${icon('sparkle', 16)}<strong>Onboarding readiness</strong>${aiChip()}</div>
       <div class="row" style="gap:8px">${meter(readiness, readiness >= 80 ? COLORS.positive : readiness >= 40 ? COLORS.warning : COLORS.negative)}<strong>${readiness}%</strong></div>
       <div class="muted mt8" style="font-size:12px">${readiness >= 80 ? 'Ready for unsupervised delivery.' : readiness >= 40 ? 'On track — complete remaining bootcamp and shadowing items.' : 'Early in onboarding; assign a mentor and prioritise access provisioning.'}</div></div>`;

  const body = `
    <div class="row wrap mb8" style="gap:8px">${badge(STAGE_LABEL[c.lifecycle], 'tint-info')} ${sentimentPill(c.sentiment)}</div>
    <div class="field"><span class="field-key">Vendor</span><span class="field-val">${esc(c.vendor)}</span></div>
    <div class="field"><span class="field-key">Partner</span><span class="field-val">${esc(partner ? partner.name : '')}</span></div>
    <div class="field"><span class="field-key">POD</span><span class="field-val">${esc(pod ? pod.name : '')} (${esc(pod ? pod.tz : '')})</span></div>
    <div class="field"><span class="field-key">Tracks</span><span class="field-val">${esc(c.tracks.join(', '))}</span></div>
    <div class="field"><span class="field-key">Tenure</span><span class="field-val">${c.tenureMonths} months</span></div>
    <div class="field"><span class="field-key">CPE / Quality</span><span class="field-val">${c.cpe.toFixed(1)} / ${c.quality.toFixed(1)}</span></div>
    <div class="section-title">Lifecycle</div>${timeline}
    ${stageSection}`;

  openDrawer(`${esc(c.name)}`, body);
}
