import { useEffect, useMemo, useState } from 'react';
import './generation-status.css';

const chevron = Array.from({ length: 9 }, (_, index) => {
  const row = Math.floor(index / 3);
  const column = index % 3;
  return (column + Math.abs(row - 1)) * 90;
});

const orbitOrder = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, index) => {
  const position = orbitOrder.indexOf(index);
  return position === -1 ? null : position * 110;
});

const patterns = {
  Drive: { delays: chevron, duration: 650, round: false },
  Dots: { delays: chevron, duration: 650, round: true },
  Orbit: { delays: orbit, duration: 950, round: false },
} as const;

const fallbackLabels = ['Churning'] as const;
const labelRotationIntervalMs = 60_000;

export type LoadingStateVariant = keyof typeof patterns;

type LoadingStateProps = {
  labels: readonly string[];
  statusLabel: string;
  variant?: LoadingStateVariant;
  className?: string;
};

export function LoadingState({
  labels,
  statusLabel,
  variant = 'Drive',
  className,
}: LoadingStateProps) {
  const availableLabels = labels.length > 0 ? labels : fallbackLabels;
  const [labelState, setLabelState] = useState({
    activeIndex: 0,
    departingIndex: null as number | null,
  });

  useEffect(() => {
    if (availableLabels.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setLabelState((current) => {
        const activeIndex = current.activeIndex % availableLabels.length;
        const offset = 1 + Math.floor(Math.random() * (availableLabels.length - 1));
        return {
          activeIndex: (activeIndex + offset) % availableLabels.length,
          departingIndex: activeIndex,
        };
      });
    }, labelRotationIntervalMs);

    return () => window.clearInterval(timer);
  }, [availableLabels.length]);

  const activeIndex = labelState.activeIndex % availableLabels.length;
  const departingIndex = labelState.departingIndex === null
    ? null
    : labelState.departingIndex % availableLabels.length;
  const widestLabel = useMemo(
    () => availableLabels.reduce(
      (widest, label) => (label.length > widest.length ? label : widest),
      availableLabels[0],
    ),
    [availableLabels],
  );
  const { delays, duration, round } = patterns[variant] ?? patterns.Drive;
  const rootClassName = ['beautiful-loading-state', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} role="status" aria-label={statusLabel}>
      <span className="sr-only">{statusLabel}</span>
      <span className="beautiful-loading-visual" aria-hidden="true">
        <span className="beautiful-loading-grid">
          {delays.map((delay, index) => (
            <span
              key={index}
              className={`beautiful-loading-cell${round ? ' is-round' : ''}`}
              style={{
                opacity: delay === null ? 0.07 : 0.15,
                animation: delay === null
                  ? 'none'
                  : `beautiful-pixel-on ${duration}ms ease-in-out ${delay}ms infinite`,
              }}
            />
          ))}
        </span>
        <span className="beautiful-loading-label-window">
          <span className="beautiful-loading-label-sizer">{widestLabel}</span>
          {departingIndex !== null && (
            <span
              key={`departing-${departingIndex}`}
              className="beautiful-loading-label is-leaving"
            >
              {availableLabels[departingIndex]}
            </span>
          )}
          <span
            key={`active-${activeIndex}`}
            className={`beautiful-loading-label${departingIndex === null ? '' : ' is-entering'}`}
          >
            {availableLabels[activeIndex]}
          </span>
        </span>
      </span>
    </div>
  );
}
