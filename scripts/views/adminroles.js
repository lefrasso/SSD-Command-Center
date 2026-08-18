// Roles & Permissions — Platform Admin only. Manage which personas can access each module,
// and which capability permissions they hold. Analyzed across every module/permission in Compass.
import { store, roleHasModuleAccess, isModuleAccessOverridden, setModuleAccess, resetModuleAccess, resetAllModuleAccess } from '../store.js';
import {
  PERSONAS, ROLE_ORDER, ALL_PERMISSIONS, PERMISSION_LABELS,
  can, isPermissionOverridden, setPermissionOverride, resetPermissionOverride,
} from '../roles.js';
import { MODULES, NAV_GROUPS } from '../nav.js';
import { pageHeader, esc, aiChip } from '../components.js';
import { icon } from '../icons.js';

// The admin console itself is always Admin-only — excluded from the editable matrices so no
// role can self-escalate into managing roles & permissions, and Admin can't lock themselves out.
const EDITABLE_MODULES = MODULES.filter((m) => m.id !== 'admin-access');
const EDITABLE_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p !== 'manage:accessControl');
const groupTitleFor = (moduleId) => (NAV_GROUPS.find((g) => g.ids.includes(moduleId)) || {}).title || 'Other';

let tab = 'modules';

export function renderAdminRoles(container) {
  container.innerHTML = `
    ${pageHeader({
      title: 'Roles & Permissions',
      description: 'Platform Admin only — manage which personas can access each Compass module and which capability permissions they hold.',
      actions: aiChip('Governance'),
    })}
    <div class="tabs">
      <div class="tab ${tab === 'modules' ? 'active' : ''}" data-tab="modules">Module access</div>
      <div class="tab ${tab === 'permissions' ? 'active' : ''}" data-tab="permissions">Capability permissions</div>
      <div class="tab ${tab === 'personas' ? 'active' : ''}" data-tab="personas">Personas</div>
    </div>
    <div id="tabc"></div>`;

  container.querySelectorAll('[data-tab]').forEach((el) => el.addEventListener('click', () => { tab = el.getAttribute('data-tab'); renderAdminRoles(container); }));
  const tc = container.querySelector('#tabc');
  if (tab === 'modules') renderModuleMatrix(tc, container);
  else if (tab === 'permissions') renderPermissionMatrix(tc, container);
  else renderPersonas(tc);
}

function renderPersonas(tc) {
  const orgs = [...new Set(ROLE_ORDER.map((r) => PERSONAS[r].org))];
  tc.innerHTML = `
    <div class="muted mb16" style="font-size:12px">Every persona Compass models today, grouped by organization. Use these as the reference when assigning module access and permissions below.</div>
    ${orgs.map((org) => `
      <div class="section-title">${esc(org)}</div>
      <div class="persona-grid mb16">
        ${ROLE_ORDER.filter((r) => PERSONAS[r].org === org).map((r) => { const p = PERSONAS[r]; return `
          <div class="persona-card">
            <span class="avatar" style="background:${p.color}">${esc(p.initials)}</span>
            <div class="persona-body">
              <div class="persona-name">${esc(p.name)}</div>
              <div class="persona-title">${esc(p.title)}</div>
              <div class="persona-scope">${esc(p.scope)}</div>
            </div>
          </div>`; }).join('')}
      </div>`).join('')}`;
}

function renderModuleMatrix(tc, container) {
  const overrideCount = ROLE_ORDER.reduce((s, r) => s + EDITABLE_MODULES.filter((m) => isModuleAccessOverridden(r, m.id)).length, 0);
  tc.innerHTML = `
    <div class="row wrap mb8" style="justify-content:space-between">
      <div class="muted" style="font-size:12px;max-width:640px">Checked = that persona sees the module in navigation and can open it. Highlighted cells are Admin overrides layered over the default access model.</div>
      <button class="btn sm" id="reset-all-modules" ${overrideCount ? '' : 'disabled'}>${icon('wrench', 14)} Reset all overrides (${overrideCount})</button>
    </div>
    <div class="table-wrap">
      <table class="access-matrix">
        <thead><tr>
          <th class="row-label">Module</th>
          ${ROLE_ORDER.map((r) => `<th class="col-label" title="${esc(PERSONAS[r].title)}">${esc(PERSONAS[r].initials)}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${EDITABLE_MODULES.map((m) => `
            <tr>
              <td class="row-label">${esc(m.label)}<div class="muted" style="font-size:10.5px;font-weight:400">${esc(groupTitleFor(m.id))}</div></td>
              ${ROLE_ORDER.map((r) => { const checked = roleHasModuleAccess(r, m.id); const ov = isModuleAccessOverridden(r, m.id); return `<td class="${ov ? 'ov' : ''}"><input type="checkbox" data-role="${r}" data-mod="${m.id}" ${checked ? 'checked' : ''} aria-label="${esc(PERSONAS[r].name)} — ${esc(m.label)}"/></td>`; }).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="muted mt8" style="font-size:11px">The Roles & Permissions module itself is always Admin-only and isn't reassignable here.</div>`;

  tc.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.addEventListener('change', () => {
    setModuleAccess(cb.getAttribute('data-role'), cb.getAttribute('data-mod'), cb.checked);
    renderModuleMatrix(tc, container);
  }));
  const resetBtn = tc.querySelector('#reset-all-modules');
  if (resetBtn) resetBtn.addEventListener('click', () => { resetAllModuleAccess(); renderModuleMatrix(tc, container); });
}

function renderPermissionMatrix(tc, container) {
  const overrideCount = ROLE_ORDER.reduce((s, r) => s + EDITABLE_PERMISSIONS.filter((p) => isPermissionOverridden(r, p)).length, 0);
  tc.innerHTML = `
    <div class="row wrap mb8" style="justify-content:space-between">
      <div class="muted" style="font-size:12px;max-width:640px">Fine-grained capabilities used across Compass (e.g. approving success stories, editing PIPs). Changes apply the next time an affected view renders.</div>
      ${overrideCount ? `<button class="btn sm" id="reset-all-perms">${icon('wrench', 14)} Reset all overrides (${overrideCount})</button>` : ''}
    </div>
    <div class="table-wrap">
      <table class="access-matrix">
        <thead><tr>
          <th class="row-label">Permission</th>
          ${ROLE_ORDER.map((r) => `<th class="col-label" title="${esc(PERSONAS[r].title)}">${esc(PERSONAS[r].initials)}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${EDITABLE_PERMISSIONS.map((perm) => `
            <tr>
              <td class="row-label">${esc(PERMISSION_LABELS[perm] || perm)}</td>
              ${ROLE_ORDER.map((r) => { const checked = can(r, perm); const ov = isPermissionOverridden(r, perm); return `<td class="${ov ? 'ov' : ''}"><input type="checkbox" data-role="${r}" data-perm="${perm}" ${checked ? 'checked' : ''} aria-label="${esc(PERSONAS[r].name)} — ${esc(perm)}"/></td>`; }).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="muted mt8" style="font-size:11px">${esc('manage:accessControl')} is fixed to Platform Admin and isn't shown here.</div>`;

  tc.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.addEventListener('change', () => {
    setPermissionOverride(cb.getAttribute('data-role'), cb.getAttribute('data-perm'), cb.checked);
    renderPermissionMatrix(tc, container);
  }));
  const resetBtn = tc.querySelector('#reset-all-perms');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    ROLE_ORDER.forEach((r) => EDITABLE_PERMISSIONS.forEach((p) => resetPermissionOverride(r, p)));
    renderPermissionMatrix(tc, container);
  });
}
