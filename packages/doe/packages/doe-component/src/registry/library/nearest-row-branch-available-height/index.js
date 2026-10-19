import { isRowSurface as __doeFn_isRowSurface } from '../is-row-surface/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:531
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function nearestRowBranchAvailableHeight(root, shell) {
    if (!root || !shell) return 0;
    const rowSurface = root.closest(__doeScope.ROW_SURFACE_SELECTOR);
    if (!rowSurface) return 0;
    const slide = root.closest(".schema-slide");
    const slideRect = slide?.getBoundingClientRect?.();
    if (!slide || !slideRect?.height) return 0;
    const scaleY = slide.clientHeight / slideRect.height;

    let branch = shell;
    while (branch && branch.parentElement !== rowSurface) {
      const parentBranch = branch.parentElement?.closest?.(".group-item");
      if (!parentBranch || parentBranch === branch) return 0;
      branch = parentBranch;
    }
    if (!branch || branch.parentElement !== rowSurface) return 0;

    const branchRect = branch.getBoundingClientRect?.();
    if (!branchRect?.height) return 0;
    const rowRect = rowSurface.getBoundingClientRect?.();
    let occupied = 0;
    let current = shell;
    while (current && current !== branch) {
      const parent = current.parentElement;
      if (!parent) return 0;
      const isStackFlow =
        parent.classList?.contains("layout-group__content") &&
        !(0, __doeFn_isRowSurface)(parent);
      if (isStackFlow) {
        const siblings = [...parent.children].filter((item) => item !== current);
        siblings.forEach((sibling) => {
          const style = __doeScope.global.getComputedStyle?.(sibling);
          const rect = sibling.getBoundingClientRect?.();
          if (style?.display !== "none" && rect?.height > 0) {
            occupied += rect.height * scaleY;
          }
        });
        if (siblings.length) {
          const parentStyle = __doeScope.global.getComputedStyle?.(parent);
          const gap = Number.parseFloat(parentStyle?.rowGap || parentStyle?.gap) || 0;
          occupied += gap * siblings.length;
        }
      }
      current = parent.closest?.(".group-item") || null;
    }
    // A content-fit sibling (notably a table) may be shorter than the row that
    // an adjacent chart already established.  That difference is usable
    // reflow space: the table may restore its semantic font and grow through
    // wrapping without changing either column width or the row's geometry.
    // Stretch components already have branchRect === rowRect, so this does not
    // alter their existing sizing contract.
    const assignedBranchHeight =
      branch === shell && branch.parentElement === rowSurface && rowRect?.height
        ? Math.max(branchRect.height, rowRect.height)
        : branchRect.height;
    return Math.max(0, Math.floor(assignedBranchHeight * scaleY - occupied));
  }
