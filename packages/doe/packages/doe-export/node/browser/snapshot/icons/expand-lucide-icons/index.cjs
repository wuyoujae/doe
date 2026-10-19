// Origin: browser_snapshot.js::expandLucideIcons


async function expandLucideIcons(page, registry) {
  if (!registry) return;
  await page.evaluate(({ icons, fallback }) => {
    for (const element of document.querySelectorAll("[data-lucide]")) {
      const requestedName = String(element.getAttribute("data-lucide") || "").trim().toLowerCase();
      const resolved = icons[requestedName] || fallback;
      const holder = document.createElement("template");
      holder.innerHTML = resolved.source.trim();
      const svg = holder.content.firstElementChild;
      if (!svg) continue;
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name !== "data-lucide" && attribute.name !== "data-lucide-requested") {
          svg.setAttribute(attribute.name, attribute.value);
        }
      }
      svg.setAttribute("data-lucide", resolved.name);
      if (requestedName !== resolved.name) svg.setAttribute("data-lucide-requested", requestedName);
      element.replaceWith(svg);
    }
  }, registry);
}

module.exports = { expandLucideIcons };
