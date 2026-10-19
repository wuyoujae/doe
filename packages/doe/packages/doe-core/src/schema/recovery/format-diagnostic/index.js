// Origin: public/yrkie-doe/core/schema-json-recovery.js:1038


export function formatDiagnostic(diagnostic) {
    if (!diagnostic) return "未知 JSON 语法错误";
    return `第 ${diagnostic.line} 行第 ${diagnostic.column} 列（位置 ${diagnostic.position}）：${diagnostic.reason}`;
  }
