<doe-markdown-v2-1>

# 1. Rules

This grammar uses Markdown headings for the presentation tree and key=value for properties. Use the declared English component names, field names and enum values; write content in the user's requested language.

- Start each page with # slide; page components use ## component-name.
- Every child heading has exactly one more # than its parent; equal counts mean siblings. Use headings for pages, groups, components and multiline fields. Prefer items=<[title=Title;text=Body],…> for entries, avoiding per-entry heading depth.
- Settings belong to the most recent heading and precede its child headings. A sibling heading closes the previous sibling.
- Properties use key=value; collections use <value,value>; objects use [key=value;key=value]. Inside compact collections and objects, use double quotes for text containing delimiters, surrounding spaces or line breaks. Standalone string assignments are literal: do not wrap them in quotes unless the quotes are part of the text. Never quote field names. Select one enum, e.g. cards=icons.
- Plain text after a component heading can supply its primary content; other content uses field assignments or field headings.
- Supply each field once: use an assignment, a field heading, or bare primary text. These forms do not append to one another. Different values for the same field are rejected with `conflicting_field_content`; identical repetitions remain readable for compatibility. Use a field heading for a multiline paragraph instead of mixing `text=First line` with later bare text.
- Omit optional properties unless overriding them is useful. Missing or invalid optional settings use component defaults; unknown optional properties are ignored. Unsupported component tags fail with unknown_component. Deck-only theme/pageNumber/pageNumberFormat in a slide or component, and slide-level title=, fail with misplaced_field: move these settings before the first # slide. Legacy ## title and valid component title fields remain supported. Required content must still be complete: defaults do not fabricate business data.

- `text-panel` is a Base text panel with `text` only. The system supplies primary-color fill, white text, rounded corners and a taller default height. It can be placed in a group beside other components.

# 2. Important Notes

- Charts retain values, legends and axes; do not output extra annotation bubbles, leaders, range notes or footnotes.

Maintain known generation mistakes here. Add a correction and its proper usage when a new mistake is discovered.

- Prefer compact collections, never JSON object arrays. Legacy item headings remain supported: one # deeper than their component, e.g. ### cards → #### item inside a group.
- Parent settings must precede children. For example, put ratio after the group heading and before cards; placing it after item does not assign it to the group.
- After cards=icons, do not repeat or contradict the selection with variant=filled. Do not restate defaults.
- Put the authorized raw address directly after src=, never [URL](URL). Do not invent or rewrite image addresses.
- Inside collections, quote multiline text and escape line breaks, e.g. text="First\nSecond"; escape a quote as \" and a backslash as \\. Outside collections, long text can still use a multiline field heading. Do not escape @ in email addresses.
- Prefix a literal text line resembling a heading or assignment with a backslash. Quote text containing commas, semicolons, square brackets or angle brackets inside collections: quoted delimiters remain text. Close every collection/object; no line-continuation backslashes are needed.
- Do not emit JSON braces, quoted field names or props/content wrappers. Reference ?, type names, … and candidate lists are explanatory; replace them with actual values.
- Chart values must be finite numbers; data lengths match categories, radar values match axes, and table cells match columns. Defaults cannot supply missing required content or repair invented data.

# 3. All Syntax

## 3.1 Deck, Pages and Background

- # slide starts a new page. Do not supply runtime identifiers or fixed canvas information.
- Optional title=Deck title before the first page names the presentation.
- Before the first page, theme selects one registered theme for the entire deck: yrkie-theme (Classic Blue), yrkie-violet, yrkie-drak, yrkie-ledger (paper and ink), yrkie-sunburst (cream and orange), yrkie-atelier (wine-red editorial), yrkie-coast (coastal handwriting), yrkie-noir (black and gold), yrkie-botanical (moss and cream), yrkie-swiss (red and white), yrkie-blueprint (deep-blue technical), yrkie-terracotta (warm clay), yrkie-aurora (night purple and mint), yrkie-rose (dusty rose gallery), yrkie-cobalt (cobalt and acid yellow), yrkie-sage (soft sage), yrkie-copper (copper and archive paper), yrkie-citrus (citrus cut paper), yrkie-obsidian (neutral black and iridescent accents), yrkie-vermilion (paper, ink and vermilion). CreateDeck requires an explicit registered theme; the lower-level legacy reader retains yrkie-theme fallback. For an existing deck use SetDeckTheme with the current deck revision from ReadOutline; EditSlide does not change the deck theme. Explicit image backgrounds remain unchanged.
- logo="image reference" sets the deck logo before the first slide, or overrides it within a slide. logo=none hides it; an omitted slide logo inherits the deck setting. The logo sits above the safe area at the top right and preserves the image aspect ratio.
- Optional pageNumber=false before the first page hides page numbers.
- Optional pageNumberFormat=fraction before the first page displays current/total.
- Optional ## background specifies the page background. Empty or omitted uses the theme background; an image background uses src=authorized raw address.
- Optional background settings: fit=cover|contain (crop to fill or fit entirely), position=x% y% (image positioning), foreground=light|dark (foreground contrast), enabled=true|false. Background and an edge-media group cannot coexist.
- For text directly over a dark photo, foreground=light applies near-white text. foreground=dark retains theme title/body colors, including accent-colored titles; it does not force every title to black. Reading surfaces retain their theme colors in both modes. Choose for the actual text region and verify contrast.
- Background content alignment: contentAlign=left|center|right and contentVerticalAlign=top|center|bottom, both default to center. These apply only with an enabled background image, never to pages without one or edge-media layouts. Bottom alignment keeps document order: append new content below existing content and move the whole group upward. Explicit component text align takes precedence.
- Background contentWidth=0.2..1 (default 1) sets the Flow content width as a fraction of the existing page safe area. contentAlign positions that region; component align controls text inside it. For a left quiet image region use background=[src="authorized reference";fit=cover;contentWidth=0.55;contentAlign=left]. The background image, logo and page number retain their bounds. Missing/disabled backgrounds and edge-media layouts ignore this setting.

- Background textSurface=auto|none controls automatic reading surfaces for title-group, section-heading and text-paragraph only. Omitted or auto follows the theme: enabled slide images normally add a theme-colored surface, border and rounded corners; all themes except the original yrkie-theme, yrkie-violet and yrkie-drak leave title-group directly on the image. none leaves all three text components directly on the image, so plan a quiet area with contentWidth and choose foreground for contrast. Charts, other components, filled cards and standalone images retain their existing appearance. foreground=light|dark affects text outside reading surfaces; surfaces retain theme title/body colors. This setting requires an enabled slide background with src and has no effect on edge-media layouts. Do not author component backgrounds, raw colors or font sizes.

## 3.2 Content, Fields and Collections

- Inline text: `**bold**` (also `__bold__`), `*italic*`, `++underline++`, `==mark==`, `~~strikethrough~~`; nesting is supported, e.g. `**bold with *italic***`. Use `\n` or a real newline for a line break. Underline and mark are DOE Markdown extensions.
- Use in editable headings, body copy, quote sources and card/Contents text fields. URLs, icon names, code, formulas and numeric data remain literal. Never output HTML, character ranges, textOverrides or style objects. The theme supplies highlight colors; do not specify colors or font sizes.
- Example: `text=First **define the goal**, then *test the hypothesis* and record ==important results==.` Emphasize meaningful phrases sparingly. Unclosed delimiters remain literal; escape a literal delimiter with a backslash. Inside compact quoted strings, apply the collection's backslash escaping first.

- Primary text mappings: section-heading/text-paragraph/quote/icon-callout → text; title-group → title; metric → value; image → src; code-block → code; formula → formula. Legacy title/paragraph/callout/cover/code names retain the same mappings.
- Scalar fields use key=value. Multiline fields use a child heading with the field name followed by text, e.g. ## paragraph → ### text → real lines. A field nested inside item is one level below that item.

Multiline text example: both lines belong to one text field; the next component is a sibling, not another assignment to that field.

# slide
## text-paragraph
### text
First describe the evidence.
Then explain what it means.
## section-heading
variant=plain
text=Next decision

- Collections use key=<value1,value2>. Each object entry uses [key=value;key=value]; commas separate entries. Entries may occupy separate lines. Example: items=<[title="Name";text="Your name";icon="User"],[title="Role";text="Your role"]>.
- Objects use key=[field=value;field=value], e.g. center=[title="Total";value=100]. Collections may nest inside objects: series=<[name="Core";data=<248,309,371>]>; table rows=<[cells=<"Name",42>]>.
- Primitive key=A | B and legacy item/series/column/row child headings remain readable. Prefer compact collections in new output to avoid entry nesting errors.


## 3.3 Groups and Alignment

Use ## group for automatic layout, or select group=row|stack|columns|composition|edge-media. Components are one heading level below the group; put items=<...> directly below the component. Groups nest at most three levels.

- row arranges horizontally; stack vertically; columns in columns.
- composition combines exactly two direct child components. ratio=balanced|primary-first|primary-second selects equal emphasis, first-child emphasis or second-child emphasis.
- edge-media combines one image and one content component/group. mediaPosition=left|right|top|bottom selects the edge; mediaShape=straight|fade|diagonal|circle|inner-circle selects its shape. The system centers the opposite content vertically for left/right media and horizontally for top/bottom media; do not specify region alignment.
- Group align=start|center|end|stretch selects start, center, end or stretched alignment.
- title-group/section-heading/text-paragraph/formula use align=left|center|right for text alignment. Table columns can use the same text-alignment values individually. Do not substitute group-alignment enums for text-alignment enums.

Grouped cards example:

# slide
## group=columns
### cards=icons
items=<
[title="Name";text="Your name";icon="User"],
[title="Role";text="Your role";icon="Briefcase"]
>

Composition example: paragraph is a sibling of cards; items belongs to cards.

# slide
## group=composition
### cards=quote
items=<[title="Contact";text="Start a conversation about working together."]>
### paragraph
Email: your.email@example.com

## 3.4 Component Selections and Important Properties

- Only image-above-text collections and standalone image-caption accept imageSize=compact|full, imageFit=contain|cover, imageAspectRatio=1:1|4:3|3:4|16:9 and surface=none|soft. Set them on the component, never inside items. Full uses the available card width; compact keeps the existing small image area. Cover crops, contain shows the whole image. Soft adds a theme surface; none keeps the transparent card. Omitted fields retain compact/contain/1:1/none without adding fields to existing documents. Other Contents styles and icon-caption do not accept these options.

- title=1|2|3 selects level; code=python|javascript|typescript|json|html|css|sql|shell|text selects language.
- section-heading accepts variant=section|plain|display. Omitted or section keeps the existing level=1|2|3 heading with its bottom rule; plain keeps that level's typography without the rule; display uses the theme's large display-heading scale without a rule. The theme controls its font and size, and normal fitting still applies. Use independent section-heading and text-paragraph components when they need separate placement or editing.
- title-group combines optional eyebrow, title and subtitle. It is a text group, not a required cover layout; choose it when those fields belong together. The old cover-title and cover names remain readable.
- cards=style and diagram=style select variant; layout=presentation selects presentation. Choose one candidate from the field reference. Do not repeat a shorthand selection as a property.
- layout is the generic Contents component: entries support title, text, icon, src, source, label, bullets and other declared fields. Specialized components such as cards and diagram accept only their own declared entry fields.
- layout=timeline|timeline-dots|timeline-cards|alternating accepts orientation=horizontal: prefer a full-width horizontal axis with content alternating above/below. Width and measured text height can trigger a vertical fallback; restore horizontal when space returns. Missing or invalid orientation defaults to vertical. Orientation is a preference, not a fixed geometry constraint.
- For those four line layouts, staggered=true|false controls alternating sides and connectors=true|false controls only the short branches between cards and the axis. Both default to true; missing/invalid values use the defaults. Explicit false stays off. Automatic fitting first exhausts legal text/spacing compression while preserving staggered cards, then tries same-side cards, then removes short branches if still needed; keep the main axis and markers. Restore preferences when space returns.
- `layout=chevrons|pill-steps|slanted-steps` (plain numbered chevrons, pills and parallelograms) accepts `orientation=horizontal|vertical`, default horizontal. Vertical uses one column, the shape on the left and title/body on the right; numbers remain upright. Rising styles are unchanged. When one column still exceeds the available height, try vertical geometry before shrinking text; keep it only when it helps. Automatic fitting takes priority without overwriting the authored direction, which returns when space permits.
- icon is an icon name such as User, Target or Layers; src is an authorized raw image address; alt describes the image. image fit controls fitting, position controls positioning, and aspectRatio selects a preset ratio.
- Shapes require at least two entries: arc/cycle/circle/ring allow up to six, petals eight, stairs/pyramid/funnel twelve. These limits also apply to those presentations inside layout.
- Chart categories are categories, series/datasets are series, and name labels a series. data/values supply numbers in category/axis order. valuePrefix/valueSuffix decorate numbers; minValue/maxValue/tickInterval control axis bounds/ticks; showLegend/showValues and related flags control visibility. Use these only where the component declares them.
- Table columns define headers and alignment; rows define cells. semanticWrap/protectedTerms control semantic wrapping and phrase preservation; omit unless needed.
- quote source is attribution; checklist checked is completion; formula display controls display form; donut center provides center text. Use fields only within components or entries that declare them.

Chart example:

# slide
## bars
categories=<"2023","2024","2025">
series=<
[name="Core";data=<248,309,371>],
[name="Growth";data=<162,170,240>]
>

- List syntax has two forms: base ## numbered-list / ## bullets uses items=<"First entry","Second entry">; Contents ## layout=numbered-list / ## layout=bullets uses items=<[text="First entry"],[text="Second entry"]>, with non-empty text on every item. Lists do not display item.title: never substitute title for text. Numbers/bullets are generated automatically; do not prefix entry text with 01 or 1.

## 3.5 Complete Component Field Reference

Each entry lists component properties. [] denotes an object, <> a collection; semicolons separate fields and commas separate entries. ? means optional; parentheses give count/range; | separates enum candidates. Do not copy type names, ? or …. Root component properties use one key=value per line; object/collection fields use compact notation. Fields without ? are required; omit optional defaults.

Use `layout=metrics` for a metric collection: item `title` is the value, `label` is its name, and `text` is the description. Omit columns for automatic layout: even counts prefer equal rows; odd counts try one row first. Equal-width metrics and ascending layouts balance wrapped rows, placing fewer items below and centering them (3→2+1, 5→3+2). Legacy single `metric` remains supported.

section-heading defaults to level=1 and variant=section, with a bottom rule. Choose plain to remove the rule or display for theme display typography; omit optional settings when the default is suitable and let normal fitting handle space constraints.

Charts have no standalone title or subtitle. Use a separate title/paragraph component when needed; keep chart data labels, legends, axes and donut center content within the chart.

Regular body copy (paragraphs, lists and Contents descriptions) defaults to the theme large text style and retains normal layout compression; no font-size attribute is needed.

### Diagrams

Use the standalone component heading, for example `## wave-arrow`, never `diagram=wave-arrow` or `layout=wave-arrow`. The following 13 components form this category. The separate `diagram=arc|petals|cycle|circle|ring|stairs|pyramid|funnel` family retains its own count limits.

Every item requires `title` and `text`, except `vertical-progress`, whose items require numeric `value` and `text` without a title. Use `items=<[title="Title";text="Description"],…>`. None accepts an overall component title; use a separate title component.

| Component | Item count | Additional fields and placement |
| --- | --- | --- |
| `3d-funnel` | 1–4 | Widens left to right; each segment has copy below it and no number. |
| `serpentine-process` | 1–6 | Optional item `icon`; each row reads left to right, with copy beside its own semicircle marker. |
| `recycling-arrows` | Exactly 3 | Copy follows numbered arrows at upper right, lower right, then left. |
| `vertical-progress` | 1–4 | Numeric `value` from 0 to 100, without %, decimals allowed; fill follows value and the display uses at most two decimals. |
| `icon-columns` | 1–4 | Optional item `icon`; circular icon above title and body. |
| `badge-cards` | 1–4 | Optional item `icon` and string `value` for the bottom label; omit value or use an empty string to hide it. |
| `concentric-circles` | 1–4 | Bullseye; optional item `icon`; items map from inner to outer layers, with staggered connectors and right-side copy. |
| `layered-funnel` | 1–4 | One independent 3D layer per item, with copy on its right and no number. |
| `folded-arrow` | 1–4 | Ordered bottom to top; each description belongs to its own folded layer. |
| `wave-arrow` | Exactly 3 | Ordered bottom to top; each title/body pair occupies a staggered position to the left of its rising stage. |
| `layered-cube` | 1–4 | Each layer fills left then right; an unoccupied face retains its shape without a number or description. |
| `double-ring` | 2–6 total, 1–3 per side | Optional item `side=left\|right`; omitted sides alternate left/right by item order. Adding/removing items never changes the two-ring artwork. |
| `droplet-process` | 1–5 | Horizontal numbered droplets, with each title/body pair below its droplet. |

- Peripheral copy faces the artwork: right-aligned on the left, left-aligned on the right. Titles and bodies move together. Copy below artwork retains the component's centered layout.
- Components own shape sizes, gaps, folds, connecting arrows, theme colors, icon backgrounds and white icons. Do not emit custom colors, dimensions, coordinates, font sizes, Diagrams alignment settings or text-built shapes.
- Optional item icons identify meaning; omitted icons use renderer fallbacks without changing the document. Double-ring places each item's icon on its declared side; neither funnel adds icon numbering. Preserve authored measurements and labels rather than inventing 01/02 prefixes.
- Copy wraps and fits within its own region. When space requires, the whole graphic-and-copy component scales uniformly and centers within its slot; arbitrary long copy is not guaranteed to retain its original size or remain fully visible. Keep required information and recompose or split dense content. Do not author compression settings.
- Counts refer to actual authored items; never fabricate content to fill a Studio default. Double-ring must retain at least one item per side. Only listed components accept icon; only double-ring accepts side; only badge-cards accepts string value.

```doe
# slide
## wave-arrow
items=<[title="Define";text="Agree scope and success criteria."],[title="Validate";text="Test the key assumptions."],[title="Expand";text="Turn results into repeatable delivery."]>
# slide
## double-ring
items=<[title="Problem";text="Identify the main obstacle.";side=left],[title="Improvement";text="Define the next action.";side=right]>
# slide
## vertical-progress
items=<[value=65;text="Track progress."],[value=30.5;text="Confirm next actions."]>
# slide
## badge-cards
items=<[title="Plan";text="Confirm scope.";icon="Target";value="10%"]>
```

### Mind map

Use `mind-map`. Each item requires `level`, `title`, `text`; optional `icon` defaults to `User` and can be replaced on the canvas. Rounded nodes use the chart palette, preserve tree connectors, and wrap to independent heights.

List items in parent-before-child order: exactly one root at index 0 with `level=0`; remaining levels are 1–5, with no jump greater than one level. Same-level order controls placement. Allow 1–40 nodes and at most 6 root branches; the Studio example has three levels. Layout must still fit the page compression limits; impossible edits are rejected.

```doe
## mind-map
items=<[level=0;title="Project lead";text="Own scope and delivery";icon="User"],[level=1;title="Product team";text="Define requirements";icon="Lightbulb"],[level=2;title="Designer";text="Design the experience";icon="User"]>
```

### Base
- title-group（Title group）
- section-heading（Section heading）
- text-paragraph（Text paragraph）
- filled-text-panel（Filled text panel）
- icon-callout（Icon callout）
- image（Image）
- checklist（Checklist）
- code-block（Code block）
- math-formula（Math formula）
### Contents
- filled-cards（Filled cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- top-left-icon-cards（Top left icon cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- outlined-cards（Outlined cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- left-accent-cards（Left accent cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- top-accent-cards（Top accent cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- top-badge-cards（Top badge cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- joined-cards（Joined cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- icon-linked-cards（Icon linked cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- diagonal-rounded-cards（Diagonal rounded cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- quote-frame-cards（Quote frame cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- speech-bubble-cards（Speech bubble cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- dot-filled-cards（Dot filled cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- dot-text-items（Dot text items）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- slanted-numbered-steps（Slanted icon steps）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- pill-numbered-steps（Pill icon steps）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- chevron-steps（Chevron steps）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- ascending-bar-steps（Ascending bar steps）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- ascending-arrow-steps（Ascending arrow steps）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- ascending-numbered-bar-steps（Ascending icon bar steps）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- top-numbered-rule-cards（Top icon rule cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- side-numbered-cards（Side icon cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- numbered-node-timeline（Icon node timeline）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- dot-node-timeline（Dot node timeline）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- dot-card-timeline（Dot card timeline）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- unmarked-card-timeline（Unmarked card timeline）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- icon-beside-text（Icon beside text）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- image-above-text（Image above text）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- icon-above-text（Icon above text）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- bulleted-list（Bulleted list）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- numbered-text-list（Numbered text list）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- segmented-semicircle（Segmented semicircle）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- petal-diagram（Petal diagram）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- circular-arrow-cycle（Circular arrow cycle）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- segmented-circle（Segmented circle）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- ring-node-diagram（Ring node diagram）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- widening-stair-diagram（Widening stair diagram）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- layered-pyramid（Layered pyramid）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- layered-inverted-pyramid（Layered inverted pyramid）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- labelled-icon-cards（Labelled icon cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- bottom-right-badge-cards（Bottom right badge cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- question-prompt-cards（Question prompt cards）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- quotation-blocks（Quotation blocks）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- text-columns（Text columns）: Use the layout fields below; the name fixes the presentation, so omit presentation.
- metric-summary（Metric summary）: Use the layout fields below; the name fixes the presentation, so omit presentation.
### Diagrams
- horizontal-3d-funnel（Horizontal 3D funnel）
- vertical-3d-funnel（Vertical 3D funnel）
- concentric-target（Concentric target）
- folded-rising-arrow（Folded rising arrow）
- wave-rising-arrow（Wave rising arrow）
- layered-3d-cube（Layered 3D cube）
- interlocking-3d-rings（Interlocking 3D rings）
- droplet-arrow-steps（Droplet arrow steps）
- serpentine-steps（Serpentine steps）
- folded-three-arrow-cycle（Folded three arrow cycle）
- vertical-percentage-bars（Vertical percentage bars）
- large-icon-items（Large icon items）
- staggered-arrow-cards（Staggered arrow cards）
### Charts
- data-table（Data table）
- grouped-bar-chart（Grouped bar chart）
- line-chart（Line chart）
- stacked-bar-chart（Stacked bar chart）
- radar-chart（Radar chart）
- risk-matrix（Risk matrix）
- waterfall-chart（Waterfall chart）
- donut-chart（Donut chart）
- tree-mind-map（Tree mind map）

Legacy names and layout=style remain readable. Prefer the direct names above for new content. Do not mix legacy scalar fields with collection fields.

- title-group: [title=string; subtitle?=string; eyebrow?=string; icon?=string; align?=left|center|right]
- section-heading (= selects level): [text=string; variant?=section|plain|display; level?=1|2|3; kicker?=string; align?=left|center|right]
- text-paragraph: [text=string; align?=left|center|right]
- quote: [text=string; source?=string]
- icon-callout: [text=string; icon?=string]
- code-block (= selects language): [code=string; language?=python|javascript|typescript|json|html|css|sql|shell|text; wrap?=boolean]
- bullets: [title?=string; items=<string, …> (1–100 entries)]
- numbered-list: [title?=string; items=<string, …> (1–100 entries)]
- checklist: [title?=string; items=<[text=string; checked?=boolean], …> (1–100 entries)]
- metric: [value=text or number; label?=string; description?=string]
- image: [src=string; alt?=string; fit?=natural|contain|cover|fill; position?=x% y%; aspectRatio?=1:1|4:3|3:4|16:9|9:16]
- image-caption: [imageSize?=compact|full; imageFit?=contain|cover; imageAspectRatio?=1:1|4:3|3:4|16:9; surface?=none|soft; src=string; alt?=string; title=string; text=string]
- icon-caption: [icon=string; title=string; text=string]
- question: [title=string; text?=string; index?=text or number; icon?=string]
- layout (= selects presentation): [imageSize?=compact|full; imageFit?=contain|cover; imageAspectRatio?=1:1|4:3|3:4|16:9; surface?=none|soft; orientation?=vertical|horizontal; staggered?=boolean; connectors?=boolean; presentation?=cards|cards-icons|cards-outline|cards-left-accent|cards-top-accent|cards-badge|cards-connected|cards-connected-icons|cards-leaf|cards-quote|cards-speech|dot-cards|dots|slanted-steps|pill-steps|chevrons|rising-bars|rising-arrows|rising-steps|numbered-bars|numbered-labels|timeline|timeline-dots|timeline-cards|alternating|icon-rows|images|icons|bullets|numbered-list|arc|petals|cycle|circle|ring|stairs|pyramid|funnel|features|numbered-features|questions|quotes|columns|metrics; items=<[title?=string; text?=string; icon?=string; src?=string; alt?=string; source?=string; label?=text or number; bullets?=<string, …> (0–100 entries)], …> (1–12 entries); subtitle?=string]
- cards (= selects variant): [variant?=filled|icons|outline|left-accent|top-accent|badge|connected|connected-icons|leaf|quote|speech; items=<[title=string; text=string; icon?=string], …> (1–12 entries)]
- horizontal-3d-funnel: [items=<[title=string; text=string], …> (1–4 entries)]
- diagram (= selects variant): [variant?=arc|petals|cycle|circle|ring|stairs|pyramid|funnel; items=<[title=string; text=string; icon?=string], …> (2–12 entries)]
- features: [items=<[title=string; text=string; icon?=string], …> (1–6 entries)]
- numbered-features: [items=<[title=string; text=string; icon?=string], …> (2–6 entries)]
- data-table: [ariaLabel?=string; borderStyle?=grid|none|three-line; semanticWrap?=false / [locale?=string; protectedTerms?=<string, …> (0–100 entries)]; columns=<[header=string; align?=left|center|right; locale?=string; protectedTerms?=<string, …> (0–100 entries)], …> (1–12 entries); rows=<[cells=<text or number / [text=string; emphasis?=muted|highlight], …> (1–12 entries)], …> (1–100 entries)]
- grouped-bar-chart: [showLegend?=boolean; categories=<string, …> (1–100 entries); series=<[name=string; data=<number, …> (1–100 entries)], …> (1–100 entries); valuePrefix?=string; valueSuffix?=string; minValue?=number; maxValue?=number; tickInterval?=number; includeZero?=boolean]
- line-chart: [showLegend?=boolean; smooth?=boolean; categories=<string, …> (1–100 entries); series=<[name=string; data=<number, …> (1–100 entries); labels?=<[index=integer (0..∞); text?=text or number], …> (0–100 entries)], …> (1–100 entries); valuePrefix?=string; valueSuffix?=string; minValue?=number; maxValue?=number; tickInterval?=number; includeZero?=boolean]
- stacked-bar-chart: [showLegend?=boolean; categories=<string, …> (1–100 entries); series=<[name=string; data=<number, …> (1–100 entries)], …> (1–100 entries); valuePrefix?=string; valueSuffix?=string; minValue?=number; maxValue?=number; tickInterval?=number; includeZero?=boolean; showYAxis?=boolean; showValues?=boolean; legendReversed?=boolean]
- radar-chart: [showLegend?=boolean; axes=<[label=string; max=number], …> (3–8 entries); datasets=<[name=string; values=<number, …> (3–8 entries)], …> (1–3 entries)]
- risk-matrix: [items=<[label=string; x=number (0..1); y=number (0..1)], …> (1–100 entries); xLabel?=string; yLabel?=string; priorityZone?=[x=number; y=number; width=number; height=number; label?=string; labelLines?=<string, …> (0–100 entries)]]
- waterfall-chart: [items=<[label=string; value=number; type?=change|total; connectToNext?=boolean; showValue?=boolean; valuePosition?=inside|above|badge], …> (2–100 entries); valuePrefix?=string; valueSuffix?=string; minValue?=number; maxValue?=number; tickInterval?=number; includeZero?=boolean; showYAxis?=boolean; showValues?=boolean; showChangeSigns?=boolean; staggerLabels?=boolean]
- donut-chart: [items=<[label=string; value=number (0..∞); percentLabel?=string; primary?=boolean; valueLabel?=false / string], …> (2–6 entries); variant?=standard|compact|hero; showLegend?=boolean; center?=[title?=string / <string, …> (0–100 entries); value?=text or number; eyebrow?=string; subtitle?=string / <string, …> (0–100 entries)]; valuePrefix?=string; valueSuffix?=string; maximumFractionDigits?=0|1|2|3]
- math-formula: [formula=string; display?=boolean; align?=left|center|right]
- concentric-target: [items=<[title=string; text=string; icon?=string], …> (1–4 entries)]
- vertical-3d-funnel: [items=<[title=string; text=string], …> (1–4 entries)]
- folded-rising-arrow: [items=<[title=string; text=string; icon?=string], …> (1–4 entries)]
- wave-rising-arrow: [items=<[title=string; text=string; icon?=string], …> (3–3 entries)]
- layered-3d-cube: [items=<[title=string; text=string; icon?=string], …> (1–4 entries)]
- interlocking-3d-rings: [items=<[title=string; text=string; side?=left|right; icon?=string], …> (2–6 entries)]
- droplet-arrow-steps: [items=<[title=string; text=string; icon?=string], …> (1–5 entries)]
- tree-mind-map: [items=<[level=integer (0..5); title=string; text=string; icon?=string], …> (1–40 entries)]
- serpentine-steps: [items=<[title=string; text=string; icon?=string], …> (1–6 entries)]
- folded-three-arrow-cycle: [items=<[title=string; text=string; icon?=string], …> (3–3 entries)]
- vertical-percentage-bars: [items=<[text=string; value=number (0..100)], …> (1–4 entries)]
- large-icon-items: [items=<[title=string; text=string; icon?=string], …> (1–4 entries)]
- staggered-arrow-cards: [items=<[title=string; text=string; icon?=string; value?=string], …> (1–4 entries)]
- filled-text-panel: [text=string]

# 4. Output Principles

- Output only Markdown content conforming to this grammar, without a surrounding code block.
- Never wrap output in ```markdown, ```json or any code fence; represent code-component content with multiline fields and escaped literal lines as well.
- Do not output introductions, explanations, analysis, summaries, confirmations, notes or anything outside the requested slide content.
- Do not output these reference section headings, field notation, instruction labels or protocol wrapper tags.
- Include only requested pages, components, real content and useful overrides. Do not repeat system defaults or invent syntax.

</doe-markdown-v2-1>
