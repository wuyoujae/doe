// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8038


export function paintedRectForShell(shell) {
    // Work/Studio deliberately paints full-bleed media one design pixel past
    // its viewport to absorb fractional canvas scaling seams. That paint is
    // clipped by the owning Slide and does not occupy layout space, so sibling
    // collision checks must use the media slot rather than the expanded image.
    if (
      shell.dataset.layoutRegion === "media" &&
      shell.parentElement?.dataset.layoutVariant === "edge-media"
    ) {
      return shell.getBoundingClientRect();
    }
    const directChildren = [...shell.children];
    const blockContent = directChildren.find((child) =>
      child.classList?.contains("block-content"),
    );
    const visual = blockContent?.firstElementChild || shell;
    return visual.getBoundingClientRect();
  }
