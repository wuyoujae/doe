// Origin: layout-engine/library-components.js; donut-chart.prepareConfig


export function prepareConfig(config) {
      return {
        ...config,
        title: undefined,
        // Donut charts communicate the takeaway through their separate slide
        // text/heading and center label. A second component subtitle consumes
        // scarce chart height and is intentionally unsupported.
        subtitle: undefined,
        content: {
          ...config.content,
          showLegend: config.content?.showLegend ?? config.showLegend,
        },
      };
    }
