// Origin: public/yrkie-doe/core/schema-json-recovery.js:903


export function repairDescription(repair) {
    const descriptions = {
      "swap-adjacent-closers": `交换了写反的闭合符号 ${repair.before} → ${repair.after}`,
      "replace-mismatched-closer": `将错误的闭合符号 ${repair.before} 改为 ${repair.after}`,
      "remove-trailing-comma": "移除了容器末尾多余的逗号",
      "remove-all-trailing-commas": "统一移除了容器末尾多余的逗号",
      "remove-duplicate-comma": "移除了重复逗号",
      "insert-missing-comma": "补上了缺失的逗号",
      "insert-comma-and-quote-property-name": `补上逗号，并为属性名 ${repair.before} 补上双引号`,
      "append-missing-closers": `补上了末尾缺失的闭合符号 ${repair.after}`,
      "insert-missing-opener": `补上了缺失的开始符号 ${repair.after}`,
      "remove-extra-closer": `移除了多余的闭合符号 ${repair.before}`,
      "insert-missing-colon": "补上了属性名后的冒号",
      "insert-missing-closing-quote": "补上了缺失的右双引号",
      "insert-missing-opening-quote": "补上了缺失的左双引号",
      "quote-bare-property-name": `为未加引号的属性名 ${repair.before} 补上双引号`,
      "quote-bare-property-and-insert-colon": `为属性名 ${repair.before} 补上双引号和冒号`,
      "quote-bare-string-value": `为未加引号的字符串值 ${repair.before} 补上双引号`,
      "convert-single-quoted-string": "将单引号字符串转换为 JSON 双引号字符串",
      "convert-all-single-quoted-strings": "统一将单引号字符串转换为 JSON 双引号字符串",
      "quote-all-bare-property-names": "统一为未加引号的属性名补上双引号",
      "quote-all-bare-string-values": "统一为未加引号的字符串值补上双引号",
      "normalize-smart-quotes": "将弯引号规范为 JSON 双引号",
      "normalize-non-json-literal": `将 ${repair.before} 规范为 ${repair.after}`,
      "normalize-common-ai-json-dialect": `将常见 AI JSON 方言（${repair.before}）统一规范为严格 JSON`,
      "normalize-all-non-json-literals": "统一将非 JSON 字面量规范为 JSON 字面量",
      "remove-comments": "移除了 JSON 不支持的注释",
      "remove-duplicate-colon": "移除了重复冒号",
      "remove-byte-order-mark": "移除了文件开头的 BOM 标记",
    };
    return descriptions[repair.kind] || "修复了 JSON 结构错误";
  }
