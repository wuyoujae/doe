// Origin: browser_snapshot.js::finalizeCssAnimations


async function finalizeCssAnimations(page) {
  return page.evaluate(() => {
    const animations = document.getAnimations({ subtree: true });
    if (!animations.length) return { finalized: 0, cancelled: 0 };

    const prepared = [];
    let cancelled = 0;
    for (const animation of animations) {
      const effect = animation.effect;
      if (!effect || typeof effect.getComputedTiming !== "function") {
        animation.cancel();
        cancelled += 1;
        continue;
      }
      const computed = effect.getComputedTiming();
      const authored = typeof effect.getTiming === "function" ? effect.getTiming() : {};
      let targetTime = Number(computed.endTime);
      if (!Number.isFinite(targetTime)) {
        const delay = Number(authored.delay);
        const duration = Number(authored.duration);
        targetTime = (Number.isFinite(delay) ? delay : 0)
          + (Number.isFinite(duration) ? Math.max(0, duration - 0.001) : 0);
      }
      try {
        animation.pause();
        animation.currentTime = Math.max(0, targetTime);
        prepared.push(animation);
      } catch (_error) {
        animation.cancel();
        cancelled += 1;
      }
    }

    let finalized = 0;
    for (const animation of prepared) {
      try {
        if (typeof animation.commitStyles === "function") animation.commitStyles();
        animation.cancel();
        finalized += 1;
      } catch (_error) {
        animation.cancel();
        cancelled += 1;
      }
    }
    return { finalized, cancelled };
  });
}

module.exports = { finalizeCssAnimations };
