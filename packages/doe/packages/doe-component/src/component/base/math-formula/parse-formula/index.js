import { tokenize as __doeFn_tokenize } from '../tokenize/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:264
import { scope as __doeScope } from "../runtime/context/index.js";

export function parseFormula(source) {
    const warnings = [];
    const tokens = (0, __doeFn_tokenize)(source);
    let index = 0;
    let depth = 0;

    function peek() { return tokens[index]; }
    function next() {
      if (index < tokens.length) index += 1;
      return tokens[index - 1];
    }
    function isType(type) { return peek().type === type; }
    function matchCmd(name) {
      const token = peek();
      if (token.type === "cmd" && token.value === name) { next(); return true; }
      return false;
    }

    function warn(message) {
      if (!warnings.includes(message)) warnings.push(message);
    }

    function parseSequence(stopSet) {
      const children = [];
      let budget = __doeScope.MAX_TOKENS;
      while (index < tokens.length) {
        const token = peek();
        if (token.type === "eof") break;
        if (stopSet && stopSet.includes(token.type)) break;
        if (stopSet && token.type === "cmd" && stopSet.includes(`cmd:${token.value}`)) break;
        if (budget-- <= 0) { warn("math: token budget exceeded; truncated."); break; }
        const atom = parseAtom();
        if (atom === null) {
          if (peek().type === "eof") break;
          next(); // skip a token we cannot handle to guarantee progress
        } else {
          children.push(atom);
        }
      }
      return children;
    }

    function parseGroup() {
      // Caller has consumed '{'. Returns group node or null on EOF.
      depth += 1;
      if (depth > __doeScope.MAX_DEPTH) { warn("math: expression too deeply nested."); depth -= 1; return null; }
      next(); // consume lbrace
      const body = { kind: "seq", children: parseSequence(["rbrace"]) };
      if (isType("rbrace")) next();
      depth -= 1;
      return { kind: "group", body };
    }

    function parseScriptGroup() {
      // For ^ / _ arguments: either { ... } or a single atom. A single atom
      // must NOT attach a following ^/_ (so a_i^j keeps i as sub and j as sup).
      if (isType("lbrace")) {
        const group = parseGroup();
        return group ? group.body : null;
      }
      return parseSingleAtom();
    }

    function parseSingleAtom() {
      const token = peek();
      if (token.type === "char") {
        next();
        return { kind: "symbol", char: token.value, italic: true };
      }
      if (token.type === "digit") {
        next();
        return { kind: "symbol", char: token.value, italic: false };
      }
      if (token.type === "sym") {
        next();
        return { kind: "symbol", char: token.value, italic: false };
      }
      if (token.type === "space-ctrl") {
        next();
        return { kind: "space", widthEm: __doeScope.SPACING_MAP[token.value] ?? 0.25 };
      }
      if (token.type === "cmd") return parseCommand();
      return null;
    }

    function attachScripts(base) {
      let sup = null;
      let sub = null;
      let changed = true;
      while (changed) {
        changed = false;
        if (isType("sup")) { next(); sup = parseScriptGroup(); changed = true; }
        if (isType("sub")) { next(); sub = parseScriptGroup(); changed = true; }
      }
      if (sup === null && sub === null) return base;
      return { kind: "script", base, sup, sub };
    }

    function parseAtom() {
      const token = peek();

      if (token.type === "lbrace") return parseGroup();
      if (token.type === "char") {
        next();
        return attachScripts({ kind: "symbol", char: token.value, italic: true });
      }
      if (token.type === "digit") {
        next();
        return attachScripts({ kind: "symbol", char: token.value, italic: false });
      }
      if (token.type === "sym") {
        next();
        if (token.value === "{" || token.value === "}" || token.value === "_") {
          return { kind: "symbol", char: token.value, italic: false };
        }
        return attachScripts({ kind: "symbol", char: token.value, italic: false });
      }
      if (token.type === "sup") {
        next();
        const arg = parseScriptGroup();
        return arg ? attachScripts({ kind: "script", base: null, sup: arg }) : null;
      }
      if (token.type === "sub") {
        next();
        const arg = parseScriptGroup();
        return arg ? attachScripts({ kind: "script", base: null, sub: arg }) : null;
      }
      if (token.type === "space-ctrl") {
        next();
        return { kind: "space", widthEm: __doeScope.SPACING_MAP[token.value] ?? 0.25 };
      }
      if (token.type === "cmd") return parseCommand();
      return null;
    }

    function parseArgument() {
      if (isType("lbrace")) {
        const group = parseGroup();
        return group ? group.body : null;
      }
      return parseAtom();
    }

    function parseCommand() {
      const token = next(); // cmd
      const name = token.value;

      if (name === "frac" || name === "dfrac" || name === "tfrac" || name === "cfrac") {
        const num = parseArgument();
        const den = parseArgument();
        return {
          kind: "frac",
          num: num || { kind: "seq", children: [] },
          den: den || { kind: "seq", children: [] },
          style: name === "dfrac" ? "display" : name === "tfrac" ? "text" : "auto",
        };
      }

      if (name === "sqrt") {
        let indexArg = null;
        if (isType("sup")) {
          next();
          indexArg = parseArgument();
        } else if (isType("sym") && peek().value === "[") {
          next(); // consume "["
          const parts = [];
          while (!(isType("sym") && peek().value === "]")) {
            if (isType("eof")) break;
            const atom = parseAtom();
            if (atom) parts.push(atom);
          }
          if (isType("sym") && peek().value === "]") next();
          indexArg = { kind: "seq", children: parts };
        }
        const radicand = parseArgument();
        return {
          kind: "sqrt",
          radicand: radicand || { kind: "seq", children: [] },
          index: indexArg,
        };
      }

      if (__doeScope.TEXT_COMMANDS.has(name)) {
        const raw = readBalancedTextToken();
        return {
          kind: "text",
          value: raw || "",
          style: __doeScope.TEXT_STYLE[name] || "text",
          command: name,
        };
      }

      if (name === "left" || name === "right") {
        return parseDelimited(name);
      }

      if (name === "begin") {
        return parseEnvironment();
      }

      if (name === "end") {
        warn("math: stray \\end ignored.");
        return null;
      }

      if (name === "displaystyle" || name === "textstyle" || name === "scriptstyle") {
        return { kind: "style-hint", style: name };
      }

      if (__doeScope.ACCENT_MARK[name] || __doeScope.STRETCH_ACCENTS.has(name)) {
        const body = parseArgument();
        return {
          kind: "accent",
          body: body || { kind: "seq", children: [] },
          mark: __doeScope.ACCENT_MARK[name] || "",
          stretch: __doeScope.STRETCH_ACCENTS.has(name),
        };
      }

      if (__doeScope.SPACING_MAP[name] !== undefined) {
        return { kind: "space", widthEm: __doeScope.SPACING_MAP[name] };
      }

      if (name.startsWith("big") || name.startsWith("Big")) {
        return parseFixedDelimiter(name);
      }

      if (__doeScope.GREEK_MAP[name]) {
        return attachScripts({ kind: "operator", char: __doeScope.GREEK_MAP[name] });
      }

      if (__doeScope.LIMIT_BELOW.has(name)) {
        // \lim \max \min ... render upright with an optional subscript below.
        let lower = null;
        if (isType("sub")) { next(); lower = parseArgument(); }
        return { kind: "bigop", char: name, name, upper: null, lower };
      }

      if (__doeScope.OPERATOR_MAP[name]) {
        if (__doeScope.BIGOP_FAMILY.has(name)) {
          let upper = null;
          let lower = null;
          if (isType("sub")) { next(); lower = parseArgument(); }
          if (isType("sup")) { next(); upper = parseArgument(); }
          return { kind: "bigop", char: __doeScope.OPERATOR_MAP[name], name, upper, lower };
        }
        return attachScripts({ kind: "operator", char: __doeScope.OPERATOR_MAP[name] });
      }

      if (__doeScope.FUNCTION_OPS.has(name)) {
        return attachScripts({ kind: "text", value: name, style: "mathrm" });
      }

      if (name === "bmod" || name === "pmod" || name === "mod") {
        return { kind: "text", value: ` ${name} `, style: "mathrm" };
      }

      if (__doeScope.DELIM_ALIAS[name] !== undefined) {
        return attachScripts({ kind: "symbol", char: __doeScope.DELIM_ALIAS[name], italic: false });
      }

      // Unknown command: degrade to a visible raw node.
      warn(`math: unknown command \\${name}`);
      return { kind: "unknown", source: `\\${name}` };
    }

    function readBalancedTextToken() {
      // Read \text{...}: parse a literal brace-balanced capture at the token level.
      let depth = 0;
      let out = "";
      let startIndex = index;
      // Skip optional leading space tokens, then expect lbrace.
      while (isType("space-ctrl")) next();
      if (!isType("lbrace")) {
        const atom = parseAtom();
        if (atom) out = String(atom.char || atom.value || "");
        return out;
      }
      next(); // consume lbrace
      depth = 1;
      while (index < tokens.length && depth > 0) {
        const token = tokens[index];
        if (token.type === "lbrace") depth += 1;
        else if (token.type === "rbrace") {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            break;
          }
        } else if (token.type === "eof") break;
        if (token.type === "char" || token.type === "digit") out += token.value;
        else if (token.type === "sym") out += token.value;
        else if (token.type === "space-ctrl") {
          if (token.value === "," || token.value === ":" || token.value === ";" || token.value === "!") {
            out += __doeScope.SPACING_MAP[token.value] >= 0 ? " " : "";
          } else if (token.value === " ") {
            out += " ";
          } else {
            out += " ";
          }
        }
        index += 1;
      }
      if (depth > 0) {
        index = startIndex;
        warn("math: unclosed \\text group.");
        return "";
      }
      return out;
    }

    function parseDelimited(side) {
      // Consumed \left or \right token. The next token is a delimiter.
      const delimToken = next();
      const delimName = delimToken.type === "cmd" ? delimToken.value : delimToken.value;
      if (side === "left") {
        const body = { kind: "seq", children: parseSequence(["cmd:right"]) };
        const rightToken = peek();
        let close = ")";
        let closeName = ")";
        if (rightToken.type === "cmd" && rightToken.value === "right") {
          next();
          const rightDelim = next();
          const rawName = rightDelim.type === "cmd" ? rightDelim.value : rightDelim.value;
          closeName = rawName;
          close = __doeScope.DELIM_ALIAS[rawName] !== undefined ? __doeScope.DELIM_ALIAS[rawName] : rawName;
        } else {
          warn("math: \\left without matching \\right; rendered literally.");
        }
        const openName = delimName;
        const open = __doeScope.DELIM_ALIAS[delimName] !== undefined ? __doeScope.DELIM_ALIAS[delimName] : delimName;
        const openStretchy = __doeScope.OPEN_DELIMS.has(delimName);
        const closeStretchy = __doeScope.CLOSE_DELIMS.has(closeName);
        if (open === null) {
          // \left. — invisible, keep body only
          return { kind: "delim", open: "", body, close: "", stretchy: false };
        }
        return { kind: "delim", open, close, body, stretchy: openStretchy || closeStretchy };
      }
      warn("math: stray \\right ignored.");
      return null;
    }

    function parseFixedDelimiter(name) {
      // \bigl( \bigr] \Big\{ ... fixed-size delimiters.
      const sizeMatch = /^(Big?)([lr]?)(.*)$/.exec(name);
      const base = sizeMatch ? sizeMatch[3] : "";
      const size = name.startsWith("Bigg") ? 1.8 : name.startsWith("Big") ? 1.4 : 1.2;
      const delimToken = next();
      const delimName = delimToken.type === "cmd" ? delimToken.value : delimToken.value;
      const char = __doeScope.DELIM_ALIAS[delimName] !== undefined ? __doeScope.DELIM_ALIAS[delimName] : delimName;
      if (char === null) return null;
      return { kind: "fixed-delim", char, size };
    }

    function readEnvironmentName() {
      // \begin{matrix} / \end{matrix}: collect consecutive char/digit tokens.
      let name = "";
      while (isType("char") || isType("digit")) name += next().value;
      return name;
    }

    function parseEnvironment() {
      // Consumed \begin. Next token is the env name, usually wrapped in braces.
      let envName = "";
      if (isType("lbrace")) {
        next();
        envName = readEnvironmentName();
        if (isType("rbrace")) next();
      } else {
        envName = readEnvironmentName();
      }
      if (!__doeScope.ENVIRONMENTS.has(envName)) {
        warn(`math: unknown environment \\begin{${envName}}; content rendered as text.`);
        return { kind: "seq", children: parseSequence(["cmd:end"]) };
      }

      // array: optional {cc} column spec — accept and ignore.
      if (envName === "array" && isType("lbrace")) {
        next();
        let colDepth = 1;
        while (index < tokens.length && colDepth > 0) {
          const t = next();
          if (t.type === "lbrace") colDepth += 1;
          else if (t.type === "rbrace") colDepth -= 1;
        }
      }

      // Collect rows until \end{envName}.
      const rows = [];
      let row = [];
      let done = false;
      while (index < tokens.length) {
        if (isType("eof")) { warn(`math: unclosed \\begin{${envName}}`); break; }
        if (isType("cmd") && peek().value === "end") {
          next();
          if (isType("lbrace")) next();
          const endName = readEnvironmentName();
          if (isType("rbrace")) next();
          if (endName !== envName) {
            warn(`math: \\end{${endName}} does not match \\begin{${envName}}; treated as end.`);
          }
          done = true;
          break;
        }
        if (isType("break")) {
          next();
          rows.push(row);
          row = [];
          continue;
        }
        if (isType("amp")) {
          next();
          row.push(null); // column separator marker
          continue;
        }
        const atom = parseAtom();
        if (atom) row.push(atom);
      }
      if (!done || row.length) rows.push(row);

      // Split each row on null separators into cells.
      const grid = rows.map((rowAtoms) => {
        const cells = [[]];
        rowAtoms.forEach((atom) => {
          if (atom === null) cells.push([]);
          else cells[cells.length - 1].push(atom);
        });
        return cells.map((cell) => ({ kind: "seq", children: cell }));
      });

      if (envName === "aligned" || envName === "align" || envName === "alignedat") {
        const columnCount = grid.reduce((maxCols, cells) => Math.max(maxCols, cells.length), 1);
        return { kind: "aligned", rows: grid, columns: columnCount, env: envName };
      }
      if (envName === "cases") {
        return { kind: "matrix", rows: grid, env: "cases", columns: 2 };
      }
      return { kind: "matrix", rows: grid, env: envName, columns: grid.length ? grid[0].length : 1 };
    }

    // --- top level ---
    const children = parseSequence([]);
    return {
      ast: { kind: "root", children },
      warnings,
    };
  }
