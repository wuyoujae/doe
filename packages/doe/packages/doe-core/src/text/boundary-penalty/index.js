// Origin: public/yrkie-doe/core/semantic-text-layout.js:179
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function boundaryPenalty(line, nextLine) {
    let penalty = 0;
    if (__doeScope.FORBIDDEN_LINE_END.test(line)) penalty += 100000;
    if (nextLine && __doeScope.FORBIDDEN_LINE_START.test(nextLine)) penalty += 100000;
    if ([...line.replace(/\s/gu, "")].length === 1) penalty += 8000;
    if (nextLine && [...nextLine.replace(/\s/gu, "")].length === 1) {
      penalty += 6500;
    }
    // Function words are preferences, not punctuation prohibitions. A blanket
    // ban on conjunctions at either edge used to leave large avoidable gaps.
    if (/[第在为对将把被由从向以]$/u.test(line)) penalty += 90;
    if (nextLine && /^[的了着]/u.test(nextLine)) penalty += 120;
    if (/[与和及或而但并]$/u.test(line)) penalty += 55;
    if (/\b(?:a|an|the|of|to|for)$/iu.test(line)) penalty += 90;
    if (nextLine && /^(?:of|to)\b/iu.test(nextLine)) penalty += 45;
    if (nextLine && !/[。！？；，、：.!?;,:]$/u.test(line)) penalty += 18;
    return penalty;
  }
