// Origin: layout-engine/components.js; list.adapt


export function adapt(root, component, context) {
      const itemCount = component.props.items?.length || 0;
      const requestedLayout = component.props.itemLayout || "auto";
      const requestedColumns = Math.max(
        1,
        Math.min(2, Number(component.props.itemColumns) || 2),
      );
      const canUseTwoColumns =
        context.width >= 700 ||
        (context.density !== "comfortable" && context.width >= 580);
      const columns =
        requestedLayout === "stack"
          ? 1
          : requestedLayout === "grid"
            ? canUseTwoColumns
              ? requestedColumns
              : 1
            : Number.isFinite(Number(context.autoItemColumns))
              ? Math.max(1, Math.min(2, Number(context.autoItemColumns)))
              : itemCount >= 6 && canUseTwoColumns
                ? 2
                : 1;
      root.style.setProperty("--item-columns", String(columns));
    }
