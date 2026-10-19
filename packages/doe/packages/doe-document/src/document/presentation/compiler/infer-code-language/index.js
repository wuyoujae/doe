// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1582


export function inferCodeLanguage(value) {
    const source = String(value || "");
    if (/^\s*(?:for|while|if|elif|else|def|class|import|from|print)\b/m.test(source)) {
      return "python";
    }
    if (/\b(?:const|let|var|function|console\.log)\b|=>/.test(source)) {
      return "javascript";
    }
    if (/^\s*[\[{][\s\S]*[\]}]\s*$/.test(source)) return "json";
    return "text";
  }
