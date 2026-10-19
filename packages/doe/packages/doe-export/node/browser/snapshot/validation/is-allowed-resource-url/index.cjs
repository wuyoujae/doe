// Origin: browser_snapshot.js::isAllowedResourceUrl


function isAllowedResourceUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch (_error) {
    return false;
  }
  return ["data:", "blob:", "about:"].includes(url.protocol);
}

module.exports = { isAllowedResourceUrl };
