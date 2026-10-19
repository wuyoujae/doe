// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1569


export function looksLikeCodeText(value) {
    const source = String(value || "");
    if (!source.includes("\n")) return false;
    const lines = source.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return false;
    // Preserve the legacy code-text migration only for concrete syntax.
    // Business prose routinely contains colons, semicolons and words such as
    // "if", "return" or "from"; punctuation/keywords alone are not evidence.
    const syntax = [
      /^\s*(?:async\s+)?def\s+[A-Za-z_]\w*\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*(?:#.*)?$/,
      /^\s*class\s+[A-Za-z_]\w*(?:\([^)]*\))?\s*:\s*(?:#.*)?$/,
      /^\s*from\s+[A-Za-z_][\w.]*\s+import\s+(?:\*|[A-Za-z_]\w*(?:\s+as\s+[A-Za-z_]\w*)?)(?:\s*,\s*[A-Za-z_]\w*)*\s*$/,
      /^\s*import\s+[A-Za-z_][\w.]*(?:\s+as\s+[A-Za-z_]\w*)?(?:\s*,\s*[A-Za-z_][\w.]*)*\s*$/,
      /^\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*(?:\s*:[^=]+)?\s*=/,
      /^\s*(?:export\s+)?(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/,
      /^\s*for\s+[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*\s+in\s+.+:\s*$/,
      /^\s*(?:if|elif|while)\s+[^:]+(?:==|!=|<=|>=|\bis\s+(?:not\s+)?(?:None|True|False)\b)[^:]*:\s*$/,
      /^\s*(?:if|while|for)\s*\([^)]*\)\s*\{\s*$/,
      /^\s*(?:console\.(?:log|warn|error)|print)\(.*\)\s*;?\s*$/,
      /^\s+return\s+(?:[A-Za-z_]\w*(?:\([^)]*\))?|\d+(?:\.\d+)?|["'][^"']*["'])\s*;?\s*$/,
    ];
    const codeSignals = lines.filter(line => syntax.some(pattern => pattern.test(line))).length;
    return codeSignals >= Math.min(2, lines.length);
  }
