// Origin: public/yrkie-doe/work-editor/work-editor.js:1209


export function updateThumbnailCard(record, { index, total, active }) {
    record.item.setAttribute("aria-current", active ? "page" : "false");
    record.preview.setAttribute("aria-label", `第 ${index + 1} 页`);
    record.number.textContent = String(index + 1).padStart(2, "0");
    record.deleteButton.setAttribute("aria-label", `删除第 ${index + 1} 页`);
    record.deleteButton.hidden = total <= 1;
  }
