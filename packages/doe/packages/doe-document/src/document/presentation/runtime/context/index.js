import { scope as browser } from '../../../../../../doe-core/src/runtime/browser-context/index.js';
import { scope as policies } from '../../../../../../doe-core/src/registry/runtime/context/index.js';
import { scope as registry } from '../../../../../../doe-component/src/registry/runtime/context/index.js';

// Presentation's compatibility assembly forwards shared bindings to their owners.
// The old initialization sequence and object identities remain unchanged.
export const scope = {};
for (const [owner, names] of [
  [browser, ['global']],
  [policies, ['layoutPolicies']],
  [registry, ['components', 'layouts', 'MIN_READABLE_FONT_PT', 'MIN_MICRO_FONT_PT', 'MAX_COLLECTION_ITEMS']],
]) {
  for (const name of names) Object.defineProperty(scope, name, {
    enumerable: true, configurable: true,
    get() { return owner[name]; },
    set(value) { owner[name] = value; },
  });
}
