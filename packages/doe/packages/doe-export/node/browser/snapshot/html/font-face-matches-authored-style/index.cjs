// Origin: browser_snapshot.js::fontFaceMatchesAuthoredStyle


function fontFaceMatchesAuthoredStyle(block, source) {
  const style = block.match(/font-style\s*:\s*([^;]+);/i)?.[1]?.trim().toLowerCase();
  if (style === "italic" && !/(?:^|[\s"'])italic(?:$|[\s"'])|font-style\s*:\s*italic/i.test(source)) {
    return false;
  }
  if (/font-weight\s*:\s*\d+\s+\d+\s*;/i.test(block)) return true;
  const weight = block.match(/font-weight\s*:\s*([0-9]+)/i)?.[1];
  if (weight === "300" && !/(?:font-light|font-weight\s*:\s*300)/i.test(source)) return false;
  if (weight === "700" && !/(?:font-(?:semibold|bold|extrabold|black)|font-weight\s*:\s*[6-9]00)/i.test(source)) {
    return false;
  }
  return true;
}

module.exports = { fontFaceMatchesAuthoredStyle };
