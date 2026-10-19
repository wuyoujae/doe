// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5102


export function structuralDirectionSignature(attempt) {
    return JSON.stringify(
      [...(attempt?.structuralLayouts || [])]
        .map(([id, layout]) => [id, layout?.direction || "auto"])
        .sort(([left], [right]) => String(left).localeCompare(String(right))),
    );
  }
