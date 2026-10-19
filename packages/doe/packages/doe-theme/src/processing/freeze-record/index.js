// Origin: public/yrkie-doe/core/theme.js:22


export function freezeRecord(value) {
    Object.values(value).forEach((entry) => {
      if (entry && typeof entry === "object" && !Object.isFrozen(entry)) {
        (0, freezeRecord)(entry);
      }
    });
    return Object.freeze(value);
  }
