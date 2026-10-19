import type { ReactNode } from 'react';

const soft = { fill: 'currentColor', fillOpacity: 0.12 };
const solid = { fill: 'currentColor', stroke: 'none' };
const lines = (x: number, y: number, width = 16) => <path d={`M${x} ${y}h${width}m-${width} 5h${width * 0.7}`} />;
const number = (x: number, y: number, value: number | string) => <text x={x} y={y} textAnchor="middle" dominantBaseline="central" stroke="none" fill="currentColor" fontSize="9" fontWeight="600">{value}</text>;

function cards(kind: string) {
  return <>{[5, 35].map((x, index) => <g key={x}>
    {kind === 'diagonal-rounded-cards'
      ? <path d={`M${x + 9} 10h15v22q0 8-9 8H${x}V19q0-9 9-9Z`} {...soft} />
      : kind === 'speech-bubble-cards'
        ? <path d={`M${x} 10h24v24h-8l-6 6v-6H${x}Z`} {...soft} />
        : <rect x={x} y="10" width="24" height="30" rx="3" {...(kind === 'outlined-cards' ? {} : soft)} />}
    {kind === 'left-accent-cards' && <path d={`M${x + 1} 13v24`} strokeWidth="4" />}
    {kind === 'top-accent-cards' && <path d={`M${x + 3} 11h18`} strokeWidth="4" />}
    {kind === 'top-left-icon-cards' && <circle cx={x + 7} cy="18" r="3" {...solid} />}
    {kind === 'top-badge-cards' && <circle cx={x + 12} cy="10" r="5" fill="var(--yrkie-color-white)" />}
    {kind === 'bottom-right-badge-cards' && <circle cx={x + 21} cy="36" r="7" fill="var(--yrkie-color-white)" />}
    {kind === 'labelled-icon-cards' && <><path d={`M${x + 4} 9h16v6H${x + 4}Z`} {...solid} /><circle cx={x + 6} cy="25" r="3" /></>}
    {kind === 'question-prompt-cards' && number(x + 12, 20, '?')}
    {kind === 'quote-frame-cards' && <path d={`M${x + 5} 15v4h-3v-3l3-3m6 2v4h-3v-3l3-3`} />}
    {kind === 'side-numbered-cards' && number(x + 5, 20, index + 1)}
    {kind === 'top-numbered-rule-cards' && <>{number(x + 5, 17, index + 1)}<path d={`M${x + 12} 17h8`} /></>}
    {lines(x + (kind === 'labelled-icon-cards' ? 12 : 5), 26, kind === 'labelled-icon-cards' ? 8 : 14)}
  </g>)}</>;
}

function timeline(kind: string) {
  return <><path d="M32 5v38" opacity=".4" />{[11, 24, 37].map((y, i) => <g key={y}>
    {kind !== 'unmarked-card-timeline' && (kind === 'numbered-node-timeline'
      ? <><rect x="28" y={y - 4} width="8" height="8" rx="2" {...soft} />{number(32, y, i + 1)}</>
      : <circle cx="32" cy={y} r="2.5" {...solid} />)}
    <path d={`M${i % 2 ? 35 : 23} ${y}h6`} />
    {kind.includes('card') && <rect x={i % 2 ? 41 : 3} y={y - 5} width="20" height="10" rx="2" {...soft} />}
    <path d={`M${i % 2 ? 44 : 6} ${y - 1}h14m-14 3h10`} />
  </g>)}</>;
}

function steps(kind: string) {
  const rising = kind.startsWith('ascending');
  return <>{[4, 24, 44].map((x, i) => {
    const y = rising ? 29 - i * 10 : 12;
    return <g key={x}>
      {kind === 'slanted-numbered-steps'
        ? <path d={`M${x + 3} ${y}h16l-3 13H${x}Z`} {...soft} />
        : kind.includes('arrow') || kind === 'chevron-steps'
          ? <path d={`M${x} ${y}h12l6 7-6 7H${x}l5-7Z`} {...soft} />
          : <rect x={x} y={y} width="16" height="13" rx={kind === 'pill-numbered-steps' ? 6 : 1} {...soft} />}
      {!rising || kind.includes('numbered') ? number(x + 9, y + 7, i + 1) : <path d={`M${x + 4} ${y + 7}h8`} />}
      {!rising && lines(x, 32, 16)}
    </g>;
  })}</>;
}

const drawings: Record<string, ReactNode> = {
  'title-group': <><path d="M9 11h16M9 19h46M9 25h37" strokeWidth="3" /><path d="M9 35h29" opacity=".5" /></>,
  'section-heading': <><path d="M17 11v26M35 11v26M17 24h18" strokeWidth="3" /><path d="m43 21 5-4v20m-4 0h8" /></>,
  'text-paragraph': <><path d="M10 11h44M10 20h44M10 29h44M10 38h29" /></>,
  'filled-text-panel': <><rect x="7" y="7" width="50" height="34" rx="3" {...soft} /><path d="M15 17h34M15 24h34M15 31h23" /></>,
  'icon-callout': <><rect x="4" y="14" width="56" height="22" rx="4" {...soft} /><circle cx="15" cy="25" r="5" />{number(15, 25, '!')}{lines(26, 23, 26)}</>,
  image: <><rect x="10" y="6" width="44" height="36" rx="3" /><circle cx="22" cy="17" r="4" {...soft} /><path d="m10 36 12-11 9 7 10-14 13 17" {...soft} /></>,
  checklist: <>{[12, 24, 36].map(y => <g key={y}><path d={`m9 ${y} 3 3 6-7M25 ${y}h29`} /></g>)}</>,
  'code-block': <><path d="m23 14-12 10 12 10m18-20 12 10-12 10M35 9l-6 30" strokeWidth="2.5" /></>,
  'math-formula': <><path d="m8 27 6 6 7-23h35M29 19l12 15m0-15L29 34M47 24h10m-10 6h10" /></>,
  'joined-cards': <><rect x="4" y="9" width="56" height="31" rx="3" {...soft} /><path d="M23 9v31M41 9v31" />{[9, 28, 46].map(x => <g key={x}>{lines(x, 21, 9)}</g>)}</>,
  'icon-linked-cards': <><rect x="5" y="10" width="25" height="29" rx="3" {...soft} /><rect x="34" y="10" width="25" height="29" rx="3" {...soft} /><circle cx="32" cy="24" r="6" fill="var(--yrkie-color-white)" /><path d="M29 24h6m-3-3v6" /></>,
  'dot-filled-cards': <>{[10, 29].map(y => <g key={y}><rect x="17" y={y - 4} width="41" height="15" rx="2" {...soft} /><circle cx="8" cy={y + 2} r="3" {...solid} />{lines(23, y + 1, 28)}</g>)}</>,
  'dot-text-items': <>{[12, 31].map(y => <g key={y}><circle cx="9" cy={y} r="3" {...solid} />{lines(19, y - 1, 37)}</g>)}</>,
  'icon-beside-text': <>{[12, 32].map(y => <g key={y}><rect x="6" y={y - 5} width="10" height="10" rx="3" {...soft} />{lines(24, y - 2, 33)}</g>)}</>,
  'image-above-text': <>{[7, 36].map(x => <g key={x}><rect x={x} y="8" width="21" height="18" rx="2" {...soft} /><path d={`m${x} 24 7-7 5 4 5-7 4 7`} />{lines(x, 33, 21)}</g>)}</>,
  'icon-above-text': <>{[17, 47].map(x => <g key={x}><circle cx={x} cy="17" r="9" {...soft} /><path d={`m${x - 4} 17 3 3 5-6`} />{lines(x - 10, 33, 20)}</g>)}</>,
  'bulleted-list': <>{[12, 24, 36].map(y => <g key={y}><circle cx="11" cy={y} r="2" {...solid} /><path d={`M21 ${y}h33`} /></g>)}</>,
  'numbered-text-list': <>{[12, 24, 36].map((y, i) => <g key={y}>{number(11, y, i + 1)}<path d={`M21 ${y}h33`} /></g>)}</>,
  'segmented-semicircle': <><path d="M8 39a24 24 0 0 1 48 0H44a12 12 0 0 0-24 0Z" {...soft} /><path d="M32 15v12M15 22l9 9m25-9-9 9" /></>,
  'petal-diagram': <>{[0, 90, 180, 270].map(angle => <ellipse key={angle} cx="32" cy="14" rx="9" ry="11" transform={`rotate(${angle} 32 24)`} {...soft} />)}</>,
  'circular-arrow-cycle': <><path d="M14 20a19 19 0 0 1 32-9l5 6m-1-10 1 10-10-1M50 28a19 19 0 0 1-32 9l-5-6m1 10-1-10 10 1" strokeWidth="3" /></>,
  'segmented-circle': <><circle cx="32" cy="24" r="20" {...soft} /><path d="M32 4v40M12 24h40" /></>,
  'ring-node-diagram': <><circle cx="32" cy="24" r="16" strokeWidth="4" opacity=".4" />{[[32, 8], [48, 24], [32, 40], [16, 24]].map(([x, y]) => <circle key={x + '-' + y} cx={x} cy={y} r="4" fill="var(--yrkie-color-white)" />)}</>,
  'widening-stair-diagram': <>{[0, 1, 2].map(i => <g key={i}><rect x="8" y={7 + i * 12} width={15 + i * 8} height="10" {...soft} />{lines(43, 10 + i * 12, 14)}</g>)}</>,
  'layered-pyramid': <><path d="M32 5 8 42h48Z" {...soft} /><path d="M24 18h16M16 30h32" /></>,
  'layered-inverted-pyramid': <g transform="translate(0 48) scale(1 -1)"><path d="M32 5 8 42h48Z" {...soft} /><path d="M24 18h16M16 30h32" /></g>,
  'quotation-blocks': <><path d="M10 13h16v11H15v7h-5Zm25 0h16v11H40v7h-5Z" {...soft} /><path d="M32 40h21" opacity=".5" /></>,
  'text-columns': <>{[7, 36].map(x => <g key={x}>{lines(x, 10, 21)}{lines(x, 23, 21)}{lines(x, 36, 21)}</g>)}</>,
  'metric-summary': <><text x="8" y="27" fontSize="23" stroke="none" fill="currentColor" fontWeight="600">42</text><path d="M44 12v15m8-15L42 27M9 37h44" /><circle cx="45" cy="13" r="1.5" /><circle cx="52" cy="26" r="1.5" /></>,
  'horizontal-3d-funnel': <>{[0, 1, 2].map(i => <g key={i}><path d={`M${7 + i * 15} ${20 - i * 5}l15-5v${18 + i * 10}l-15-5Z`} {...soft} /><ellipse cx={22 + i * 15} cy="24" rx="3" ry={9 + i * 5} {...soft} /></g>)}</>,
  'vertical-3d-funnel': <>{[0, 1, 2].map(i => <g key={i}><path d={`M${9 + i * 5} ${9 + i * 12}h${46 - i * 10}l-3 9q-${20 - i * 5} 5-${40 - i * 10} 0Z`} {...soft} /><ellipse cx="32" cy={9 + i * 12} rx={23 - i * 5} ry="4" {...soft} /></g>)}</>,
  'concentric-target': <><circle cx="32" cy="24" r="21" /><circle cx="32" cy="24" r="14" /><circle cx="32" cy="24" r="7" {...soft} /><circle cx="32" cy="24" r="2" {...solid} /></>,
  'folded-rising-arrow': <><path d="m12 38 15-15 14 4-15 16Zm9-14 15-15 14 4-15 16Zm10-14L46 1l11 16-9-2-10 10Z" {...soft} /><path d="m21 24 20 3m-10-17 19 3" /></>,
  'wave-rising-arrow': <><path d="M7 39c9-26 14-26 17-12s10 5 17-10l8-12 10 13-7-2c-10 24-16 27-19 12S24 26 17 42Z" {...soft} /></>,
  'layered-3d-cube': <><path d="m32 4 22 11v23L32 47 10 35V15Z" {...soft} /><path d="m10 15 22 11 22-11M32 26v21M10 25l22 12 22-11M10 15 32 4" /></>,
  'interlocking-3d-rings': <><circle cx="22" cy="24" r="16" strokeWidth="8" opacity=".45" /><circle cx="43" cy="24" r="16" strokeWidth="8" /><path d="M34 13a16 16 0 0 1 0 22" strokeWidth="8" opacity=".45" /></>,
  'droplet-arrow-steps': <>{[1, 21, 41].map(x => <path key={x} d={`M${x + 5} 12q8-6 18 10l-12 12a11 11 0 0 1-6-22Z`} {...soft} />)}</>,
  'serpentine-steps': <><path d="M8 8h36a8 8 0 0 1 0 16H20a8 8 0 0 0 0 16h35" strokeWidth="6" opacity=".3" />{[[13, 8], [44, 24], [20, 40], [53, 40]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="5" fill="var(--yrkie-color-white)" />{number(x, y, i + 1)}</g>)}</>,
  'folded-three-arrow-cycle': <>{[0, 120, 240].map(angle => <path key={angle} d="m32 4 14 23h-8L28 11l-5 5 2-12Z" transform={`rotate(${angle} 32 26)`} {...soft} />)}</>,
  'vertical-percentage-bars': <>{[10, 27, 44].map((x, i) => <g key={x}><rect x={x} y="5" width="9" height="37" rx="4.5" opacity=".4" /><rect x={x + 2} y={23 - i * 7} width="5" height={17 + i * 7} rx="2.5" {...solid} /></g>)}</>,
  'large-icon-items': <>{[16, 48].map(x => <g key={x}><circle cx={x} cy="17" r="12" {...soft} /><path d={`m${x - 5} 17 4 4 6-8`} />{lines(x - 11, 36, 22)}</g>)}</>,
  'staggered-arrow-cards': <>{[5, 26, 47].map((x, i) => <g key={x}><path d={`M${x} ${12 + (i % 2) * 6}h13v12h5l-5 6v10H${x}Z`} {...soft} /><circle cx={x + 6} cy={12 + (i % 2) * 6} r="6" fill="var(--yrkie-color-white)" />{lines(x + 3, 27, 7)}</g>)}</>,
  'data-table': <><rect x="7" y="7" width="50" height="34" rx="2" /><path d="M7 18h50M7 29h50M24 7v34M41 7v34" /><path d="M8 8h48v9H8Z" {...soft} /></>,
  'grouped-bar-chart': <><path d="M7 5v37h52" />{[12, 29, 46].map((x, i) => <g key={x}><rect x={x} y={25 - i * 8} width="5" height={17 + i * 8} {...solid} /><rect x={x + 6} y={31 - i * 8} width="5" height={11 + i * 8} {...soft} /></g>)}</>,
  'line-chart': <><path d="M7 5v37h52" opacity=".4" /><path d="m10 33 13-15 12 8L54 7" strokeWidth="2.5" />{[[10, 33], [23, 18], [35, 26], [54, 7]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.5" fill="var(--yrkie-color-white)" />)}</>,
  'stacked-bar-chart': <><path d="M7 5v37h52" />{[14, 31, 48].map((x, i) => <g key={x}><rect x={x} y={19 - i * 5} width="8" height={23 + i * 5} {...soft} /><rect x={x} y={31 - i * 3} width="8" height={11 + i * 3} {...solid} /></g>)}</>,
  'radar-chart': <><path d="m32 3 23 16-9 26H18L9 19Zm0 0v25M9 19l23 9 23-9M18 45l14-17 14 17" opacity=".4" /><path d="m32 11 17 11-9 18-15-4-8-16Z" {...soft} /></>,
  'risk-matrix': <><rect x="10" y="4" width="42" height="40" /><path d="M10 17h42M10 31h42M24 4v40M38 4v40" opacity=".4" /><circle cx="44" cy="12" r="3" {...solid} /><circle cx="32" cy="24" r="3" {...soft} /><circle cx="19" cy="35" r="3" {...solid} /></>,
  'waterfall-chart': <><path d="M6 5v37h53M17 19h9M31 9h9M45 24h8" opacity=".4" /><path d="M10 19h8v23h-8ZM51 24h8v18h-8Z" {...solid} /><path d="M25 9h8v10h-8ZM39 9h8v15h-8Z" {...soft} /></>,
  'donut-chart': <><circle cx="32" cy="24" r="17" strokeWidth="10" opacity=".25" /><path d="M32 7a17 17 0 0 1 16 23" strokeWidth="10" /></>,
  'tree-mind-map': <><path d="M23 24h12V10h10M35 24h10M35 24v14h10" /><rect x="3" y="18" width="20" height="12" rx="3" {...soft} />{[5, 19, 33].map(y => <rect key={y} x="45" y={y} width="15" height="10" rx="2" {...soft} />)}</>,
};

for (const name of ['filled-cards', 'top-left-icon-cards', 'outlined-cards', 'left-accent-cards', 'top-accent-cards', 'top-badge-cards', 'diagonal-rounded-cards', 'quote-frame-cards', 'speech-bubble-cards', 'top-numbered-rule-cards', 'side-numbered-cards', 'labelled-icon-cards', 'bottom-right-badge-cards', 'question-prompt-cards']) drawings[name] = cards(name);
for (const name of ['numbered-node-timeline', 'dot-node-timeline', 'dot-card-timeline', 'unmarked-card-timeline']) drawings[name] = timeline(name);
for (const name of ['slanted-numbered-steps', 'pill-numbered-steps', 'chevron-steps', 'ascending-bar-steps', 'ascending-arrow-steps', 'ascending-numbered-bar-steps']) drawings[name] = steps(name);

export function ComponentIcon({ name }: { name: string }) {
  return <svg className="doe-component-icon" viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{drawings[name]}</svg>;
}
