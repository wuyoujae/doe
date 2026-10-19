// Origin: public/yrkie-doe/core/schema-json-recovery.js:1043


export function formatRepair(repair) {
    if (!repair) return "已修复 JSON 结构错误";
    return `第 ${repair.line} 行第 ${repair.column} 列：${repair.description}`;
  }
