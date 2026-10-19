// Origin: public/yrkie-doe/components/channel-comparison/channel-comparison.js:8


export function targetOf(target) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("ChannelComparisonChart: target element was not found.");
    return host;
  }
