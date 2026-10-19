import { verticalReserveAfter as __doeFn_verticalReserveAfter } from '../vertical-reserve-after/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:414
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function rootFlowCapacityFor(shell, layoutElement, scaleY) {
    if (!shell || !layoutElement) return 0;
    let rootShell = shell;
    const visited = new Set();
    while (
      rootShell &&
      rootShell.parentElement !== layoutElement &&
      !visited.has(rootShell)
    ) {
      visited.add(rootShell);
      const next = rootShell.parentElement?.closest?.(
        ".flow-block, .group-item",
      );
      if (!next || next === rootShell) return 0;
      rootShell = next;
    }
    if (!rootShell || rootShell.parentElement !== layoutElement) return 0;

    const layoutStyle = __doeScope.global.getComputedStyle?.(layoutElement);
    const paddingTop = Number.parseFloat(layoutStyle?.paddingTop || "0") || 0;
    const paddingBottom =
      Number.parseFloat(layoutStyle?.paddingBottom || "0") || 0;
    const rootGap =
      Number.parseFloat(layoutStyle?.rowGap || layoutStyle?.gap || "0") || 0;
    const rootShells = [...layoutElement.children].filter((child) =>
      child.classList?.contains("flow-block"),
    );
    const siblingHeight = rootShells
      .filter((candidate) => candidate !== rootShell)
      .reduce((sum, candidate) => {
        const style = __doeScope.global.getComputedStyle?.(candidate);
        const rect = candidate.getBoundingClientRect?.();
        return style?.display === "none" || !rect?.height
          ? sum
          : sum + rect.height * scaleY;
      }, 0);
    const rootCapacity = Math.max(
      0,
      layoutElement.clientHeight -
        paddingTop -
        paddingBottom -
        siblingHeight -
        rootGap * Math.max(0, rootShells.length - 1),
    );
    const rootRect = rootShell.getBoundingClientRect?.();
    const shellRect = shell.getBoundingClientRect?.();
    if (!rootRect || !shellRect) return 0;
    const offsetWithinRoot = Math.max(
      0,
      (shellRect.top - rootRect.top) * scaleY,
    );
    const reservedWithinRoot = (0, __doeFn_verticalReserveAfter)(
      shell,
      rootShell,
      scaleY,
    );
    return Math.max(
      0,
      Math.floor(rootCapacity - offsetWithinRoot - reservedWithinRoot),
    );
  }
