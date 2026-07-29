// Placeholder for modules not yet built (Phase 2) and role-locked modules.
import { pageHeader, badge } from '../components.js';
import { icon } from '../icons.js';

export function renderPlaceholder(container, module, locked) {
  container.innerHTML = `
    ${pageHeader({
      title: module.label,
      description: module.description,
      actions: badge(locked ? 'Restricted' : 'Planned · Phase 2', locked ? 'tint-danger' : 'tint-info'),
    })}
    <div class="card pad" style="display:flex; gap:16px; align-items:flex-start">
      <span class="tile-ico" style="width:48px;height:48px">${icon(locked ? 'lock' : 'wrench', 24)}</span>
      <div style="display:flex; flex-direction:column; gap:10px">
        <div style="font-weight:600; font-size:16px">
          ${locked ? 'Confidential — restricted to POD Lead and HR-equivalent roles.' : 'This module is specified and scheduled for the next build phase.'}
        </div>
        <div class="muted">
          ${locked
            ? 'Switch to the POD Lead persona to preview Performance &amp; PIPs. Performance and sentiment signals are advisory inputs to a manager’s judgement, never automated decisions.'
            : 'The shell, System of Records, role switching and Copilot are live now. This view will read and write the same SSD IQ data as the rest of Compass.'}
        </div>
        <div class="cp-ctx" style="max-width:640px; display:flex; gap:8px; align-items:center">
          ${icon('sparkle', 18)}
          <span><strong>Signature AI:</strong> ${module.ai}</span>
        </div>
      </div>
    </div>`;
}
