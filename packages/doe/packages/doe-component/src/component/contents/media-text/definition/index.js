import { emptyImage, paintEmptyIcon } from '../../media-placeholder/index.js';
import { imageCardControls, imageCardFrame, imageCardContentWidth, validateImageCardProps } from '../image-options.js';
// Origin: public/yrkie-doe/components/base-media/base-media.js:4
import { scope as __doeScope } from "../runtime/context/index.js";

export function definition(kind) {
    const metric = __doeScope.engine.components.get("stat");
    return {
      category: "contents", defaultSpan: 1, minWidth: 280, family: "narrative",
      composition: { ...metric.composition, family: "narrative", allowedWith: ["narrative", "data", "media"] },
      layoutContract: { ...metric.layoutContract, minHeight: kind === "image" ? 240 : 120 },
      collection: { ...metric.collection, key: `${kind}-text`, maxColumns: 4 },
      ...(kind === 'image' ? { editorControls: imageCardControls } : {}),
      validate(props, warnings) {
        if (kind === 'image') validateImageCardProps(props, warnings);
        for (const field of ["title", "text", kind === "image" ? "src" : "icon"]) {
          if (typeof props[field] !== "string" || !props[field].trim()) warnings.push(`${kind}-text.${field} is required.`);
        }
      },
      render(component, context) {
        const { element } = context, props = component.props;
        const root = element("article", "base-media"); root.dataset.kind = kind;
        if (kind === "image") {
          root.dataset.surface = props.surface || 'none';
          const media = props.src === "" ? emptyImage(root.ownerDocument) : __doeScope.engine.components.get("media").render({ ...component, props: { src: props.src, alt: props.alt || props.title, fit: props.imageFit || "contain", aspectRatio: props.imageAspectRatio || "1:1" } }, context);
          media.classList.add("base-media__image"); root.append(media);
        } else {
          const badge = element("div", "base-media__icon");
          const icon = __doeScope.global.lucide?.icons?.[props.icon] || __doeScope.global.lucide?.[props.icon] || __doeScope.global.lucide?.icons?.Target;
          if (icon && __doeScope.global.lucide?.createElement) badge.append(__doeScope.global.lucide.createElement(icon, { "aria-hidden": "true", "stroke-width": 1.8 }));
          if (props.icon === "") paintEmptyIcon(badge);
          root.append(badge);
        }
        for (const [field, tag, style] of [["title", "h4", "h4"], ["text", "p", "large"]]) {
          const node = element(tag, `base-media__${field}`, props[field]); __doeScope.engine.applyTypographyStyle(node, style);
          __doeScope.global.SemanticTextLayout?.prepareElement(node, { mode: field === "title" ? "title" : "paragraph", render: "plaintext", maxLines: field === "title" ? 4 : 24, minFontPt: __doeScope.engine.TYPOGRAPHY.styles[style].sizes.compact });
          root.append(node);
        }
        return root;
      },
      adapt(root, component, context) {
        if (kind !== "image") return;
        const frame = imageCardFrame(component.props, imageCardContentWidth(root, context.width), context.density);
        const image = root.querySelector(".base-media__image");
        image.style.width = `${frame.width}px`; image.style.height = `${frame.height}px`;
        image.style.aspectRatio = 'auto';
      },
    };
  }
