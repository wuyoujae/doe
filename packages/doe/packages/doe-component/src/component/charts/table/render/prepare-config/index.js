// Origin: layout-engine/library-components.js; table.prepareConfig


export function prepareConfig(config, context) {
      return {
        ...config,
        __layoutAvailableHeight: context.availableHeight,
        __flowLayout: context.flowLayout === true,
      };
    }
