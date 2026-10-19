import { hideCollidingLabels } from '../../../../shared/chart/tooltip/geometry/index.js';
import { placeValueLabels as __doeFn_placeValueLabels } from '../place-value-labels/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:296


export function fitLabels(host, field, size, interactive = false) {
    const slots = [...host.querySelectorAll('.ppt-grouped-bar-chart__bar-slot')];
    if (!field.clientWidth || !slots.length) return;
    const yTicks = [...host.querySelectorAll('.ppt-grouped-bar-chart__y-tick')];
    const axisWidth = Math.max(size.yAxisWidth, ...yTicks.map(tick => tick.offsetWidth + 22));
    host.style.setProperty('--y-axis-width', `${axisWidth}px`);
    let headroom = Math.max(24, ...slots.map(slot => slot.firstChild.offsetHeight + 10));
    if (interactive) {
      host.style.setProperty('--value-headroom', `${headroom}px`);
      slots.forEach(slot => { const label = slot.querySelector('.ppt-grouped-bar-chart__value'); label.style.removeProperty('bottom'); label.style.removeProperty('left'); });
      hideCollidingLabels(host);
    }
    for (let pass = 0; !interactive && pass < 16; pass++) {
      host.style.setProperty('--value-headroom', `${headroom}px`);
      // Extremely dense content grows the component so the parent can reflow
      // or reject an overfull slide, rather than silently clipping its labels.
      if (field.clientHeight < 120) {
        size.height += 120 - field.clientHeight;
        host.style.height = `${size.height}px`;
      }
      const rect = field.getBoundingClientRect();
      const scaleX = rect.width / field.clientWidth || 1;
      const labels = slots.map(slot => {
        const label = slot.querySelector('.ppt-grouped-bar-chart__value');
        label.style.maxWidth = `${field.clientWidth}px`;
        const slotRect = slot.getBoundingClientRect();
        return { label, x: (slotRect.left - rect.left + slotRect.width / 2) / scaleX,
          width: label.offsetWidth, height: label.offsetHeight,
          fraction: parseFloat(slot.style.getPropertyValue('--bar-height')) / 100 };
      });
      const placed = (0, __doeFn_placeValueLabels)(labels, field.clientWidth, slots[0]?.clientHeight || field.clientHeight);
      let excess = 0;
      placed.forEach((entry, index) => {
        entry.label.style.bottom = `${entry.bottom}px`;
        entry.label.style.left = `calc(50% + ${entry.x - labels[index].x}px)`;
        excess = Math.max(excess, entry.bottom + entry.height - field.clientHeight - headroom);
      });
      if (excess <= 0.5) break;
      headroom += excess + 2;
    }
    // Keep dense authored scales readable without changing the underlying axis.
    const labelHeight = Math.max(1, ...yTicks.map(tick => tick.offsetHeight));
    const stride = Math.max(1, Math.ceil((yTicks.length - 1) * (labelHeight + 5) / field.clientHeight));
    yTicks.forEach((tick, index) => { tick.style.visibility = index % stride === 0 || index === yTicks.length - 1 ? '' : 'hidden'; });
  }
