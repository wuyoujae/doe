// Origin: public/yrkie-doe/layout-engine/layout-engine.js:32
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.SCHEMA_CONTRACT = Object.freeze({
    wireVersion: 4,
    handbookRevision: "4.18",
    componentPolicies: Object.freeze({
      transparentText: Object.freeze({
        rootTypes: Object.freeze([...__doeScope.TRANSPARENT_TEXT_COMPONENT_TYPES]),
        forbiddenProps: __doeScope.BLOCKED_TEXT_BACKGROUND_PROPS,
        invalidValuePolicy: "ignore-and-default",
      }),
      media: Object.freeze({
        forbiddenProps: __doeScope.BLOCKED_MEDIA_DECORATION_PROPS,
        invalidValuePolicy: "ignore-and-default",
      }),
    }),
    normalization: Object.freeze({
      validExplicitValue: "preserve",
      missingOrInvalidValue: "use-default",
      unknownProperty: "ignore",
      authoredContent: "preserve",
    }),
  });
}
