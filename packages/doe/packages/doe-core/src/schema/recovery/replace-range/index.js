// Origin: public/yrkie-doe/core/schema-json-recovery.js:205


export function replaceRange(text, index, removeCount, insert) {
    return `${text.slice(0, index)}${insert}${text.slice(index + removeCount)}`;
  }
