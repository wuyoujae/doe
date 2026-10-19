import type { SVGProps } from 'react';
import './Wordmark.css';

/** Geometry from resources/static/logo.svg; color belongs to the host theme. */
export function Wordmark({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="463" height="122" viewBox="0 0 463 122" role="img" aria-label="Yrkie" className={`yrkie-wordmark ${className}`} {...props}>
      <g fill="currentColor" shapeRendering="crispEdges">
        <rect x="16" y="16" width="28" height="28" />
        <rect x="78" y="16" width="28" height="28" />
        <rect x="47" y="47" width="28" height="28" />
        <rect x="47" y="78" width="28" height="28" />
        <rect x="171" y="16" width="28" height="28" />
        <rect x="140" y="47" width="28" height="28" />
        <rect x="140" y="78" width="28" height="28" />
        <rect x="233" y="16" width="28" height="28" />
        <rect x="264" y="16" width="28" height="28" />
        <rect x="233" y="47" width="28" height="28" />
        <rect x="233" y="78" width="28" height="28" />
        <rect x="264" y="78" width="28" height="28" />
        <rect x="326" y="16" width="28" height="28" />
        <rect x="326" y="47" width="28" height="28" />
        <rect x="326" y="78" width="28" height="28" />
        <rect x="419" y="16" width="28" height="28" />
        <rect x="388" y="47" width="28" height="28" />
        <rect x="419" y="78" width="28" height="28" />
      </g>
    </svg>
  );
}
