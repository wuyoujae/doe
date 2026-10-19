import { absolutize, normalize, parsePath, serialize } from 'path-data-parser';
type GeometryPath = { d: string; fill: string; stroke: boolean };

export const LUCIDE_VERSION = '0.468.0';
export const LUCIDE_FALLBACK_ICON = 'circle-help';

export type LucideNodeTag = 'path' | 'circle' | 'ellipse' | 'rect' | 'line' | 'polyline' | 'polygon';
export type LucideNodeAttributes = Record<string, string>;
export type LucideNode = [LucideNodeTag, LucideNodeAttributes];

export type LucideIconDefinition = {
  name: string;
  nodes: LucideNode[];
  tags: string[];
};

export type LucideIconCatalog = {
  icons: LucideIconDefinition[];
  byName: ReadonlyMap<string, LucideIconDefinition>;
};

type RawIconNodes = Record<string, LucideNode[]>;
type RawIconTags = Record<string, string[]>;
type PathSegment = { key: string; data: number[] };

const geometryCache = new Map<string, GeometryPath[]>();
let catalogPromise: Promise<LucideIconCatalog> | null = null;

function moduleDefault<T>(module: unknown): T {
  if (module && typeof module === 'object' && 'default' in module) {
    return (module as { default: T }).default;
  }
  return module as T;
}

export function loadLucideIconCatalog(): Promise<LucideIconCatalog> {
  if (catalogPromise) return catalogPromise;
  catalogPromise = Promise.all([
    import('lucide-static/icon-nodes.json'),
    import('lucide-static/tags.json'),
  ]).then(([nodesModule, tagsModule]) => {
    const nodeMap = moduleDefault<RawIconNodes>(nodesModule);
    const tagMap = moduleDefault<RawIconTags>(tagsModule);
    const icons = Object.keys(nodeMap)
      .sort((left, right) => left.localeCompare(right))
      .map((name) => ({
        name,
        nodes: nodeMap[name] ?? [],
        tags: tagMap[name] ?? [],
      }));
    return {
      icons,
      byName: new Map(icons.map((icon) => [icon.name, icon])),
    };
  });
  return catalogPromise;
}

export function lucideDisplayName(name: string) {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function finiteNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pointsPath(points: string | undefined, close: boolean) {
  const values = String(points ?? '').match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g)?.map(Number) ?? [];
  if (values.length < 4 || values.length % 2 !== 0 || values.some((value) => !Number.isFinite(value))) {
    return '';
  }
  const pairs = Array.from({ length: values.length / 2 }, (_, index) => (
    `${values[index * 2]} ${values[index * 2 + 1]}`
  ));
  return `M ${pairs[0]} ${pairs.slice(1).map((point) => `L ${point}`).join(' ')}${close ? ' Z' : ''}`;
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  if (rx <= 0 || ry <= 0) return '';
  return [
    `M ${cx - rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`,
    'Z',
  ].join(' ');
}

function rectPath(attributes: LucideNodeAttributes) {
  const x = finiteNumber(attributes.x);
  const y = finiteNumber(attributes.y);
  const width = finiteNumber(attributes.width);
  const height = finiteNumber(attributes.height);
  if (width <= 0 || height <= 0) return '';
  const rawRadius = finiteNumber(attributes.rx, finiteNumber(attributes.ry));
  const radius = Math.max(0, Math.min(rawRadius, width / 2, height / 2));
  if (!radius) return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  return [
    `M ${x + radius} ${y}`,
    `H ${x + width - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + width} ${y + radius}`,
    `V ${y + height - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height}`,
    `H ${x + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x} ${y + height - radius}`,
    `V ${y + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    'Z',
  ].join(' ');
}

function nodePath([tag, attributes]: LucideNode) {
  if (tag === 'path') return String(attributes.d ?? '').trim();
  if (tag === 'line') {
    return `M ${finiteNumber(attributes.x1)} ${finiteNumber(attributes.y1)} L ${finiteNumber(attributes.x2)} ${finiteNumber(attributes.y2)}`;
  }
  if (tag === 'polyline') return pointsPath(attributes.points, false);
  if (tag === 'polygon') return pointsPath(attributes.points, true);
  if (tag === 'circle') {
    const radius = finiteNumber(attributes.r);
    return ellipsePath(finiteNumber(attributes.cx), finiteNumber(attributes.cy), radius, radius);
  }
  if (tag === 'ellipse') {
    return ellipsePath(
      finiteNumber(attributes.cx),
      finiteNumber(attributes.cy),
      finiteNumber(attributes.rx),
      finiteNumber(attributes.ry),
    );
  }
  if (tag === 'rect') return rectPath(attributes);
  return '';
}

function normalizedPath(path: string) {
  if (!path) return '';
  const scale = 100 / 24;
  const segments = normalize(absolutize(parsePath(path))).map((segment): PathSegment => ({
    key: segment.key,
    data: segment.data.map((value) => {
      const scaled = value * scale;
      if (!Number.isFinite(scaled)) throw new Error('Lucide icon contains non-finite geometry.');
      return Number(scaled.toFixed(4));
    }),
  }));
  if (!segments.length || segments.some((segment) => !['M', 'L', 'C', 'Z'].includes(segment.key))) {
    throw new Error('Lucide icon contains unsupported geometry.');
  }
  return serialize(segments);
}

export function lucideGeometryPaths(icon: LucideIconDefinition): GeometryPath[] {
  const cached = geometryCache.get(icon.name);
  if (cached) return cached.map((path) => ({ ...path }));
  const paths = icon.nodes
    .map((node) => normalizedPath(nodePath(node)))
    .filter(Boolean)
    .map((d) => ({ d, fill: 'none', stroke: true }));
  if (!paths.length) throw new Error(`Lucide icon ${icon.name} has no renderable geometry.`);
  geometryCache.set(icon.name, paths);
  return paths.map((path) => ({ ...path }));
}

export async function resolveLucideIcon(name: string) {
  const catalog = await loadLucideIconCatalog();
  return catalog.byName.get(name) ?? catalog.byName.get(LUCIDE_FALLBACK_ICON) ?? null;
}
