// Origin: public/yrkie-doe/layout-engine/components.js:135


export function mediaRowPeerHeight(root) {
    if (typeof root.closest !== "function") return 0;
    const item = root.closest(".group-item");
    const row = item?.parentElement;
    if (!row || row.dataset?.compositionDirection !== "row") return 0;
    return [...row.children].reduce((maximum, sibling) => {
      if (sibling === item) return maximum;
      const content = sibling.querySelector?.(":scope > .block-content");
      const visual = content?.firstElementChild || content;
      const height = Math.max(
        Number(visual?.scrollHeight) || 0,
        Number(visual?.offsetHeight) || 0,
        Number(content?.scrollHeight) || 0,
      );
      return Math.max(maximum, height);
    }, 0);
  }
