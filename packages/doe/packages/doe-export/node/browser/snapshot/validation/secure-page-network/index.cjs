// Origin: browser_snapshot.js::securePageNetwork
const { isAllowedResourceUrl } = require("../is-allowed-resource-url/index.cjs");

async function securePageNetwork(page, diagnostics = null) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (isAllowedResourceUrl(request.url())) {
      await route.continue();
      return;
    }
    if (diagnostics) {
      diagnostics.push({
        severity: "warning",
        code: "resource-blocked",
        message: `Blocked external ${request.resourceType()} resource.`,
      });
    }
    await route.abort("blockedbyclient");
  });
  if (typeof page.routeWebSocket === "function") {
    await page.routeWebSocket(/.*/, (route) => route.close());
  }
}

module.exports = { securePageNetwork };
