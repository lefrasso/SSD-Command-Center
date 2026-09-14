// Bootstrap — assembles the shell, wires routing, roles and the Copilot panel.
import { store, onChange, setRole, toggleNav, toggleCopilot, roleHasModuleAccess, modulesForRoleEffective } from './store.js';
import { PERSONAS, ROLE_ORDER, can } from './roles.js';
import { moduleById, NAV_GROUPS } from './nav.js';
import { parseHash, navigate, onRoute } from './router.js';
import { dataQualityFlags } from './ai.js';
import { esc, clearCharts, closeDrawer } from './components.js';
import { icon } from './icons.js';
import { renderHome } from './views/home.js';
import { renderSsdIq } from './views/ssdiq.js';
import { renderCapabilities } from './views/capabilities.js';
import { renderAgentic } from './views/agentic.js';
import { renderIpFeedback } from './views/ipfeedback.js';
import { renderCapacity } from './views/capacity.js';
import { renderPartners } from './views/partners.js';
import { renderEnablement } from './views/enablement.js';
import { renderPods } from './views/pods.js';
import { renderLifecycle } from './views/lifecycle.js';
import { renderEngagements } from './views/engagements.js';
import { renderSuccessStories } from './views/successstories.js';
import { renderReportsPending } from './views/reportspending.js';
import { renderMessages } from './views/messages.js';
import { renderQuality } from './views/quality.js';
import { renderEscalations } from './views/escalations.js';
import { renderPerformance } from './views/performance.js';
import { renderCsamEscalation } from './views/csamescalation.js';
import { renderReporting } from './views/reporting.js';
import { renderSessionHealth } from './views/sentiment.js';
import { renderAdminRoles } from './views/adminroles.js';
import { renderPlaceholder } from './views/placeholder.js';
import { renderCopilot } from './copilot.js';
import { renderAboutDrawer } from './about.js';

const app = document.getElementById('app');
const cb = document.getElementById('commandbar');
const navEl = document.getElementById('nav');
const copilotEl = document.getElementById('copilot');

function currentTheme() { return localStorage.getItem('compass-theme') || 'light'; }
function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); }
function toggleTheme() { const t = currentTheme() === 'dark' ? 'light' : 'dark'; localStorage.setItem('compass-theme', t); applyTheme(t); renderCommandBar(); renderView(); }

function renderCommandBar() {
  const p = PERSONAS[store.role];
  const flags = dataQualityFlags();
  cb.innerHTML = `
    <button class="icon-btn" id="nav-toggle" aria-label="Toggle navigation">${icon('menu', 20)}</button>
    <div class="brand"><img src="assets/compass.svg" width="28" height="28" alt=""/><div><div class="brand-name">Compass</div><div class="brand-sub">SSD Delivery Console</div></div></div>
    <div class="cmd-search"><span class="search-ico">${icon('search', 18)}</span><input id="global-search" aria-label="Search SSD IQ" placeholder="Search SSD IQ — partners, engagements, success stories…"/></div>
    <div class="cmd-spacer"></div>
    <div class="cmd-right">
      <button class="icon-btn" id="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">${icon(currentTheme() === 'dark' ? 'sun' : 'moon', 20)}</button>
      <button class="icon-btn" id="about-btn" aria-label="About & feedback" title="About & feedback">${icon('info', 20)}</button>
      <button class="ask-btn" id="ask-copilot">${icon('sparkle', 18)} Ask Copilot</button>
      <span class="menu-anchor">
        <button class="icon-btn" id="bell" aria-label="Notifications: ${flags.length} alerts">${icon('bell', 20)}${flags.length ? `<span class="bell-badge">${flags.length}</span>` : ''}</button>
        <div class="menu" id="bell-menu" hidden>${flags.slice(0, 6).map((f) => `<div class="menu-item" data-nav="/ssdiq"><span class="mi-title" style="font-size:12px">[${esc(f.severity)}] ${esc(f.message)}</span></div>`).join('') || '<div class="menu-item">No alerts</div>'}</div>
      </span>
      <span class="menu-anchor">
        <button class="role-btn" id="role-btn" aria-label="Current role ${esc(p.title)}. Switch role"><span class="avatar" style="background:${p.color}">${esc(p.initials)}</span><span class="role-text"><span class="role-name">${esc(p.name)}</span><span class="role-title">${esc(p.title)}</span></span>${icon('chevronDown', 16)}</button>
        <div class="menu" id="role-menu" hidden><div class="menu-label">View Compass as…</div>${ROLE_ORDER.map((r) => { const rp = PERSONAS[r]; return `<div class="menu-item ${r === store.role ? 'checked' : ''}" data-role="${r}"><span class="mi-title">${esc(rp.name)}</span><span class="mi-sub">${esc(rp.title)}</span></div>`; }).join('')}</div>
      </span>
    </div>`;

  cb.querySelector('#nav-toggle').onclick = toggleNav;
  cb.querySelector('#ask-copilot').onclick = () => toggleCopilot();
  cb.querySelector('#theme-toggle').onclick = toggleTheme;
  cb.querySelector('#about-btn').onclick = () => renderAboutDrawer();
  const gs = cb.querySelector('#global-search');
  gs.onkeydown = (e) => { if (e.key === 'Enter' && gs.value.trim()) navigate(`/ssdiq?q=${encodeURIComponent(gs.value.trim())}`); };

  const bell = cb.querySelector('#bell'); const bellMenu = cb.querySelector('#bell-menu');
  const roleBtn = cb.querySelector('#role-btn'); const roleMenu = cb.querySelector('#role-menu');
  bell.onclick = (e) => { e.stopPropagation(); bellMenu.hidden = !bellMenu.hidden; roleMenu.hidden = true; };
  roleBtn.onclick = (e) => { e.stopPropagation(); roleMenu.hidden = !roleMenu.hidden; bellMenu.hidden = true; };
  bellMenu.querySelectorAll('[data-nav]').forEach((el) => (el.onclick = () => { navigate(el.getAttribute('data-nav')); bellMenu.hidden = true; }));
  roleMenu.querySelectorAll('[data-role]').forEach((el) => (el.onclick = () => setRole(el.getAttribute('data-role'))));
}

function renderNav() {
  const items = modulesForRoleEffective(store.role);
  const { id: activeId } = parseHash();

  const navGroups = NAV_GROUPS.map((group) => {
    const sectionItems = group.ids.map((id) => items.find((m) => m.id === id)).filter(Boolean);
    if (!sectionItems.length) return '';

    return `
      <div class="nav-group">
        ${group.title ? `<div class="nav-group-title">${group.title}</div>` : ''}
        ${sectionItems.map((m) => `<a class="nav-item ${m.id === activeId ? 'active' : ''}" href="#${m.path}"><span class="nav-ico">${icon(m.icon, 20)}</span><span class="nav-label">${esc(m.label)}</span></a>`).join('')}
      </div>
    `;
  }).join('');

  navEl.innerHTML = `<div class="nav-list">${navGroups}</div><div class="nav-foot">Prototype · mock data · simulated AI</div>`;
}

onChange((reason) => {
  if (reason === 'role') {
    renderCommandBar();
    const mod = moduleById(parseHash().id);
    if (!mod || (!roleHasModuleAccess(store.role, mod.id) && mod.id !== 'performance')) navigate('/home');
    else renderView();
  } else if (reason === 'data' || reason === 'access') {
    renderCommandBar();
    renderView();
  } else {
    applyChrome();
  }
});

function applyChrome() {
  app.classList.toggle('nav-collapsed', store.navCollapsed);
  app.classList.toggle('copilot-hidden', !store.copilotOpen);
}

function renderView() {
  const { id, params } = parseHash();
  const mod = moduleById(id);
  if (!mod) { navigate('/home'); return; }
  if (!roleHasModuleAccess(store.role, mod.id) && mod.id !== 'performance') { navigate('/home'); return; }
  closeDrawer();
  clearCharts();
  const view = document.getElementById('view');
  switch (mod.id) {
    case 'home': renderHome(view); break;
    case 'pods': renderPods(view); break;
    case 'lifecycle': renderLifecycle(view); break;
    case 'engagements': renderEngagements(view); break;
    case 'success-stories': renderSuccessStories(view, params.get('q')); break;
    case 'reports-pending': renderReportsPending(view); break;
    case 'messages': renderMessages(view, params.get('thread') || params.get('q') || ''); break;
    case 'quality': renderQuality(view); break;
    case 'escalations': renderEscalations(view); break;
    case 'performance': can(store.role, 'view:pip') ? renderPerformance(view) : renderPlaceholder(view, mod, true); break;
    case 'reporting': renderReporting(view); break;
    case 'sentiment': renderSessionHealth(view, params.get('tab')); break;
    case 'ssdiq': renderSsdIq(view, params.get('q') || ''); break;
    case 'capabilities': renderCapabilities(view); break;
    case 'agentic': renderAgentic(view); break;
    case 'ip-feedback': renderIpFeedback(view); break;
    case 'capacity': renderCapacity(view); break;
    case 'delivery-partners': renderPartners(view); break;
    case 'enablement': renderEnablement(view, params.get('tab')); break;
    case 'csam-escalation': renderCsamEscalation(view); break;
    case 'admin-access': renderAdminRoles(view); break;
    default: renderPlaceholder(view, mod);
  }
  document.getElementById('content').scrollTop = 0;
  renderNav();
  renderCopilot(copilotEl);
}

onRoute(renderView);
document.addEventListener('click', () => cb.querySelectorAll('.menu').forEach((m) => (m.hidden = true)));

// Initial render
if (!location.hash) location.hash = '/home';
applyTheme(currentTheme());
renderCommandBar();
applyChrome();
renderView();
runBootSplash();

// Simulated component-loading splash — purely cosmetic, the data/render above is already complete.
// Steps are built from the real seeded dataset counts so the detail is meaningful, not just decorative.
function runBootSplash() {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  const list = document.getElementById('boot-steps');
  const d = store.data;
  const stepTexts = [
    'Connecting to SSD IQ…',
    `Loading org structure — ${d.pods.length} PODs across ${Object.keys(d.pods.reduce((acc, p) => { acc[p.tz] = 1; return acc; }, {})).length} time zones…`,
    `Loading roster — ${d.csas.length} CSAs (FTC + FTE) and ${d.partners.length} Delivery Partners…`,
    `Loading dispatch — ${d.engagements.length.toLocaleString()} engagement records…`,
    `Loading quality signals — ${d.cpe.length.toLocaleString()} CPE responses…`,
    `Loading escalations & actions — ${d.escalations.length} escalations, ${d.actions.length} actions…`,
    `Loading capacity & hiring — ${d.hiring.length} open requisitions, ${d.attrition.length} attrition records…`,
    'Initializing simulated AI layer…',
    'Applying your role & permissions…',
    'Rendering Compass…',
  ];
  if (list) list.innerHTML = stepTexts.map((t) => `<li data-step>${t}</li>`).join('');
  const steps = list ? [...list.querySelectorAll('[data-step]')] : [];
  const fill = document.getElementById('boot-bar-fill');
  let i = 0;
  const tick = () => {
    if (i > 0) steps[i - 1].classList.replace('active', 'done');
    if (i < steps.length) {
      steps[i].classList.add('active');
      if (fill) fill.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
      i += 1;
      setTimeout(tick, 380 + Math.round(Math.random() * 140));
    } else {
      setTimeout(() => {
        splash.classList.add('hide');
        setTimeout(() => splash.remove(), 450);
      }, 450);
    }
  };
  tick();
}
