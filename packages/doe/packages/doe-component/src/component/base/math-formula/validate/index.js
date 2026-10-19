// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1080


export function validate(config) {
    const content = config && config.content;
    if (!content || typeof content.formula !== "string" || !content.formula.trim()) {
      throw new Error("MathFormula: content.formula must be a non-empty LaTeX string.");
    }
  }
