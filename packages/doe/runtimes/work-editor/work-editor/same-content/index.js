// Origin: public/yrkie-doe/work-editor/work-editor.js:49


export function sameContent(left, right) {
    if (left === right) return true;
    if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
    if (Array.isArray(left) || Array.isArray(right)) {
      return Array.isArray(left) && Array.isArray(right) && left.length === right.length
        && left.every((value, index) => (0, sameContent)(value, right[index]));
    }
    return Object.keys(left).length === Object.keys(right).length
      && Object.keys(left).every((key) => Object.hasOwn(right, key) && (0, sameContent)(left[key], right[key]));
  }
