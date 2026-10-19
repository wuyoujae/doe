// Origin: public/yrkie-doe/work-editor/work-editor.js:392


export function hasPendingSlideMedia(result, host) {
    const scope = result?.element || host;
    return Boolean(scope?.querySelector?.(
      '.component-media[data-media-state="loading"] .component-media__image',
    ));
  }
