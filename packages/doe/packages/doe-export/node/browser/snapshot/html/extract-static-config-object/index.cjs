// Origin: browser_snapshot.js::extractStaticConfigObject


function extractStaticConfigObject(source, propertyName) {
  const propertyPattern = new RegExp(`(?:["']${propertyName}["']|\\b${propertyName}\\b)\\s*:\\s*\\{`, "i");
  const match = propertyPattern.exec(source);
  if (!match) return "";
  const openIndex = source.indexOf("{", match.index);
  let quote = "";
  let escaped = false;
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = "";
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  return "";
}

module.exports = { extractStaticConfigObject };
