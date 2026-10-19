import attributes from '../base-attributes/index.json' with { type: 'json' };

// The composition root supplies its realm's engine; the adapter owns PPT schema details.
export function createPresentationCanvasRenderer(engine) {
  return Object.freeze({
    id: 'presentation',
    size: Object.freeze({ width: attributes.renderWidth, height: attributes.renderHeight }),
    mount: (target, schema, options) => engine.mount(target, schema, options),
    sanitizeStaticElement: element => engine.sanitizeStaticElement(element),
    backgroundAssets: schema => schema.slide.background?.src ? [schema.slide.background.src] : [],
  });
}
