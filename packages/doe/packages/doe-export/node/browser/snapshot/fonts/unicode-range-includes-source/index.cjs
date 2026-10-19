// Origin: browser_snapshot.js::unicodeRangeIncludesSource


function unicodeRangeIncludesSource(block, codePoints) {
  const descriptor = block.match(/unicode-range\s*:\s*([^;]+);/i)?.[1];
  if (!descriptor) return true;
  const ranges = [];
  const pattern = /U\+([0-9a-f?]{1,6})(?:-([0-9a-f]{1,6}))?/gi;
  let match;
  while ((match = pattern.exec(descriptor)) !== null) {
    const wildcardStart = match[1].replace(/\?/g, "0");
    const wildcardEnd = match[1].replace(/\?/g, "f");
    ranges.push([
      Number.parseInt(wildcardStart, 16),
      Number.parseInt(match[2] || wildcardEnd, 16),
    ]);
  }
  return ranges.length === 0 || Array.from(codePoints).some(
    (codePoint) => ranges.some(([start, end]) => codePoint >= start && codePoint <= end),
  );
}

module.exports = { unicodeRangeIncludesSource };
