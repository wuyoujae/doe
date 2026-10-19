// Origin: public/yrkie-doe/components/math-formula/math-formula.js:717


export function stretchyDelimiterPath(name, open) {
    // viewBox 0 0 12 24. Returns a single path 'd' string, or null for "invisible".
    const o = open ? "open" : "close";
    switch (name) {
      case "(":
      case ")": {
        if (o === "open") {
          return "M10 1 C4 5, 3 19, 10 23 C7 18, 7 6, 10 1 Z";
        }
        return "M2 1 C8 5, 9 19, 2 23 C5 18, 5 6, 2 1 Z";
      }
      case "[":
        return o === "open"
          ? "M8 1 L3 1 L3 23 L8 23"
          : "M4 1 L9 1 L9 23 L4 23";
      case "{": {
        if (o === "open") {
          return "M7 1 C4 1, 3 4, 6 7 L6 12 C3 15, 3 19, 7 23 C5 19, 5 15, 8 12 C8 8, 9 4, 7 1 Z";
        }
        return "M5 1 C8 1, 9 4, 6 7 L6 12 C9 15, 9 19, 5 23 C7 19, 7 15, 4 12 C4 8, 3 4, 5 1 Z";
      }
      case "}":
        return o === "open"
          ? "M5 1 C8 1, 9 4, 6 7 L6 12 C9 15, 9 19, 5 23 C7 19, 7 15, 4 12 C4 8, 3 4, 5 1 Z"
          : "M7 1 C4 1, 3 4, 6 7 L6 12 C3 15, 3 19, 7 23 C5 19, 5 15, 8 12 C8 8, 9 4, 7 1 Z";
      case "|":
        return "M6 1 L6 23";
      case "‖":
        return "M4 1 L4 23 M8 1 L8 23";
      case "⌊":
        return o === "open" ? "M8 1 L8 23 L2 23" : "M4 1 L4 23 L10 23";
      case "⌋":
        return o === "open" ? "M8 1 L8 23 L3 23" : "M4 1 L4 23 L9 23";
      case "⌈":
        return o === "open" ? "M8 23 L8 1 L2 1" : "M4 23 L4 1 L10 1";
      case "⌉":
        return o === "open" ? "M8 23 L8 1 L3 1" : "M4 23 L4 1 L9 1";
      case "⟨":
        return o === "open" ? "M7 1 L3 12 L7 23" : "M5 1 L9 12 L5 23";
      case "⟩":
        return o === "open" ? "M5 1 L9 12 L5 23" : "M7 1 L3 12 L7 23";
      case "/":
        return "M8 23 L4 1";
      case "\\":
        return "M4 23 L8 1";
      default:
        return null;
    }
  }
