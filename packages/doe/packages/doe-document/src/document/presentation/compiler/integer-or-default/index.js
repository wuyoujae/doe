// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:124


export function integerOrDefault(value, minimum, maximum, defaultValue) {
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric >= minimum && numeric <= maximum
      ? numeric
      : defaultValue;
  }
