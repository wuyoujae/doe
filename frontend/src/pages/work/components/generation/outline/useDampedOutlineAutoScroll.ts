import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefCallback } from 'react';

const SPRING_STIFFNESS = 180;
const SPRING_DAMPING = 26;
const MAX_VELOCITY_PX_PER_SECOND = 3_200;
const BOTTOM_THRESHOLD_PX = 32;

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useDampedOutlineAutoScroll<T extends HTMLElement>(
  enabled: boolean,
  contentVersion: unknown,
): RefCallback<T> {
  const viewportRef = useRef<T | null>(null);
  const [viewportNode, setViewportNode] = useState<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const enabledRef = useRef(enabled);
  const followingRef = useRef(true);
  const expectedScrollTopRef = useRef<number | null>(null);

  const setViewportRef = useCallback((node: T | null) => {
    if (viewportRef.current === node) return;
    viewportRef.current = node;
    setViewportNode(node);
  }, []);

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastFrameTimeRef.current = null;
    velocityRef.current = 0;
  }, []);

  const animate = useCallback((timestamp: number) => {
    frameRef.current = null;
    const viewport = viewportRef.current;
    if (!viewport || !enabledRef.current || !followingRef.current) {
      stopAnimation();
      return;
    }

    const target = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    if (prefersReducedMotion()) {
      expectedScrollTopRef.current = target;
      viewport.scrollTop = target;
      stopAnimation();
      return;
    }

    const current = viewport.scrollTop;
    const expectedScrollTop = expectedScrollTopRef.current;
    if (
      expectedScrollTop !== null
      && target >= expectedScrollTop - 1
      && current < expectedScrollTop - 1
    ) {
      followingRef.current = false;
      expectedScrollTopRef.current = null;
      stopAnimation();
      return;
    }
    const distance = target - current;
    const previousTimestamp = lastFrameTimeRef.current;
    const deltaSeconds = previousTimestamp === null
      ? 1 / 60
      : Math.min(1 / 30, Math.max(1 / 240, (timestamp - previousTimestamp) / 1_000));
    lastFrameTimeRef.current = timestamp;

    let velocity = velocityRef.current + distance * SPRING_STIFFNESS * deltaSeconds;
    velocity *= Math.exp(-SPRING_DAMPING * deltaSeconds);
    velocity = Math.max(
      -MAX_VELOCITY_PX_PER_SECOND,
      Math.min(MAX_VELOCITY_PX_PER_SECOND, velocity),
    );

    const next = Math.max(0, Math.min(target, current + velocity * deltaSeconds));
    expectedScrollTopRef.current = next;
    viewport.scrollTop = next;
    velocityRef.current = velocity;

    if (Math.abs(target - next) < 0.5 && Math.abs(velocity) < 5) {
      viewport.scrollTop = target;
      stopAnimation();
      return;
    }

    frameRef.current = window.requestAnimationFrame(animate);
  }, [stopAnimation]);

  const scheduleFollow = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !enabledRef.current || !followingRef.current) return;
    if (prefersReducedMotion()) {
      const target = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      expectedScrollTopRef.current = target;
      viewport.scrollTop = target;
      stopAnimation();
      return;
    }
    if (frameRef.current === null) {
      lastFrameTimeRef.current = null;
      frameRef.current = window.requestAnimationFrame(animate);
    }
  }, [animate, stopAnimation]);

  useLayoutEffect(() => {
    const wasEnabled = enabledRef.current;
    enabledRef.current = enabled;
    if (!enabled) {
      expectedScrollTopRef.current = null;
      stopAnimation();
      return;
    }
    if (!wasEnabled) {
      followingRef.current = true;
      velocityRef.current = 0;
      expectedScrollTopRef.current = viewportRef.current?.scrollTop ?? null;
    }
    scheduleFollow();
  }, [contentVersion, enabled, scheduleFollow, stopAnimation, viewportNode]);

  useEffect(() => {
    const viewport = viewportNode;
    if (!viewport || !enabled) return undefined;

    let lastTouchY: number | null = null;
    const pauseFollow = () => {
      followingRef.current = false;
      expectedScrollTopRef.current = null;
      stopAnimation();
    };
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) pauseFollow();
    };
    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (event: TouchEvent) => {
      const nextY = event.touches[0]?.clientY ?? null;
      if (nextY !== null && lastTouchY !== null && nextY > lastTouchY) pauseFollow();
      lastTouchY = nextY;
    };
    const handleScroll = () => {
      const target = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      const current = viewport.scrollTop;
      const expectedScrollTop = expectedScrollTopRef.current;
      if (
        followingRef.current
        && expectedScrollTop !== null
        && target >= expectedScrollTop - 1
        && current < expectedScrollTop - 1
      ) {
        pauseFollow();
        return;
      }
      const distanceFromBottom = target - current;
      if (!followingRef.current && distanceFromBottom <= BOTTOM_THRESHOLD_PX) {
        followingRef.current = true;
        expectedScrollTopRef.current = current;
        scheduleFollow();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'PageUp') {
        pauseFollow();
      }
    };

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleFollow);
    const observedElements = new Set<Element>();
    const syncObservedElements = () => {
      if (!resizeObserver) return;
      const currentElements = new Set<Element>([viewport, ...Array.from(viewport.children)]);
      observedElements.forEach((element) => {
        if (currentElements.has(element)) return;
        resizeObserver.unobserve(element);
        observedElements.delete(element);
      });
      currentElements.forEach((element) => {
        if (observedElements.has(element)) return;
        resizeObserver.observe(element);
        observedElements.add(element);
      });
    };
    syncObservedElements();

    const mutationObserver = typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(() => {
          syncObservedElements();
          scheduleFollow();
        });
    mutationObserver?.observe(viewport, { childList: true, characterData: true, subtree: true });

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    viewport.addEventListener('keydown', handleKeyDown);
    viewport.addEventListener('touchmove', handleTouchMove, { passive: true });
    viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
    viewport.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      viewport.removeEventListener('scroll', handleScroll);
      viewport.removeEventListener('keydown', handleKeyDown);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, scheduleFollow, stopAnimation, viewportNode]);

  useEffect(() => stopAnimation, [stopAnimation]);

  return setViewportRef;
}
