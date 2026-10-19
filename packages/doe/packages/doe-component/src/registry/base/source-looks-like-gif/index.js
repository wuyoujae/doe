// Origin: public/yrkie-doe/layout-engine/components.js:232


export function sourceLooksLikeGif(value) {
    const source = String(value || "").trim();
    return (
      /^data:image\/gif(?:;|,)/i.test(source) ||
      /\.gif(?:$|[?#])/i.test(source)
    );
  }
