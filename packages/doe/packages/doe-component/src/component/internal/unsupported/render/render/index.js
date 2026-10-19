// Origin: layout-engine/components.js; unsupported.render


export function render(component, { element }) {
      const root = element("article", "component-text component-unsupported");
      root.append(
        element(
          "h2",
          "component-title",
          `未加载组件：${component.props.requestedType || "unknown"}`,
        ),
        element(
          "p",
          "component-text__body",
          "原始节点已保留；加载对应组件插件后可重新编译。",
        ),
      );
      return root;
    }
