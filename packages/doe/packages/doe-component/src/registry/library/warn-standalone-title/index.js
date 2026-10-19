// Origin: public/yrkie-doe/layout-engine/library-components.js:59


export function warnStandaloneTitle(props, warnings, type) {
    if (props.title) {
      warnings.push(`${type}.title is not rendered; use a separate heading or text node.`);
    }
  }
