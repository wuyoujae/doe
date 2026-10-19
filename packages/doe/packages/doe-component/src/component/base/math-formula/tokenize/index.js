import { isLetter as __doeFn_isLetter } from '../is-letter/index.js';
import { isDigit as __doeFn_isDigit } from '../is-digit/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:139
import { scope as __doeScope } from "../runtime/context/index.js";

export function tokenize(source) {
    const tokens = [];
    const text = String(source || "");
    let index = 0;

    function readBalancedText() {
      // Assumes the current char is '{'. Captures until the matching '}'.
      let depth = 0;
      let start = index;
      let out = "";
      while (index < text.length) {
        const char = text[index];
        if (char === "\\" && index + 1 < text.length) {
          out += char + text[index + 1];
          index += 2;
          continue;
        }
        if (char === "{") {
          depth += 1;
          if (depth === 1) {
            index += 1;
            start = index;
            continue;
          }
          out += char;
        } else if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            return { raw: out, consumed: index - start };
          }
          out += char;
        } else {
          out += char;
        }
        index += 1;
      }
      index = start;
      return null;
    }

    while (index < text.length) {
      const char = text[index];

      if (char === "%") {
        while (index < text.length && text[index] !== "\n") index += 1;
        continue;
      }

      if (char === "\\") {
        const next = text[index + 1];
        if (next === undefined) {
          tokens.push({ type: "cmd", value: "", pos: index });
          index += 1;
          continue;
        }
        if ((0, __doeFn_isLetter)(next)) {
          let start = index + 1;
          while (start < text.length && (0, __doeFn_isLetter)(text[start])) start += 1;
          tokens.push({ type: "cmd", value: text.slice(index + 1, start), pos: index });
          index = start;
          continue;
        }
        const mapped = __doeScope.CTRL_MAP[next];
        if (mapped && next !== " ") {
          tokens.push({ type: mapped.type, value: mapped.value, pos: index });
          index += 2;
          continue;
        }
        if (mapped && next === " ") {
          tokens.push({ type: "space-ctrl", value: " ", pos: index });
          index += 2;
          continue;
        }
        if (next === "," || next === ":" || next === ";" || next === "!") {
          tokens.push({ type: "space-ctrl", value: next, pos: index });
          index += 2;
          continue;
        }
        if (__doeScope.SPACING_MAP[next] !== undefined) {
          tokens.push({ type: "space-ctrl", value: next, pos: index });
          index += 2;
          continue;
        }
        // Unknown escaped control symbol: keep it literal.
        tokens.push({ type: "sym", value: next, pos: index });
        index += 2;
        continue;
      }

      if (char === " " || char === "\n" || char === "\t") {
        index += 1;
        continue;
      }
      if (char === "{") { tokens.push({ type: "lbrace", pos: index }); index += 1; continue; }
      if (char === "}") { tokens.push({ type: "rbrace", pos: index }); index += 1; continue; }
      if (char === "^") { tokens.push({ type: "sup", pos: index }); index += 1; continue; }
      if (char === "_") { tokens.push({ type: "sub", pos: index }); index += 1; continue; }
      if (char === "&") { tokens.push({ type: "amp", pos: index }); index += 1; continue; }
      if ((0, __doeFn_isLetter)(char)) {
        tokens.push({ type: "char", value: char, pos: index });
        index += 1;
        continue;
      }
      if ((0, __doeFn_isDigit)(char)) {
        let start = index;
        while (start < text.length && (0, __doeFn_isDigit)(text[start])) start += 1;
        tokens.push({ type: "digit", value: text.slice(index, start), pos: index });
        index = start;
        continue;
      }
      tokens.push({ type: "sym", value: char, pos: index });
      index += 1;
    }
    tokens.push({ type: "eof" });
    return tokens;
  }
