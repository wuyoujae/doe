# skills-schema: DOE Slide Authoring for Local Agents

SlideEngine Schema v4.21 · wire version: 4 · skills edition: 8 · 43 component types; 20 registered themes. External JSON; platform: Markdown V2.1.

## 1. Reading and serialization rules

- TypeScript describes closed JSON: `?` optional, `|` alternatives, `&` intersection, `T[]` arrays, `[T,T,T]` exactly three. Inclusive bounds and prose constraints also apply.
- Draft one complete Root (deck) or Slide (edit); section 7 defines MCP wrappers. Use JSON double quotes, numeric/boolean literals and real containers, never stringified props/content. No duplicate keys, comments, trailing commas, fences, placeholders, spread, undefined, null, NaN or Infinity; only transport expectedRevision can be null.
- Escape once: `\"`, `\\`, `\n`, `\t`. Raw line breaks are invalid; `\\n` is literal backslash+n. Plain strings carry content; code/formulas use their declared syntax. No HTML or invented formatting fields.
- Only declared case-sensitive keys/enums; omit unused optionals. Empty strings/containers/auto require explicit permission; Group.layout:{} is legal. Strings: nonblank, NUL-free, at most 20,000 characters. IDs: at most 128, no controls; deck.title: at most 200. Numbers must be finite; integer fields cannot be fractional. Zero/false are values.
- Preserve confirmed page count/order (1–200); unique slide IDs per deck and Node IDs per slide, including nested Groups. Maximum 2,048 Nodes per slide; Group depth at most three, root Group = one.
- Copy authorized src exactly, including scheme/case/suffix. Never invent URLs, paths, hashes or generation markers. Every example asset/reference/revision/UUID is fictional.
- Icon is an available PascalCase Lucide name, e.g. Target, ShieldCheck or Handshake, never an image URL, SVG or component type. Required icons need valid names; optional icons may be omitted.

## 2. Document metadata, themes, canvas, and layout

No meta wrapper. Wire version=4; deck.title is metadata. Deck.theme applies to all slides (20 IDs below; default yrkie-theme); pageNumber belongs to Root. Slide array order is presentation order; preserve IDs. Canvas 960×540pt/16:9; Slide background/layout and Node layout are local. Theme owns appearance; no custom themes/CSS, editor state, notes, animations, transitions or export settings.

```ts
type Icon = string;
type Align = "left"|"center"|"right";
type CrossAlign = "start"|"center"|"end"|"stretch";
type Region = "content"|"media";
type Position = `${number}% ${number}%`;
type Three<T> = [T,T,T];

type Root = {
version:4;
pageNumber:{ enabled:boolean;format:"number"|"fraction" };
logo?:{src:string};
deck:{ title:string;theme:"yrkie-theme"|"yrkie-violet"|"yrkie-drak"|"yrkie-ledger"|"yrkie-sunburst"|"yrkie-atelier"|"yrkie-coast"|"yrkie-noir"|"yrkie-botanical"|"yrkie-swiss"|"yrkie-blueprint"|"yrkie-terracotta"|"yrkie-aurora"|"yrkie-rose"|"yrkie-cobalt"|"yrkie-sage"|"yrkie-copper"|"yrkie-citrus"|"yrkie-obsidian"|"yrkie-vermilion";slides:Slide[] };
};
type Slide = {
id:string;
size:{ width:960;height:540;unit:"pt" };
blocks:Node[];// 1 or more
background?:Background;
logo?:{src:string};
layout?:{ preset:"flow"|"narrative"|"balanced"|"dashboard"|"edge-media" };
};
type Leaf = {
[K in keyof Props]:{
  id:string;type:K;props:Props[K];layout?:{ span?:"full"|"half";region?:Region };
}
}[keyof Props];
type Group = {
id:string;type:"layout-group";
layout:GroupLayout;
children:Node[];// 1–24
};
type Node = Leaf|Group;
type GroupLayout = (
{ variant?:"row"|"stack" }|{ variant:"composition";direction:"row";ratio:"balanced"|"primary-first"|"primary-second" }|{ variant:"columns";columns:2|3|4 }
) & { align?:CrossAlign;region?:Region }|EdgeLayout;
type EdgeLayout = {
variant:"edge-media";
mediaPosition:"left"|"right"|"top"|"bottom";
mediaRatio?:number;
mediaShape?:"straight"|"fade"|"diagonal"|"circle"|"inner-circle";
contentAlign?:"start"|"center"|"end";
};
type Background = {
src:string;
enabled?:boolean;
fit?:"cover"|"contain";
position?:Position;
foreground?:"auto"|"light"|"dark";
contentAlign?:"left"|"center"|"right";contentVerticalAlign?:"top"|"center"|"bottom";
contentWidth?:number; // 0.2–1 of the safe-area width
textSurface?:"auto"|"none";
overlay?:false|{ opacity?:number;direction?:"to-right"|"to-left"|"to-bottom"|"to-top" };
};
```

Leaf.type must match Props. Leaves have props; Groups have children, never both. Presets are not types.

### Layout and background field effects

- Slide preset defaults flow; balanced shares baseline spacing, narrative increases section gaps, dashboard reduces padding/gaps, edge-media opens the image edge. Group {} delegates layout; row/stack request horizontal/vertical flow.
- Composition has exactly two children, direction row and ratio balanced (1:1), primary-first (3:2), or primary-second (2:3); first is left. `notice` cannot be a direct or nested descendant of `composition`; edge Groups are excluded. A wrapper error requires inspecting descendants. Move notice outside composition or use row/stack/columns without direction/ratio. If only compilation creates the invalid combination, report the compiler failure; retain content.
- Columns requires numeric 2|3|4 only on that variant; each child occupies a column, extra children wrap. Wrap multiple components in a Group. Align is cross-axis, not text alignment; leaf span full/half requests width, not coordinates.
- Edge-media requires Slide preset edge-media and exactly one root edge Group, with exactly two children: one content Node and one media Leaf, each with matching layout.region. Only those children accept region. mediaPosition sets the edge, regardless of order. Edge Groups cannot nest or coexist with any background, including disabled.
- Only media bleeds. Left/right mediaRatio 0.28–0.52 (default 0.36); top/bottom 0.28–0.58 (default 0.46). Content retains padding; contentAlign defaults center. mediaShape: straight (default), fade inward, diagonal clip, circle outward or inner-circle inward; follows mediaPosition without changing source/theme.
- Background stays outside flow behind blocks. Omit for theme background; enabled false hides but retains it. Omission/true enables it; src is always required. Fit defaults contain; cover crops. Position is horizontal/vertical percentages 0–100, default 50% 50%.
- Foreground auto/light/dark controls contrast; reading surfaces retain theme colors. Overlay false disables; object opacity 0–0.9 (default 0), direction to-right (default), to-left/to-bottom/to-top. True is invalid.
- Enabled image backgrounds support contentWidth 0.2–1 (safe-area fraction), contentAlign left/center/right and contentVerticalAlign top/center/bottom. These do not move the image/logo/page number, and are ignored without an enabled image or in edge-media. TextSurface auto/none controls title-group/heading/text reading surfaces; other components retain their surfaces.
- Root/Slide logo {src} uses an authorized managed image or /yrkie-doe/brand/logo-text.webp; omit to preserve inheritance. Null is not permitted by external authoring.
- Page numbering: enabled false hides it; required format number shows current, fraction current/total. Runtime derives values from order/count; no numbering Leaves or manually authored values.

### Layout execution boundaries

- Edge-media fraction is BEFORE content padding (0.35 leaves 65% before insets); only media bleeds. Columns may reflow vertically: budget all rows, text and images. Legal fields/counts do not guarantee fit; no generic diagram height/font-size field exists and spare height need not enlarge fixed geometry.
- Preserve required content/pages; recompose, never clip, hide, bypass overflow or assume continuation. Check every region for fits:false, safe-area-overflow, locked-bleed-overflow, overlaps, blocked wrapping and component-fit failures. Correct/recheck; without rendering never claim measured fit.

## 3. Component props

Paths apply to EVERY Leaf, including descendants. Required content is an object; never flatten wrappers.

| Exact array path | Component types |
| --- | --- |
| `props.items` | list, ordered-list, todo-list, contents, item-cards, shape-contents, 3d-funnel, concentric-circles, layered-funnel, folded-arrow, wave-arrow, layered-cube, double-ring, droplet-process, serpentine-process, recycling-arrows, vertical-progress, icon-columns, badge-cards |
| `props.content.items` | capability-cards, numbered-icon-cards, donut-chart, risk-matrix, waterfall-chart, mind-map |
| `props.content.columns`, `props.content.rows` | table; each row owns `cells` |
| `props.content.categories`, `props.content.series` | grouped-bar-chart, line-chart, stacked-bar-chart |
| `props.content.axes`, `props.content.datasets` | radar-chart |

Direct props.items collections have no content wrapper. Type changes require matching props/item fields. Wrong-path data is missing data; array bounds do not guarantee fit.

```ts
type TitleText = { title:string;text:string };
type IconItem = TitleText & {icon?:Icon};
type ListProps = { items:string[];title?:string };// items 1–100
type CategoryAxis = { valuePrefix?:string;valueSuffix?:string;maxValue?:number;tickInterval?:number };
type TrendAxis = CategoryAxis & { includeZero?:boolean;minValue?:number };
type Series = { name:string;data:number[] };// data 1–100
type Categories = { categories:string[];series:Series[] };// each array: 1–100
type CategoryChart = { content:Categories & CategoryAxis;subtitle?:string;showLegend?:boolean };
type TableCell = string|number|{ text:string;emphasis?:"muted"|"highlight" };
type SemanticWrap = { locale?:string;protectedTerms?:string[] };
type DonutItem = {
label:string;value:number;
percentLabel?:string;primary?:boolean;
valueLabel?:string|false;
};
type WaterfallItem = {
label:string;value:number;type?:"change"|"total";
connectToNext?:boolean;showValue?:boolean;valuePosition?:"inside"|"above"|"badge";
};

type Props = {
"serpentine-process": { items: { title:string;text:string;icon?:string }[] }; // 1–6 items.
"recycling-arrows": { items: IconItem[] }; // Exactly 3 items.
"vertical-progress": { items: { value:number;text:string }[] }; // 1–4 items; value 0–100.
"icon-columns": { items: { title:string;text:string;icon?:string }[] }; // 1–4 items.
"badge-cards": { items: { title:string;text:string;icon?:string;value?:string }[] }; // 1–4 items; optional value bar.

"mind-map":{content:{items:{level:number;title:string;text:string;icon?:string}[]}}; // 1–40 preorder nodes, root level 0, following levels 1–5; max 6 root branches.

"droplet-process":{ items:IconItem[] }; // 1–5 items.

"concentric-circles":{ items:{ title:string;text:string;icon?:string }[] }; // 1–4 items.
"layered-funnel":{ items:{ title:string;text:string }[] }; // 1–4 items.
"folded-arrow":{ items:IconItem[] }; // 1–4 items.
"wave-arrow":{ items:IconItem[] }; // 3–3 items.
"layered-cube":{ items:IconItem[] }; // 1–4 items.
"double-ring":{ items:{ title:string;text:string;side?:"left"|"right";icon?:Icon }[] }; // 1–3 on each side; omitted sides alternate.

"3d-funnel":{ items:{ title:string;text:string }[] }; // 1–4 segments; default 3 in Studio.
"hero":{ title:string;eyebrow?:string;subtitle?:string;icon?:Icon;align?:Align };
"heading":{ text:string;level?:1|2|3;kicker?:string;variant?:"section"|"plain"|"display" };
"text-panel":{ text:string }; // Filled Base text panel.
"text":{ text:string }; // Normal body text.
"code-block":{
  code:string;wrap?:boolean;
  language?:"python"|"javascript"|"typescript"|"json"|"html"|"css"|"sql"|"shell"|"text";
};
"list":ListProps;
"ordered-list":ListProps;
"todo-list":{ items:{ text:string;checked:boolean }[];title?:string };// 1–100
"notice":{ text:string;icon?:Icon };
"stat":{ value:string|number;label?:string;description?:string };
"media":{ src:string;alt:string;fit?:"natural"|"contain"|"cover"|"fill";position?:Position;aspectRatio?:"1:1"|"4:3"|"3:4"|"16:9"|"9:16" };
"image-text":{ src:string;title:string;text:string;alt?:string;imageSize?:"compact"|"full";imageFit?:"contain"|"cover";imageAspectRatio?:"1:1"|"4:3"|"3:4"|"16:9";surface?:"none"|"soft" };
"icon-text":{ icon:Icon;title:string;text:string };
"math-formula":{ content:{ formula:string;display?:boolean;align?:Align } };

"quote":{ text:string;source?:string };
"question-card":{ title:string;text?:string;index?:string|number };
"contents":{
  presentation:"metrics"|"cards:filled"|"cards:filled-icon"|"cards:outline"|"cards:side-rule"|"cards:top-rule"|"cards:top-icon"|"cards:connected"|"cards:connected-icon"|"cards:leaf"|"cards:quote"|"cards:bubble"|"dot-card"|"dot-list"|"numbered-parallelogram"|"numbered-pill"|"numbered-chevron"|"ascending-bar"|"ascending-arrow"|"ascending-numbered"|"numbered-top-rule"|"numbered-inline"|"timeline-numbered"|"timeline-dots"|"timeline-dot-cards"|"alternating"|"icon-horizontal"|"image-text"|"icon-text"|"list:unordered"|"list:ordered"|"shape:semicircle"|"shape:petals"|"shape:cycle-arrows"|"shape:full-circle"|"shape:ring"|"shape:stairs"|"shape:pyramid"|"shape:inverted-pyramid"|"capability"|"numbered"|"question"|"quotation"|"columns";
  items:{id:string;title?:string;text?:string;icon?:Icon;src?:string;alt?:string;source?:string;label?:string|number;bullets?:string[]}[];
  title?:string;subtitle?:string;itemLayout?:"auto"|"stack"|"grid";itemColumns?:"auto"|1|2|3|4|5|6|7|8|9|10|11|12;columnPreference?:"auto"|1|2|3|4|5|6|7|8|9|10|11|12;
  orientation?:"vertical"|"horizontal";staggered?:boolean;connectors?:boolean;
  imageSize?:"compact"|"full";imageFit?:"contain"|"cover";imageAspectRatio?:"1:1"|"4:3"|"3:4"|"16:9";surface?:"none"|"soft"; // image-text only
};
"item-cards":{
  items:(TitleText & { icon?:Icon })[];// 1–12
  variant?:"filled"|"filled-icon"|"outline"|"side-rule"|"top-rule"|"top-icon"|"connected"|"connected-icon"|"leaf"|"quote"|"bubble";
};
"shape-contents":
  { variant?:"semicircle"|"petals"|"cycle-arrows"|"full-circle"|"ring"|"stairs"|"pyramid"|"inverted-pyramid";items:(TitleText & {icon?:Icon})[] };
"capability-cards":{ content:{ items:(TitleText & { icon?:Icon })[] };title?:string };// 1–6
"numbered-icon-cards":{ content:{ items:(TitleText & { icon:Icon })[] };title?:string };// 2–6

"table":{
  content:{
    columns:({ header:string;align?:Align } & SemanticWrap)[];// 1–12
    rows:{ cells:TableCell[] }[];// 1–100
  };
  ariaLabel?:string;borderStyle?:"grid"|"none"|"three-line";
  semanticWrap?:false|SemanticWrap;
};
"grouped-bar-chart":CategoryChart;
"line-chart":{
  content:TrendAxis & {
    categories:string[];// 1–100
    series:(Series & { labels?:{ index:number;text?:string|number }[] })[];// 1–100
  };
  showLegend?:boolean;smooth?:boolean;
};
"stacked-bar-chart":{
  content:Categories & CategoryAxis & {
    showYAxis?:boolean;showValues?:boolean;legendReversed?:boolean;
  };
  subtitle?:string;showLegend?:boolean;
};
"radar-chart":{
  content:{
    axes:{ label:string;max:number }[];// 3–8
    datasets:{ name:string;values:number[] }[];// 1–3
  };
  subtitle?:string;showLegend?:boolean;
};
"donut-chart":{
  content:{
    items:DonutItem[];// 2–6
    variant?:"standard"|"compact"|"hero";showLegend?:boolean;
    center?:{ title?:string|string[];value?:string|number;eyebrow?:string;subtitle?:string|string[] };
    valuePrefix?:string;valueSuffix?:string;maximumFractionDigits?:0|1|2|3;
  };
};
"risk-matrix":{
  content:{
    items:{ label:string;x:number;y:number }[];// 1–100
    xLabel?:string;yLabel?:string;
    priorityZone?:{ x:number;y:number;width:number;height:number;label?:string;labelLines?:string[] };
  };
  subtitle?:string;
};
"waterfall-chart":{
  content:TrendAxis & {
    items:WaterfallItem[];// 2–100
    showYAxis?:boolean;showValues?:boolean;showChangeSigns?:boolean;staggerLabels?:boolean;
  };
  subtitle?:string;
};

};
```

### Text, media, collections

- Heading defaults level 2; variant section/plain/display. Body text uses normal typography, no retired role. Hero alone exposes align here. Code is a string; language defaults text and wrap true.
- Media fit: natural intrinsic ratio, contain whole image, cover crop, fill stretch; omission infers fit. AspectRatio sets the frame, otherwise metadata applies. Nonempty alt required. Image-text uses imageSize/imageFit/imageAspectRatio/surface, not media fit/position/aspectRatio.
- Preserve Contents item IDs and hidden fields; empty optional slots are hidden. Counts: semicircle/cycle-arrows/full-circle/ring 2–6, petals 2–8, stairs/pyramid/inverted-pyramid 2–12, numbered 2–6, others 1–12. Required: metrics title/label without icon; shapes title/text; numbered title/text/icon; capability title/icon plus text or bullets; question title; quotation text without title. Source only quotation; label only question/metrics; bullets only capability; src/alt only image-text (src required); icon-horizontal requires icon.
- Contents nonempty component title only capability/numbered/cards/lists; no subtitle. Columns default 3: metrics 1–12, ordinary 1–4, ascending 1–5, list 1–2, shapes/alternating/timelines 1. Ordinary last rows fill width; ascending rows keep equal cell widths (4 items=2×2). Items have equal heights; columnPreference retains a choice up to 12 for metrics, otherwise 5. Orientation/staggered/connectors control supported timelines/alternating; numbered shapes also use orientation. Image settings require image-text. Never discard content to force a style.
- Item-cards defaults filled; only filled-icon/top-icon/connected-icon show icons; all retain items. Shape-contents defaults semicircle, with the Contents shape bounds above. Presets are type+variant; columns are Groups. Runtime numbers lists/processes/shapes; question-card.index overrides order; numbered-icon-cards has no number/index.
- Table rows are {cells:[...]}; cell count equals column count in order. Cell objects require string text; emphasis muted/highlight controls text. Column align controls text, borderStyle grid(default)/none/three-line. SemanticWrap false disables; true invalid. Locale is a language tag; column locale overrides table, protectedTerms merge to keep phrases together. AriaLabel is accessibility text.

### Chart relationships

- Every grouped/line/stacked series data length equals categories length, in order. Numeric data only, never percentages/currency strings; grouped/stacked nonnegative, line/waterfall may be negative.
- minValue<=maxValue; tickInterval>0; includeZero controls zero inclusion. Prefix/suffix format labels only. Indices are zero-based integers in range; line labels.index references categories and must update after reordering.
- ShowLegend belongs to props for grouped/line/stacked/radar (default true), content for donut. Line smooth defaults true; false makes straight segments. Labels text overrides the point value; no line subtitle. Stacked defaults showYAxis false, showValues true, legendReversed false; reversal does not reorder series/data.
- Radar axes max>0; dataset length equals axes length; values range 0–axis max.
- Donut values nonnegative with positive sum; percent=value/sum, not necessarily sum=100. PercentLabel changes text only; maximumFractionDigits integer 0–3. Variant defaults standard, the only legend variant; primary marks an item, hero shows internal values. ValueLabel false hides or string overrides; never true/number. Center.value (including 0) selects value/eyebrow/subtitle, otherwise title; title/subtitle accept string or string arrays. Extra annotations are not rendered or newly authored.
- Risk x/y range 0–1, right/up. PriorityZone x/y/width/height range 0–1; x+width<=1, y+height<=1. Nonempty labelLines overrides label.
- Waterfall change(default) adds to the running total from zero; total sets an absolute total. Never replace changes with cumulative totals. ConnectToNext false hides its outgoing connector; valuePosition inside/above/badge. Defaults showYAxis/showValues true, showChangeSigns/staggerLabels false. Global showValues or item showValue false hides values; staggerLabels alternates label rows. Retired callouts/comparisons/footnotes are not author fields.

## 4. Formula strings and escaping

Formula uses the LaTeX subset below, without $, $$, \(, \), \[, \] wrappers. Display defaults false; true enables supported display limits. Align defaults center.

Before JSON escaping:

- Scripts: `x_{i}^{2}`; balance braces around expressions/arguments.
- Fractions: `\frac{a}{b}`; dfrac/tfrac/cfrac share that syntax. Roots: `\sqrt{x}`, `\sqrt[3]{x}`. Paired delimiters: `\left(a+b\right)`.
- One braced argument: text, mathrm, operatorname, mathit, mathbf, boldsymbol, mathsf, mathtt, mathbb, mathcal, mathfrak, textit, textbf, textrm, textup. No nested math/full TeX fonts.
- Prefix these operator/function names with a backslash: sum, prod, coprod, int, iint, iiint, oint, bigcup, bigcap, bigoplus, bigotimes, lim, liminf, limsup, max, min, sup, inf, log, ln, exp, sin, cos, tan, cot, sec, csc, arcsin, arccos, arctan, sinh, cosh, tanh, deg, ker, dim, det, arg, Pr, gcd. Limits use `_{lower}^{upper}`.
- One braced accent argument: hat, acute, dot, ddot, tilde, grave, breve, check, vec, bar, overline, overrightarrow, widehat, widetilde. Unicode Greek/math symbols are valid (α β θ ≤ ≥ × ∞). Other symbols: Unicode/listed structures only; no macros/packages.
- Environments: matrix, pmatrix, bmatrix, vmatrix, Vmatrix, cases, aligned, align, alignedat, array. Match `\begin{NAME}`/`\end{NAME}`; `&` separates columns, `\\` rows. Matrix rows need equal columns; cases needs two. Array ignores its column specification, e.g. `{cc}`. No column-count argument after `\begin{alignedat}`.

JSON requires doubled formula backslashes, FOUR for TeX row breaks. Unescaped \frac/\begin become invalid formula control characters \f/\b. Executable examples:

```json
[
{"id":"f1","type":"math-formula","props":{"content":{"formula":"\\frac{a_{1}+b}{2}","display":true,"align":"right"}}},
{"id":"f2","type":"math-formula","props":{"content":{"formula":"\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}"}}},
{"id":"f3","type":"math-formula","props":{"content":{"formula":"f(x)=\\begin{cases}x^{2}&x≥0\\\\-x&x<0\\end{cases}"}}},
{"id":"f4","type":"math-formula","props":{"content":{"formula":"\\sum_{i=1}^{n}x_{i}+\\sqrt[3]{8}","display":true}}}
]
```

## 5. Complete Root examples

```json
{"version":4,"pageNumber":{"enabled":true,"format":"fraction"},"deck":{"title":"Example","theme":"yrkie-theme","slides":[{"id":"s1","size":{"width":960,"height":540,"unit":"pt"},"background":{"src":"yrkie-asset-data://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","fit":"cover","foreground":"light","overlay":{"opacity":0.3,"direction":"to-right"}},"blocks":[{"id":"h1","type":"heading","props":{"text":"Example heading"}},{"id":"g1","type":"layout-group","layout":{"variant":"columns","columns":2},"children":[{"id":"t1","type":"text","props":{"text":"She said \"yes\".\nThe next line."}},{"id":"st1","type":"stat","props":{"value":42,"label":"Count"}}]}]}]}}
```

```json
{"version":4,"pageNumber":{"enabled":false,"format":"number"},"deck":{"title":"Edge example","theme":"yrkie-theme","slides":[{"id":"s1","size":{"width":960,"height":540,"unit":"pt"},"layout":{"preset":"edge-media"},"blocks":[{"id":"edge","type":"layout-group","layout":{"variant":"edge-media","mediaPosition":"right","mediaRatio":0.4,"mediaShape":"fade","contentAlign":"center"},"children":[{"id":"copy","type":"layout-group","layout":{"variant":"stack","region":"content"},"children":[{"id":"h1","type":"heading","props":{"text":"Example heading"}},{"id":"t1","type":"text","props":{"text":"Example body"}}]},{"id":"image","type":"media","layout":{"region":"media"},"props":{"src":"yrkie-asset-data://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","alt":"Example image"}}]}]}]}}
```

## 6. Exact Leaf shapes: all 43 types

```json
[
{"id":"n1","type":"hero","props":{"title":"Title"}},
{"id":"n2","type":"heading","props":{"text":"Heading","level":1}},
{"id":"n3","type":"text","props":{"text":"Body"}},
{"id":"n4","type":"code-block","props":{"code":"{\"ok\":true}","language":"json"}},
{"id":"n5","type":"list","props":{"items":["One","Two"]}},
{"id":"n6","type":"ordered-list","props":{"items":["One","Two"]}},
{"id":"n7","type":"todo-list","props":{"items":[{"text":"Task","checked":false}]}},
{"id":"n8","type":"notice","props":{"text":"Note"}},
{"id":"n9","type":"stat","props":{"value":42,"label":"Count"}},
{"id":"n10","type":"media","props":{"src":"yrkie-asset-data://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","alt":"Example image"}},
{"id":"n11","type":"image-text","props":{"src":"yrkie-asset-data://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","title":"Title","text":"Body"}},
{"id":"n12","type":"icon-text","props":{"icon":"Target","title":"Title","text":"Body"}},
{"id":"n14","type":"math-formula","props":{"content":{"formula":"x_{i}^{2}"}}},
{"id":"n15","type":"quote","props":{"text":"Quotation","source":"Source"}},
{"id":"n16","type":"question-card","props":{"title":"Question","text":"Answer"}},
{"id":"n39","type":"contents","props":{"presentation":"cards:connected","items":[{"id":"entry-1","title":"Title","text":"Body","icon":"Target"},{"id":"entry-2","title":"Next","text":"Details"}],"itemColumns":"auto","itemLayout":"auto","columnPreference":4}},
{"id":"n17","type":"item-cards","props":{"variant":"filled-icon","items":[{"title":"Title","text":"Body","icon":"Target"}]}},
{"id":"concentric-circles","type":"concentric-circles","props":{"items":[{"title":"Stage 1","text":"Describe this stage."}]}},
{"id":"layered-funnel","type":"layered-funnel","props":{"items":[{"title":"Stage 1","text":"Describe this stage."}]}},
{"id":"folded-arrow","type":"folded-arrow","props":{"items":[{"title":"Stage 1","text":"Describe this stage."}]}},
{"id":"wave-arrow","type":"wave-arrow","props":{"items":[{"title":"Stage 1","text":"Describe this stage."},{"title":"Stage 2","text":"Describe this stage."},{"title":"Stage 3","text":"Describe this stage."}]}},
{"id":"layered-cube","type":"layered-cube","props":{"items":[{"title":"Stage 1","text":"Describe this stage."}]}},
{"id":"double-ring","type":"double-ring","props":{"items":[{"title":"Stage 1","text":"Describe this stage."},{"title":"Stage 2","text":"Describe this stage."}]}},
{"id":"droplet-process","type":"droplet-process","props":{"items":[{"title":"Stage 1","text":"Describe this stage."}]}},
{"id":"funnel","type":"3d-funnel","props":{"items":[{"title":"Engine","text":"Analysis and decisions."}]}},
{"id":"n18","type":"shape-contents","props":{"items":[{"title":"A","text":"Body"},{"title":"B","text":"Body"}]}},
{"id":"n19","type":"capability-cards","props":{"content":{"items":[{"title":"Title","text":"Body"}]}}},
{"id":"n20","type":"numbered-icon-cards","props":{"content":{"items":[{"title":"A","text":"Body","icon":"Target"},{"title":"B","text":"Body","icon":"ShieldCheck"}]}}},
{"id":"n21","type":"table","props":{"content":{"columns":[{"header":"Name"},{"header":"Value","align":"right"}],"rows":[{"cells":["A",12]},{"cells":["B",{"text":"20","emphasis":"highlight"}]}]},"borderStyle":"three-line"}},
{"id":"n22","type":"grouped-bar-chart","props":{"content":{"categories":["A","B"],"series":[{"name":"Series","data":[10,20]}]}}},
{"id":"n23","type":"line-chart","props":{"content":{"categories":["A","B"],"series":[{"name":"Series","data":[-5,20],"labels":[{"index":1,"text":"Peak"}]}]},"smooth":false}},
{"id":"n24","type":"stacked-bar-chart","props":{"content":{"categories":["A","B"],"series":[{"name":"First","data":[10,20]},{"name":"Second","data":[5,8]}]}}},
{"id":"n25","type":"radar-chart","props":{"content":{"axes":[{"label":"A","max":10},{"label":"B","max":10},{"label":"C","max":10}],"datasets":[{"name":"Series","values":[5,7,9]}]}}},
{"id":"n26","type":"donut-chart","props":{"content":{"items":[{"label":"A","value":25},{"label":"B","value":75}],"center":{"value":100,"eyebrow":"Total"}}}},
{"id":"n27","type":"risk-matrix","props":{"content":{"items":[{"label":"A","x":0.6,"y":0.7}],"priorityZone":{"x":0.5,"y":0.5,"width":0.5,"height":0.5}}}},
{"id":"n28","type":"waterfall-chart","props":{"content":{"items":[{"label":"Start","value":100,"type":"total"},{"label":"Change","value":-20},{"label":"End","value":80,"type":"total"}]}}},
{"id":"funnel","type":"mind-map","props":{"content":{"items":[{"level":0,"title":"Level 0","text":"Responsibility","icon":"User"},{"level":1,"title":"Level 1","text":"Responsibility","icon":"User"},{"level":2,"title":"Level 2","text":"Responsibility","icon":"User"}]}}},
{"id":"funnel","type":"serpentine-process","props":{"items":[{"title":"Step 1","text":"Next action.","icon":"Star"}]}},
{"id":"funnel","type":"recycling-arrows","props":{"items":[{"title":"Step 1","text":"Next action."},{"title":"Step 2","text":"Next action."},{"title":"Step 3","text":"Next action."}]}},
{"id":"funnel","type":"vertical-progress","props":{"items":[{"value":65,"text":"Progress toward target."}]}},
{"id":"funnel","type":"icon-columns","props":{"items":[{"title":"Step 1","text":"Next action.","icon":"Star"}]}},
{"id":"funnel","type":"badge-cards","props":{"items":[{"title":"Step 1","text":"Next action.","icon":"Star","value":"10%"}]}},
{"id":"panel","type":"text-panel","props":{"text":"First paragraph.\n\nSecond paragraph."}}
]
```


## 7. Local-agent submission contract

Sections 1–6 define documents; external writes also require the following rules. Use your own model for drafts and installed Yrkie MCP tools for platform operations, following the Skill workflow. Never reconstruct HTTP requests. Valid JSON is not approval or proof of saving.

### 7.1 External text and size constraints

- Both character limits above AND byte limits apply: every string is at most 65,536 UTF-8 bytes; each serialized Slide at most 2,000,000 bytes; complete create request at most 8,388,608 bytes; edit/delete request body at most 2,008,192 bytes. Count escaped JSON and wrappers in request size. Maximum JSON nesting is 32 (separate from three Group levels); the document value budget is 250,000, including containers and scalars.
- Strings allow LF and tab, but no other control characters, carriage returns, or bidi controls U+202A–U+202E/U+2066–U+2069. Normalize actual CRLF line endings to LF before JSON encoding. Never remove required visible content merely to satisfy a limit.
- The external writer scans decoded strings, including code and formulas. It rejects tag-like markup and case-insensitive occurrences of `javascript:`, `vbscript:`, `file:`, `data:`, `url(`, or `expression(`, including whitespace before the colon/parenthesis. Substring matches also count. JSON Unicode escapes do not bypass this check. The declared Icon contract uses Lucide names, not SVG.
- Thus `language:"html"` or `"css"` does not exempt code from external checks. A formula comparison can use `a < b`; adjacent `<b` at a string end resembles a tag. If exact requested content cannot pass, explain the unsupported content instead of changing its meaning or claiming it was saved.

### 7.2 Assets and page count

Before saving, the project must have a confirmed outline and `yrkie_outline_image_status` must return `ready:true`. Use its final `outlineVersion`, `revision`, `eligiblePages`, and `assets`. Creating/replacing a deck requires exactly eligiblePages slides in eligible outline order, even after pages were deleted from an earlier deck. Do not substitute total outline pages, subscription guesses, or current deck length.

Every src must be an exact `assets[*].slideReference` from that project's confirmed eligible outline. Canonical syntax is `yrkie-asset-data://` followed by 64 lowercase hexadecimal characters. Syntax alone does not prove ownership or availability. No URLs, data URLs, base64, local paths, unbound uploads, or generation markers are accepted. Do not copy manifest metadata into component props.

| Image location | Required manifest imageType and ratio |
| --- | --- |
| Ordinary media/image-text | A matching authorized source; ordinary placement accepts content or decorative assets. |
| Slide background, even if disabled | decorative; 4:3 or 16:9. |
| Left/right edge media | decorative; 3:4, 4:5, or 9:16. |
| Top/bottom edge media | decorative; 4:3 or 16:9. |

These are source-metadata constraints. Setting `media.props.aspectRatio` does not change a manifest ratio; notably 4:5 is accepted source metadata but is not an authorable aspectRatio enum. Content images cannot become backgrounds/edge images by changing fit. Obtain missing assets through the approved outline/image workflow, not an invented reference.

### 7.3 MCP argument shapes

The tool argument `deck` below contains the ENTIRE Root, including its own deck. Consequently `args.deck.deck.slides` is correct. `args.slide` contains only the target Slide. Pass objects, never JSON strings, arrays, JSON Patch, or partial updates. Transport fields do not belong inside Root, Slide, or props. Tool names may have a client-specific prefix.

```ts
type ProjectRef = string;// copy returned prj_ reference; 64 lowercase hex characters after prj_
type RequestId = string;// new lowercase UUID per distinct operation
type Revision = number;// integer 1–9007199254740991, copied from a read
type CreateSlidesArgs = {
projectRef:ProjectRef;requestId:RequestId;
expectedRevision:Revision|null;
expectedOutline:{version:Revision;revision:Revision};
deck:Root;acknowledgeReplace:true;
};
type EditSlideArgs = {
projectRef:ProjectRef;requestId:RequestId;
pageNumber:number;// one-based current page position
expectedRevision:Revision;slide:Slide;
};
type DeleteSlideArgs = {
projectRef:ProjectRef;requestId:RequestId;
pageNumber:number;// one-based current page position
expectedRevision:Revision;acknowledgeDelete:true;
};
```

- `yrkie_create_slides`: copy project_info.currentDeck.revision; expectedRevision is null only if currentDeck explicitly equals null. Missing/deleted state is not absence. Copy expectedOutline.version/revision from final image-status outlineVersion/revision. This atomically replaces ALL pages; acknowledgeReplace requires approval of that exact replacement.
- `yrkie_edit_slide`: first read `yrkie_project_slide` with includeSchema true. Preserve returned slide.id and use that response's deck revision. Submit the complete reviewed Slide at the current one-based pageNumber. This cannot change deck title/theme/page numbering or unrelated pages. ExpectedOutline is not an edit argument.
- `yrkie_delete_slide`: use a fresh target read's position and revision, with approval for that exact deletion. At least one page must remain. Do not generate a Root/Slide payload for this tool.
- Content-array indices are zero-based; tool pageNumber is one-based; Root.pageNumber is an object. These three meanings are not interchangeable. Revisions are concurrency tokens, not page numbers. Generate a UUID with a UUID generator; reuse it only for identical uncertain retries, including identical payload and expected revisions.
- ProjectRef is temporary. After expiry or reconnecting, obtain a fresh reference to the SAME project. An identical retry retains its UUID, body, page position, and expected revisions; a refreshed reference does not authorize a different project or account.

Minimal create arguments (fictional one-page, already-confirmed project with no existing deck):

```json
{"projectRef":"prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","requestId":"11111111-1111-4111-8111-111111111111","expectedRevision":null,"expectedOutline":{"version":1,"revision":2},"acknowledgeReplace":true,"deck":{"version":4,"pageNumber":{"enabled":true,"format":"number"},"deck":{"title":"Example","theme":"yrkie-theme","slides":[{"id":"s1","size":{"width":960,"height":540,"unit":"pt"},"blocks":[{"id":"t1","type":"text","props":{"text":"Example body"}}]}]}}}
```

Minimal edit arguments (fictional read returned page 1, slide ID s1, deck revision 3):

```json
{"projectRef":"prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","requestId":"22222222-2222-4222-8222-222222222222","pageNumber":1,"expectedRevision":3,"slide":{"id":"s1","size":{"width":960,"height":540,"unit":"pt"},"blocks":[{"id":"t1","type":"text","props":{"text":"Updated body"}}]}}
```

### 7.4 Validation and result handling

Strictly parse JSON, rejecting duplicate keys, then check every declared constraint. TypeScript cannot check cross-field relations or project state. No validation-only MCP tool exists: writes mutate content. Follow Skill approval rules for the concrete write; identical retries retain prior approval.

The external writer performs no automatic repair and saves no partial deck on validation failure. Read each issue's path, code, message, and hint. For creation, `/deck/deck/slides/0` means the first slide inside the tool's complete Root; edit page issues use `/slide`. Correct an identified defect, revalidate, and treat changed input as a new operation with a new UUID.

- `slide_revision_conflict`: reread the affected state and review the revised change; never insert a newer revision into an old draft to force overwrite.
- `outline_conflict`/`outline_images_not_ready`: reread final image status and wait for readiness; do not alter the locked outline or start a paid retry implicitly.
- `asset_unavailable`/image-placement issues: reconcile exact manifest references and source metadata; changing fit does not repair authorization.
- `slide_schema_unavailable`: an existing page cannot be returned under the current contract; resolve it in the application rather than inventing a page from its Markdown.
- Uncertain response: retry the identical UUID/input. `idempotency_conflict` means the operation identity was reused with different input. `replayed:true` is the prior operation's receipt, not necessarily the current deck revision.

Only a matching success receipt establishes saved/edited/deleted status, not visual fit or export. Draft output is only Root/Slide JSON; authorized tool calls use their argument object. Draft-only output rules do not constrain approval discussions or error reports.

Markers: dot-card/dot-list differ by surface/border; numbered-top-rule places order above the rule, numbered-inline beside content. Timelines alternate around a spine: square numbered badges, dots, or dots with filled rounded cards. Markers track order, not icons/metrics. Timeline itemColumns=1; ordinary marker cards 1–4.

Numbered-parallelogram/pill/chevron place order above title/body. Ascending-bar/arrow/numbered rise by column, restart each row and retain equal cell widths; reflow precedes shrinking text. Inverted-pyramid reverses pyramid geometry with text-first fitting; its 2–12-item contract remains.
