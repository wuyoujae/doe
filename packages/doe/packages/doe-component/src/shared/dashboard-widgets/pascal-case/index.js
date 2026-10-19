// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:446


export function pascalCase(value) {
    return String(value || "")
      .trim()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }
