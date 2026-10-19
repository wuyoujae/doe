// Origin: browser_snapshot.js::sourceCodePoints


function sourceCodePoints(source) {
  const points = new Set(Array.from(String(source || ""), (character) => character.codePointAt(0)));
  let match;
  const hexEntity = /&#x([0-9a-f]{1,6});?/gi;
  while ((match = hexEntity.exec(source)) !== null) points.add(Number.parseInt(match[1], 16));
  const decimalEntity = /&#([0-9]{1,7});?/g;
  while ((match = decimalEntity.exec(source)) !== null) points.add(Number.parseInt(match[1], 10));
  return points;
}

module.exports = { sourceCodePoints };
