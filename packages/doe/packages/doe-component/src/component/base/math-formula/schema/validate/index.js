// Origin: layout-engine/library-components.js; math-formula.validate


export function validate(props, warnings) {
      if (typeof props.content?.formula !== "string" || !props.content.formula.trim()) {
        warnings.push("math-formula.content.formula must be a non-empty LaTeX string.");
      }
    }
