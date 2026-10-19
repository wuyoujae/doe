// Origin: public/yrkie-doe/components/shape-contents/shape-contents.js:5
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.fixed = variant => variant === "semicircle" || variant === "petals" || variant === "cycle-arrows" || variant === "full-circle" || variant === "ring";
}
