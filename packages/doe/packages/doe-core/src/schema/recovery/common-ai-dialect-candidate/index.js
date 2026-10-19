import { smartQuoteCandidate as __doeFn_smartQuoteCandidate } from '../smart-quote-candidate/index.js';
import { singleQuotedStringCandidates as __doeFn_singleQuotedStringCandidates } from '../single-quoted-string-candidates/index.js';
import { applyCandidateEntries as __doeFn_applyCandidateEntries } from '../apply-candidate-entries/index.js';
import { commentCandidate as __doeFn_commentCandidate } from '../comment-candidate/index.js';
import { bareKeyCandidates as __doeFn_bareKeyCandidates } from '../bare-key-candidates/index.js';
import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
import { nextNonWhitespace as __doeFn_nextNonWhitespace } from '../next-non-whitespace/index.js';
import { scanStructure as __doeFn_scanStructure } from '../scan-structure/index.js';
import { replaceRange as __doeFn_replaceRange } from '../replace-range/index.js';
import { wholeDocumentCandidate as __doeFn_wholeDocumentCandidate } from '../whole-document-candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:469
import { scope as __doeScope } from "../runtime/context/index.js";

export function commonAiDialectCandidate(text) {
    let repaired = text;
    const normalized = [];

    const smartQuotes = (0, __doeFn_smartQuoteCandidate)(repaired);
    if (smartQuotes) {
      repaired = smartQuotes.text;
      normalized.push("弯引号");
    }

    const singleQuotes = (0, __doeFn_singleQuotedStringCandidates)(repaired);
    if (singleQuotes.length) {
      repaired = (0, __doeFn_applyCandidateEntries)(repaired, singleQuotes);
      normalized.push("单引号字符串");
    }

    const comments = (0, __doeFn_commentCandidate)(repaired);
    if (comments) {
      repaired = comments.text;
      normalized.push("注释");
    }

    const bareKeys = (0, __doeFn_bareKeyCandidates)(repaired);
    if (bareKeys.length) {
      repaired = (0, __doeFn_applyCandidateEntries)(repaired, bareKeys);
      normalized.push("裸属性名");
    }

    const lexical = (0, __doeFn_lexicalInfo)(repaired);
    const pythonLiterals = { True: "true", False: "false", None: "null" };
    const literalEntries = [];
    Object.entries(pythonLiterals).forEach(([source, replacement]) => {
      const pattern = new RegExp(`\\b${source}\\b`, "g");
      let match;
      while ((match = pattern.exec(repaired))) {
        if (!lexical.outside[match.index]) continue;
        literalEntries.push({
          index: match.index,
          removeCount: source.length,
          insert: replacement,
        });
      }
    });
    if (literalEntries.length) {
      repaired = (0, __doeFn_applyCandidateEntries)(repaired, literalEntries);
      normalized.push("非 JSON 字面量");
    }

    const trailingCommas = [];
    for (let comma = 0; comma < repaired.length; comma += 1) {
      if (repaired[comma] !== ",") continue;
      const next = (0, __doeFn_nextNonWhitespace)(repaired, comma + 1);
      if (next !== -1 && __doeScope.CLOSE.has(repaired[next])) {
        trailingCommas.push({ index: comma, removeCount: 1, insert: "" });
      }
    }
    if (trailingCommas.length) {
      repaired = (0, __doeFn_applyCandidateEntries)(repaired, trailingCommas);
      normalized.push("尾随逗号");
    }

    let structure = (0, __doeFn_scanStructure)(repaired);
    if (structure.mismatch?.expected) {
      const current = structure.mismatch.index;
      const next = (0, __doeFn_nextNonWhitespace)(repaired, current + 1);
      const outerExpected = structure.mismatch.stack[structure.mismatch.stack.length - 2]?.close || null;
      if (
        next !== -1 &&
        __doeScope.CLOSE.has(repaired[next]) &&
        repaired[next] === structure.mismatch.expected &&
        outerExpected === structure.mismatch.actual
      ) {
        const between = repaired.slice(current + 1, next);
        repaired = (0, __doeFn_replaceRange)(
          repaired,
          current,
          next - current + 1,
          `${structure.mismatch.expected}${between}${structure.mismatch.actual}`,
        );
        normalized.push("写反的闭合符号");
        structure = (0, __doeFn_scanStructure)(repaired);
      }
    }

    if (!structure.inString && !structure.mismatch && structure.stack.length) {
      const closers = structure.stack
        .slice()
        .reverse()
        .map((entry) => entry.close)
        .join("");
      if (closers.length <= 4) {
        repaired += closers;
        normalized.push("末尾缺失的闭合符号");
      }
    }

    if (normalized.length < 2 || repaired === text) return null;
    return (0, __doeFn_wholeDocumentCandidate)(
      "normalize-common-ai-json-dialect",
      text,
      repaired,
      0,
      { before: normalized.join("、"), after: "严格 JSON" },
      0,
    );
  }
