// Origin: public/yrkie-doe/components/data-table/data-table.js:189


export function directRowCapacity(host, configuredHeight) {
    let resolved = Math.max(0, Number(configuredHeight) || 0);
    const shell = host.closest(".flow-block, .group-item");
    const rowSurface = host.closest(
      '.layout-group__content[data-composition-direction="row"], .layout-group__content[data-layout-variant="row"]',
    );
    // Only a direct sibling may borrow the row's established height. Nested
    // stacks have their own reserved text/spacing budget supplied by the
    // layout engine through configuredHeight.
    if (shell && rowSurface && shell.parentElement === rowSurface) {
      resolved = Math.max(resolved, rowSurface.clientHeight || 0);
    }
    return Math.floor(resolved);
  }
