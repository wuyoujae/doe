import { scanStructure as __doeFn_scanStructure } from '../scan-structure/index.js';
import { errorPosition as __doeFn_errorPosition } from '../error-position/index.js';
import { commonAiDialectCandidate as __doeFn_commonAiDialectCandidate } from '../common-ai-dialect-candidate/index.js';
import { candidate as __doeFn_candidate } from '../candidate/index.js';
import { smartQuoteCandidate as __doeFn_smartQuoteCandidate } from '../smart-quote-candidate/index.js';
import { commentCandidate as __doeFn_commentCandidate } from '../comment-candidate/index.js';
import { singleQuotedStringCandidates as __doeFn_singleQuotedStringCandidates } from '../single-quoted-string-candidates/index.js';
import { bareKeyCandidates as __doeFn_bareKeyCandidates } from '../bare-key-candidates/index.js';
import { bareKeyMissingColonCandidates as __doeFn_bareKeyMissingColonCandidates } from '../bare-key-missing-colon-candidates/index.js';
import { unquotedValueCandidates as __doeFn_unquotedValueCandidates } from '../unquoted-value-candidates/index.js';
import { combinedCandidate as __doeFn_combinedCandidate } from '../combined-candidate/index.js';
import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
import { nextNonWhitespace as __doeFn_nextNonWhitespace } from '../next-non-whitespace/index.js';
import { previousNonWhitespace as __doeFn_previousNonWhitespace } from '../previous-non-whitespace/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:576
import { scope as __doeScope } from "../runtime/context/index.js";

export function generateCandidates(text, error) {
    const candidates = [];
    const scan = (0, __doeFn_scanStructure)(text);
    const parsedPosition = (0, __doeFn_errorPosition)(text, error);
    const position = scan.mismatch?.index ?? parsedPosition ?? text.length;

    const commonDialect = (0, __doeFn_commonAiDialectCandidate)(text);
    if (commonDialect) candidates.push(commonDialect);

    if (text.charCodeAt(0) === 0xfeff) {
      candidates.push((0, __doeFn_candidate)("remove-byte-order-mark", text, 0, 1, "", "BOM", "", 1));
    }

    const smartQuotes = (0, __doeFn_smartQuoteCandidate)(text);
    if (smartQuotes) candidates.push(smartQuotes);
    const comments = (0, __doeFn_commentCandidate)(text);
    if (comments) candidates.push(comments);
    const singleQuotedStrings = (0, __doeFn_singleQuotedStringCandidates)(text);
    const bareKeys = (0, __doeFn_bareKeyCandidates)(text);
    const bareKeysMissingColons = (0, __doeFn_bareKeyMissingColonCandidates)(text);
    const unquotedValues = (0, __doeFn_unquotedValueCandidates)(text);
    const combinedSingleQuotes = (0, __doeFn_combinedCandidate)(
      "convert-all-single-quoted-strings",
      text,
      singleQuotedStrings,
      2,
      "单引号字符串",
      "JSON 双引号字符串",
    );
    const combinedBareKeys = (0, __doeFn_combinedCandidate)(
      "quote-all-bare-property-names",
      text,
      bareKeys,
      2,
      "未加引号的属性名",
      "双引号属性名",
    );
    const combinedBareValues = (0, __doeFn_combinedCandidate)(
      "quote-all-bare-string-values",
      text,
      unquotedValues,
      4,
      "未加引号的字符串值",
      "双引号字符串值",
    );
    candidates.push(...(combinedSingleQuotes ? [combinedSingleQuotes] : singleQuotedStrings));
    candidates.push(...(combinedBareKeys ? [combinedBareKeys] : bareKeys));
    candidates.push(...bareKeysMissingColons);
    candidates.push(...(combinedBareValues ? [combinedBareValues] : unquotedValues));

    const lexical = (0, __doeFn_lexicalInfo)(text);
    const pythonLiterals = { True: "true", False: "false", None: "null" };
    const literalCandidates = [];
    Object.entries(pythonLiterals).forEach(([source, replacement]) => {
      const pattern = new RegExp(`\\b${source}\\b`, "g");
      let match;
      while ((match = pattern.exec(text))) {
        if (!lexical.outside[match.index]) continue;
        literalCandidates.push(
          (0, __doeFn_candidate)(
            "normalize-non-json-literal",
            text,
            match.index,
            source.length,
            replacement,
            source,
            replacement,
            3,
          ),
        );
      }
    });
    const combinedLiterals = (0, __doeFn_combinedCandidate)(
      "normalize-all-non-json-literals",
      text,
      literalCandidates,
      2,
      "非 JSON 字面量",
      "JSON 字面量",
    );
    candidates.push(...(combinedLiterals ? [combinedLiterals] : literalCandidates));

    if (scan.mismatch?.expected) {
      const current = scan.mismatch.index;
      const next = (0, __doeFn_nextNonWhitespace)(text, current + 1);
      const outerExpected = scan.mismatch.stack[scan.mismatch.stack.length - 2]?.close || null;
      if (
        next !== -1 &&
        __doeScope.CLOSE.has(text[next]) &&
        text[next] === scan.mismatch.expected &&
        outerExpected === scan.mismatch.actual
      ) {
        const between = text.slice(current + 1, next);
        candidates.push(
          (0, __doeFn_candidate)(
            "swap-adjacent-closers",
            text,
            current,
            next - current + 1,
            `${scan.mismatch.expected}${between}${scan.mismatch.actual}`,
            `${scan.mismatch.actual}${between}${scan.mismatch.expected}`,
            `${scan.mismatch.expected}${between}${scan.mismatch.actual}`,
            1,
          ),
        );
      }
      candidates.push(
        (0, __doeFn_candidate)(
          "replace-mismatched-closer",
          text,
          current,
          1,
          scan.mismatch.expected,
          scan.mismatch.actual,
          scan.mismatch.expected,
          4,
        ),
      );
      candidates.push(
        (0, __doeFn_candidate)(
          "remove-extra-closer",
          text,
          current,
          1,
          "",
          scan.mismatch.actual,
          "",
          5,
        ),
      );
    } else if (scan.mismatch && !scan.mismatch.expected) {
      const opener = scan.mismatch.actual === "}" ? "{" : "[";
      const start = (0, __doeFn_nextNonWhitespace)(text, 0);
      candidates.push(
        (0, __doeFn_candidate)(
          "insert-missing-opener",
          text,
          start === -1 ? 0 : start,
          0,
          opener,
          "",
          opener,
          4,
        ),
      );
      candidates.push(
        (0, __doeFn_candidate)(
          "remove-extra-closer",
          text,
          scan.mismatch.index,
          1,
          "",
          scan.mismatch.actual,
          "",
          5,
        ),
      );
    }

    const tokenIndex = (0, __doeFn_nextNonWhitespace)(text, position);
    const closeIndex = tokenIndex !== -1 && __doeScope.CLOSE.has(text[tokenIndex]) ? tokenIndex : -1;
    if (closeIndex !== -1) {
      const previous = (0, __doeFn_previousNonWhitespace)(text, closeIndex - 1);
      if (previous !== -1 && text[previous] === ",") {
        candidates.push(
          (0, __doeFn_candidate)("remove-trailing-comma", text, previous, 1, "", ",", "", 2),
        );
      }
    }

    if (tokenIndex !== -1 && text[tokenIndex] === ",") {
      const previous = (0, __doeFn_previousNonWhitespace)(text, tokenIndex - 1);
      const next = (0, __doeFn_nextNonWhitespace)(text, tokenIndex + 1);
      if (previous !== -1 && text[previous] === ",") {
        candidates.push(
          (0, __doeFn_candidate)("remove-duplicate-comma", text, tokenIndex, 1, "", ",,", ",", 2),
        );
      } else if (next !== -1 && __doeScope.CLOSE.has(text[next])) {
        candidates.push(
          (0, __doeFn_candidate)("remove-trailing-comma", text, tokenIndex, 1, "", ",", "", 2),
        );
      }
    }

    // Some JS engines omit the absolute position for a trailing-comma error.
    // Enumerate only the structurally unmistakable `,}` / `,]` sites and still
    // require the complete repaired document to pass strict JSON.parse below.
    const allTrailingCommas = [];
    for (let comma = 0; comma < text.length; comma += 1) {
      if (text[comma] !== ",") continue;
      const next = (0, __doeFn_nextNonWhitespace)(text, comma + 1);
      if (next !== -1 && __doeScope.CLOSE.has(text[next])) {
        allTrailingCommas.push(
          (0, __doeFn_candidate)("remove-trailing-comma", text, comma, 1, "", ",", "", 2),
        );
      }
    }
    const combinedTrailingCommas = (0, __doeFn_combinedCandidate)(
      "remove-all-trailing-commas",
      text,
      allTrailingCommas,
      1,
      "尾随逗号",
      "",
    );
    if (combinedTrailingCommas) candidates.unshift(combinedTrailingCommas);
    else candidates.push(...allTrailingCommas);

    if (tokenIndex !== -1 && /["{[\d\-tfn]/.test(text[tokenIndex])) {
      const previous = (0, __doeFn_previousNonWhitespace)(text, tokenIndex - 1);
      if (previous !== -1 && /["}\]\d\w.]/.test(text[previous])) {
        candidates.push(
          (0, __doeFn_candidate)("insert-missing-comma", text, tokenIndex, 0, ",", "", ",", 3),
        );
      }
    }

    if (tokenIndex !== -1 && /[A-Za-z_$]/.test(text[tokenIndex])) {
      let keyEnd = tokenIndex + 1;
      while (keyEnd < text.length && /[\w$-]/.test(text[keyEnd])) keyEnd += 1;
      const colon = (0, __doeFn_nextNonWhitespace)(text, keyEnd);
      const previous = (0, __doeFn_previousNonWhitespace)(text, tokenIndex - 1);
      if (
        colon !== -1 &&
        text[colon] === ":" &&
        previous !== -1 &&
        /["}\]\d\w.]/.test(text[previous])
      ) {
        const key = text.slice(tokenIndex, keyEnd);
        candidates.push(
          (0, __doeFn_candidate)(
            "insert-comma-and-quote-property-name",
            text,
            tokenIndex,
            keyEnd - tokenIndex,
            `,${JSON.stringify(key)}`,
            key,
            `,${JSON.stringify(key)}`,
            2,
          ),
        );
      }
    }

    if (/expected\s+['"]?:['"]?/i.test(String(error?.message || ""))) {
      const insertion = tokenIndex === -1 ? position : tokenIndex;
      candidates.push(
        (0, __doeFn_candidate)("insert-missing-colon", text, insertion, 0, ":", "", ":", 2),
      );
    }

    if (scan.inString && scan.stringStart >= 0) {
      for (
        let delimiter = scan.stringStart + 1;
        delimiter < text.length && candidates.length < 32;
        delimiter += 1
      ) {
        if (!":,}]".includes(text[delimiter]) || text[delimiter - 1] === "\\") continue;
        candidates.push(
          (0, __doeFn_candidate)(
            "insert-missing-closing-quote",
            text,
            delimiter,
            0,
            '"',
            "",
            '"',
            3,
          ),
        );
      }

      let separator = scan.stringStart - 1;
      while (separator >= 0 && !"{[,:".includes(text[separator])) separator -= 1;
      if (separator >= 0) {
        const valueStart = (0, __doeFn_nextNonWhitespace)(text, separator + 1);
        if (
          valueStart !== -1 &&
          valueStart < scan.stringStart &&
          !/[{}[\],:]/.test(text.slice(valueStart, scan.stringStart))
        ) {
          candidates.push(
            (0, __doeFn_candidate)(
              "insert-missing-opening-quote",
              text,
              valueStart,
              0,
              '"',
              "",
              '"',
              3,
            ),
          );
        }
      }
    }

    for (let colon = 0; colon < text.length; colon += 1) {
      if (!lexical.outside[colon] || text[colon] !== ":") continue;
      const next = (0, __doeFn_nextNonWhitespace)(text, colon + 1);
      if (next !== -1 && text[next] === ":") {
        candidates.push(
          (0, __doeFn_candidate)("remove-duplicate-colon", text, next, 1, "", "::", ":", 2),
        );
      }
    }

    if (!scan.inString && !scan.mismatch && scan.stack.length && position >= text.length) {
      const closers = scan.stack
        .slice()
        .reverse()
        .map((entry) => entry.close)
        .join("");
      if (closers.length <= 4) {
        candidates.push(
          (0, __doeFn_candidate)("append-missing-closers", text, text.length, 0, closers, "", closers, 5),
        );
      }
    }

    const unique = new Map();
    candidates.forEach((entry) => {
      if (entry.text !== text && !unique.has(entry.text)) unique.set(entry.text, entry);
    });
    return [...unique.values()].slice(0, 32);
  }
