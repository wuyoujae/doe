// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7516


export function naturalEqualHeightItemSize(shell) {
    const layoutContent = [...shell.children].find(
      (child) =>
        child.classList?.contains("block-content") ||
        child.classList?.contains("layout-group__content"),
    );
    const measured = layoutContent || shell;
    return Math.ceil(
      Math.max(
        measured.scrollHeight || 0,
        measured.getBoundingClientRect?.().height || 0,
      ),
    );
  }
