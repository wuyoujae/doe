// Origin: public/yrkie-doe/layout-engine/library-components.js:350


export function nativeConfig(props, width, height, autoItemColumns) {
    const { size: ignoredSize, ...config } = props;
    return {
      ...config,
      ...(Number.isFinite(Number(autoItemColumns))
        ? { __autoItemColumns: Number(autoItemColumns) }
        : {}),
      size: {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      },
    };
  }
