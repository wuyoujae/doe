const assertStaticDocumentInPage1 = () => {
    const forbiddenElements = new Set([
      "base",
      "embed",
      "iframe",
      "link",
      "object",
    ]);
    const forbiddenSvgElements = new Set([
      "animate",
      "animatemotion",
      "animatetransform",
      "discard",
      "feimage",
      "foreignobject",
      "set",
    ]);
    const dangerousScheme = /^(?:javascript|vbscript|file|filesystem|ftp|ws|wss):/i;
    const networkScheme = /^(?:https?|ftp|file|filesystem|ws|wss):/i;
    const networkCss = /(?:@import\s+|url\s*\(\s*["']?\s*(?:https?|ftp|file|filesystem|ws|wss|javascript|vbscript):)/i;
    const forbiddenImageFunction = /(?:-webkit-)?(?:image-set|cross-fade)\s*\(/i;
    const imageProperties = [
      "background-image",
      "border-image-source",
      "content",
      "cursor",
      "list-style-image",
      "mask-image",
      "-webkit-mask-image",
    ];
    const styleHasForbiddenImageFunction = (style) => {
      if (!style) return false;
      return imageProperties.some((property) => forbiddenImageFunction.test(
        String(style.getPropertyValue(property) || ""),
      ));
    };
    const rulesHaveForbiddenImageFunction = (rules) => {
      for (const rule of Array.from(rules || [])) {
        if (rule.style) {
          for (const property of Array.from(rule.style)) {
            if (forbiddenImageFunction.test(String(rule.style.getPropertyValue(property) || ""))) {
              return true;
            }
          }
        }
        if (rule.cssRules && rulesHaveForbiddenImageFunction(rule.cssRules)) return true;
      }
      return false;
    };
    const fetchAttributes = new Set([
      "action",
      "background",
      "data",
      "formaction",
      "poster",
      "src",
      "xlink:href",
    ]);

    for (const element of document.querySelectorAll("*")) {
      const localName = String(element.localName || "").toLowerCase();
      if (localName === "script") {
        const isCanonicalPayload = element.id === "pptx2html-canonical-ir"
          && String(element.getAttribute("type") || "").toLowerCase() === "application/json"
          && element.getAttribute("data-pptx2html-ir") === "1"
          && !element.hasAttribute("src");
        if (!isCanonicalPayload) return "forbidden <script> element";
        element.remove();
        continue;
      }
      if (forbiddenElements.has(localName)) return `forbidden <${localName}> element`;
      if (element.namespaceURI === "http://www.w3.org/2000/svg" && forbiddenSvgElements.has(localName)) {
        return `forbidden SVG <${localName}> element`;
      }
      if (
        localName === "meta"
        && String(element.getAttribute("http-equiv") || "").trim().toLowerCase() === "refresh"
      ) {
        return "meta refresh is not allowed";
      }

      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        const value = String(attribute.value || "").trim().replace(/[\u0000-\u0020]+/g, "");
        if (name.startsWith("on")) return `event handler attribute ${name} is not allowed`;
        if (name === "srcdoc") return "srcdoc is not allowed";
        if (dangerousScheme.test(value)) return `dangerous URL in ${name}`;
        if (fetchAttributes.has(name) && networkScheme.test(value)) {
          return `network URL in ${name} is not allowed`;
        }
        if (name === "srcset" && /(?:https?:|ftp:|file:|ws:|wss:|\/\/)/i.test(value)) {
          return "network URL in srcset is not allowed";
        }
        if (name === "style" && networkCss.test(attribute.value)) {
          return "network or active URL in style is not allowed";
        }
        if (name === "style" && forbiddenImageFunction.test(attribute.value)) {
          return "unsupported CSS image function";
        }
        if (localName === "use" && (name === "href" || name === "xlink:href") && !value.startsWith("#")) {
          return "external SVG use reference is not allowed";
        }
      }
      const computed = getComputedStyle(element);
      if (
        styleHasForbiddenImageFunction(computed)
        || styleHasForbiddenImageFunction(getComputedStyle(element, "::before"))
        || styleHasForbiddenImageFunction(getComputedStyle(element, "::after"))
      ) {
        return "unsupported CSS image function";
      }
    }

    for (const style of document.querySelectorAll("style")) {
      if (networkCss.test(style.textContent || "")) {
        return "network or active URL in stylesheet is not allowed";
      }
    }
    for (const sheet of Array.from(document.styleSheets || [])) {
      try {
        if (rulesHaveForbiddenImageFunction(sheet.cssRules)) {
          return "unsupported CSS image function";
        }
      } catch (_error) {
        return "uninspectable stylesheet";
      }
    }
    return null;
  };

module.exports = { assertStaticDocumentInPage1 };
