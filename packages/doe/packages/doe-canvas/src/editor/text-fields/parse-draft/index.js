// Origin: public/yrkie-doe/layout-engine/text-fields.js:164


export function parseDraft(draft, field) {
    if (field.required && !draft.trim()) return { error: "内容不能为空" };
    if (field.numeric) {
      const value = draft.trim() === "" ? NaN : Number(draft.replace(/,/g, ""));
      if (!Number.isFinite(value)) return { error: "请输入有效数字" };
      if (value < (field.min ?? -Infinity) || value > (field.max ?? Infinity)) return { error: `请输入 ${field.min ?? "−∞"} 到 ${field.max ?? "∞"} 之间的数字` };
      return { value };
    }
    return { value: field.lines ? draft.split("\n") : draft };
  }
