// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:188


export function pascalCaseIconName(value) {
    return String(value || "atom")
      .trim()
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }
