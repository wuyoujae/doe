// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:52
import { scope as __doeScope } from "../runtime/context/index.js";

export function appendHeader(host, config, prefix) {
    if (config.title) host.append(__doeScope.utils.element("h2", `${prefix}__title`, config.title));
    if (config.subtitle) host.append(__doeScope.utils.element("p", `${prefix}__subtitle`, config.subtitle));
  }
