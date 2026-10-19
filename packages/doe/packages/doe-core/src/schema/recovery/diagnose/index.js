import { scanStructure as __doeFn_scanStructure } from '../scan-structure/index.js';
import { errorPosition as __doeFn_errorPosition } from '../error-position/index.js';
import { firstInvalidTokenPosition as __doeFn_firstInvalidTokenPosition } from '../first-invalid-token-position/index.js';
import { locationAt as __doeFn_locationAt } from '../location-at/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:146


export function diagnose(text, error) {
    const scan = (0, __doeFn_scanStructure)(text);
    const parserPosition = (0, __doeFn_errorPosition)(text, error);
    const position =
      scan.mismatch?.index ?? parserPosition ?? (0, __doeFn_firstInvalidTokenPosition)(text) ?? text.length;
    const location = (0, __doeFn_locationAt)(text, position);
    let reason = String(error?.message || "未知 JSON 语法错误");
    let kind = "json-syntax";

    if (scan.mismatch) {
      kind = "mismatched-closer";
      reason = scan.mismatch.expected
        ? `闭合符号顺序或类型错误：此处应为 ${scan.mismatch.expected}，实际为 ${scan.mismatch.actual}`
        : `出现了没有对应开始符号的 ${scan.mismatch.actual}`;
    } else if (scan.inString) {
      kind = "unterminated-string";
      reason = "字符串没有正确闭合";
    } else if (position >= text.length && scan.stack.length) {
      kind = "unclosed-container";
      reason = `JSON 提前结束，仍缺少 ${scan.stack
        .slice()
        .reverse()
        .map((entry) => entry.close)
        .join("")}`;
    } else if (/expected\s+['"]?:['"]?/i.test(String(error?.message || ""))) {
      kind = "missing-colon";
      reason = "对象属性名后缺少冒号";
    } else if (/property name/i.test(String(error?.message || ""))) {
      kind = "invalid-property-name";
      reason = "对象属性名缺少双引号或前方存在多余分隔符";
    } else if (/expected\s+['"]?,['"]?/i.test(String(error?.message || ""))) {
      kind = "missing-comma";
      reason = "相邻属性或数组元素之间缺少逗号";
    }

    return {
      kind,
      reason,
      parserMessage: String(error?.message || "未知 JSON 语法错误"),
      expected: scan.mismatch?.expected || null,
      actual: scan.mismatch?.actual || (position < text.length ? text[position] : null),
      ...location,
    };
  }
