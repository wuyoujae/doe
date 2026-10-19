// Origin: layout-engine/library-components.js; radar-chart.prepareConfig


export function prepareConfig(config) {
      return {
        ...config,
        title: undefined,
        subtitle: undefined,
        content: {
          ...config.content,
          showLegend: config.content?.showLegend ?? config.showLegend,
        },
      };
    }
