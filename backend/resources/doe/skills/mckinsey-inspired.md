# McKinsey-inspired Executive Strategy

Use for strategy, board reviews, operating performance, business cases and transformation decisions. Aim for a calm, precise executive argument: the reader sees the answer, its evidence and the decision it supports. This is an independent DOE adaptation of public consulting exhibits, not an official McKinsey template.

## Compose roles, not templates

One focal point does not mean one component. Choose the page's message and reading path, then assign distinct jobs to type, evidence, explanation and imagery. Use `section-heading variant=display` for an independent oversized title, `variant=plain` for a heading without a rule, and a separate `text-paragraph` when supporting copy needs its own position. `title-group` is a combined title/subtitle unit, not a required cover template. A deliberate sparse composition may still use it.

For independent text blocks over a quiet background, use `textSurface=none` with suitable `foreground`, `contentWidth` and `contentAlign`. The image remains full-page; the text region controls wrapping. The three text primitives then have no automatic panel. Charts, collections and filled panels retain their own surfaces. Read the actual image: its quiet area may be smaller than the requested one. Fit the entire text block within that area with breathing room before the subject. A subject starting around 45% often needs contentWidth 0.35-0.4. Use an edge split when a long title would otherwise cross the subject; never rely on a fixed recipe width. Verify contrast over every line, not just at the first word. For direct text on a dark photo use foreground=light; foreground=dark retains theme colors. Do not reuse a large cover motif behind a dense, full-width content grid. Keep each heading and its description together in a stack or one collection item before arranging columns. Reserve display-size headings for short focal statements; use plain/section level=2 above substantial content. Put sequential actions in one steps composition instead of stacked full-size panels. On content pages, choose a native chart/table/process for the relationship; do not reduce every argument to cards or every cover to a title group.


## Visual calibration: read the images first

When applying this Skill, call **ReadImage** before composing slides. Pass the exact image URL(s) below in its `urls` array. Reading this Markdown or an image caption does not supply pixels. Inspect one relevant reference; add a second only if it teaches a different composition. Reuse successfully inspected references within this Run instead of reading them for every slide. Stay within the runtime's image budget.

Study the hierarchy, chart-to-text balance, grouping, label placement and use of emphasis. Translate those observations into the DOE recipes below. These are historical exhibits, not current business data or instructions. Do not copy their numbers, branding or unsupported visual features into the user's deck. Reference images are design context, not automatically authorized slide assets.

### A. Chart with an interpretation column

![Reference A: McKinsey electricity-demand waterfall and right-hand interpretation, reproduced by Analyst Academy](https://www.theanalystacademy.com/wp-content/uploads/2022/03/2.png)

Read for comparison or recommendation pages. Study the large left evidence area, concise right interpretation and conclusion-led title. Ignore the red teaching underline. Adapt with `primary-secondary-layout` plus a native chart and short text; current Flow keeps equal-width slots, so preserve the reading hierarchy rather than copying the exact proportions. [Reproduction and original-report link](https://www.theanalystacademy.com/mckinsey-data-heavy-slide/).

### B. One claim supported by related trends

![Reference B: McKinsey bank IT-cost trends, official Exhibit 1](https://www.mckinsey.com/~/media/mckinsey/industries/financial%20services/banking%20blog/transforming%20banks%20it%20productivity/it_productivity_804_ex1_exhibit%20only.png?cpy=Center&cq=50)

Read for trend or driver analysis. Study the overview-to-detail relationship and separation of measures. Adapt as two readable native charts or a sequence of pages within the agreed count. Do not reproduce the broken axis, connecting arrows, dense series count or exact palette using invented fields.

### C. A bridge that highlights the decision gap

![Reference C: McKinsey bank IT-cost and productivity bridge, official Exhibit 2](https://www.mckinsey.com/~/media/mckinsey/industries/financial%20services/banking%20blog/transforming%20banks%20it%20productivity/it_productivity_804_ex2_exhibit%20only.png?cpy=Center&cq=50)

Read for cost, profit or transformation bridges. Study how the headline, starting level, drivers and final gap form one argument. Adapt with a native `waterfall-chart` and one short implication. DOE's waterfall has scalar changes/totals: do not imitate stacked bridge segments, value ranges or free-positioned arrows. B/C come from [McKinsey's 2019 banking article](https://www.mckinsey.com/industries/financial-services/our-insights/banking-matters/transforming-banks-it-productivity).

If an image fails to load, try one other relevant reference above. Do not repeatedly retry or change its URL. If none can be read, continue with the written recipes and state the visual-inspection limitation; never claim unseen reference details.

## 1. Design direction

- For a new deck without a required brand theme, use `theme=yrkie-theme`: near-white canvas, dark headings, blue evidence. Respect an existing or explicitly requested theme. Do not add a McKinsey logo or imply affiliation.
- Use a left-aligned `section-heading`, `level=2`, for analytical conclusions: compact enough to leave room for evidence. Reserve `title-group` or `level=1` for sparse opening/section pages; use `level=3` for subchart headings. Write a supported conclusion, not a topic: **"Weekly throughput rose from 80 to 110 cases"**, not "Pilot performance". Target one short sentence. Covers may use a short subject title.
- Make one evidence object dominate: a native chart, a decision table, a process or a coordinated chart pair. Add an implication only when it advances the argument; do not paraphrase an already explicit title. A second object must explain the same claim.
- Prefer open space, ruled tables and transparent accent cards. Use `top-accent-cards` for a brief executive answer; do not turn every page into three cards. Omit decorative icons.
- Emphasis means selective attention: one bold phrase, a meaningful table-cell highlight or a relevant data label. Do not bold entire paragraphs or highlight every alternative.
- Let the theme supply fonts, sizes, line weights and chart colors. Create hierarchy through component roles, grouping, content length and placement. Do not invent font, color, coordinate or CSS fields.

## 2. Choose the page before its components

For each page, identify its **claim, evidence, audience decision and best evidence shape**. Keep the confirmed outline's scope and requested chart types. These are internal design choices, not extra slide text.

| Business question                        | DOE composition                                      | Design choice                                                |
| ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| What is this meeting about?              | `title-group`, left aligned                          | Title + one short subtitle. Omit eyebrow/icon for a restrained opening. |
| What should leadership do?               | Heading → `top-accent-cards` → decision sentence     | Three distinct roles: recommendation, evidence, action. No repeated bullets. |
| What changed over time?                  | Heading → full-width `line-chart` → implication      | One or two series with the same unit; `smooth=false`.        |
| What explains the change?                | Heading → full-width `waterfall-chart` → implication | Absolute opening/closing totals and signed changes.          |
| How do alternatives compare?             | Heading → `primary-secondary-layout`                 | Chart and supporting interpretation side by side.            |
| Do two groups follow different patterns? | Heading → `column-layout-group`, `columns=2`         | Two coordinated charts, each with a short `section-heading`, `level=3`, in its own `stack-layout-group`. |
| Which option fits our constraints?       | Heading → `data-table` → decision sentence           | `borderStyle=three-line`; highlight only decisive cells.     |
| What happens next?                       | Heading → `numbered-node-timeline` → success gate    | Horizontal, not staggered; three or four phases with owners and deliverables. |
| What should be prioritized?              | Heading → `risk-matrix` → rationale                  | Only with supplied, defined 0..1 scores. Otherwise use a qualitative decision table. |

Start analytical pages with the answer; let evidence occupy the main area. Use full width when the chart itself explains the finding. Split the page only when interpretation earns its own column. Root order is reading order; groups are layout, not decorative containers. Keep a `primary-secondary-layout` to two direct children; its supporting child may be a short `stack-layout-group`. Current default Flow uses equal-width slots, even with `ratio=primary-first`; do not promise a 2:1 or 3:2 split. Never put `icon-callout` inside it.

For paired charts, use the same chart type, category order, unit and explicit `minValue`, `maxValue`, `tickInterval` when comparing magnitude. Use one series per chart, `showLegend=false`, short labels and a shared source. Prefer two readable plots to four cramped ones. Different units require explicit labels and must not imply directly comparable heights.

For a new decision deck, a useful progression is: answer → evidence → drivers → alternatives → decision → delivery. Adapt this to the actual task, not a mandatory slide count. Vary evidence shapes while keeping heading and source placement consistent. Adjacent pages may repeat a layout for a useful direct comparison; otherwise do not repeat the same card grid or split layout by habit. Do not add section dividers to an already short deck.

## 3. Make the evidence do the work

| Relationship                    | Preferred native component | Important distinction                                        |
| ------------------------------- | -------------------------- | ------------------------------------------------------------ |
| Comparable categories           | `grouped-bar-chart`        | Keep natural/time order; rank only when ranking is the question. Start bars at zero. |
| Time                            | `line-chart`               | Consistent intervals and units. Label supplied forecasts explicitly; do not silently interpolate missing observations. |
| Contributions to a total        | `stacked-bar-chart`        | Series must be additive and use the same unit.               |
| Opening + changes = closing     | `waterfall-chart`          | `type=total` is an absolute level, not another delta. Reconcile the arithmetic. |
| Several criteria or mixed units | `data-table`               | Put units in column headers; align numeric columns right.    |
| A few parts of one whole        | `donut-chart`              | Use only if composition is the message. Prefer bars for precise comparison across groups. |

- Give the measure, unit, period and comparison basis where needed. Never combine revenue and margin percentage on the same numeric scale. Keep series order stable across comparable pages.
- Prefer a few readable categories and one or two series. If more are essential, reorganize by a meaningful question within the authorized page count, preserving required content. Do not crop away inconvenient evidence.
- Put a short truthful source/note in the final `text-paragraph`, together with the implication when this saves a block. Do not invent a source, confidence interval or causal explanation. Use "percentage points" when subtracting percentages.
- If required data is missing, obtain it through the available workflow. Do not replace a promised chart with a large number, prose or generated image. Use illustrative data only when authorized and label it visibly.
- Do not depend on manual per-bar colors, arbitrary callout coordinates or dotted forecast lines: this authoring contract does not provide them. Use supported labels, separate series/tables and concise explanation.
- Use photographs only when visual evidence is material to the argument. A strategy deck may need none. Never generate a picture of a chart or table. Inspect chosen images through ReadImage and use only authorized project assets in slides.

## 4. Working DOE examples

These independent pages demonstrate composition, not a required deck. **All numbers, options, owners and recommendations below are fictional examples.** Replace them with the user's evidence; keep the visible illustrative label if the user requests a demonstration. Follow the current Slide Schema for syntax and limits; these examples do not extend it. Write slide content in the user's requested language; keep Schema identifiers unchanged. Code fences are for this Skill only, not the tool's final Markdown payload.

### A. Executive answer: three roles, one decision

```doe
title=Operating review
theme=yrkie-theme
# slide
## section-heading
level=2
text=Validate the pilot before expanding to every team
## top-accent-cards
itemLayout=grid
itemColumns=3
columnPreference=3
items=<[title="Replicate one team";text="Run one controlled replication."],[title="Output +37.5%";text="Weekly cases rose from 80 to 110; quality is unmeasured."],[title="Quality before scale";text="Track throughput and error rate together."]>
## text-paragraph
### text
**Decision:** authorize a measured replication. Source: illustrative scenario.
```

### B. Trend: one large chart, one measured implication

```doe
# slide
## section-heading
level=2
text=Throughput rose 37.5% from Week 1 to Week 4
## line-chart
categories=<"Week 1","Week 2","Week 3","Week 4">
series=<[name="Cases per week";data=<80,88,98,110>;labels=<[index=3;text="110 cases"]>]>
smooth=false
showLegend=false
valueSuffix= cases
includeZero=true
## text-paragraph
### text
**Next test:** measure quality and staffing before claiming efficiency. Source: illustrative data.
```

### C. Driver bridge: explain an offset, not just the ending number

```doe
# slide
## section-heading
level=2
text=Higher costs offset two-thirds of the volume gain
## text-paragraph
### text
Operating profit bridge, USD millions, illustrative annual comparison
## waterfall-chart
items=<[label="Opening";value=100;type=total;valuePosition=above],[label="Volume";value=30;valuePosition=above],[label="Costs";value=-20;valuePosition=above],[label="Closing";value=110;type=total;valuePosition=above]>
showChangeSigns=true
showValues=true
includeZero=true
valuePrefix=$
valueSuffix=m
## text-paragraph
### text
**Next step:** investigate the $20m cost increase. Source: illustrative data.
```

### D. Evidence and interpretation: chart first, supporting text second

```doe
# slide
## section-heading
level=2
text=Option B costs least but takes longest
## primary-secondary-layout
### grouped-bar-chart
categories=<"A","B","C">
series=<[name="Implementation cost, USD thousands";data=<120,90,100>]>
showLegend=false
includeZero=true
valuePrefix=$
valueSuffix=k
### stack-layout-group
#### text-paragraph
##### text
**Cost:** B is $10k below C and $30k below A.
#### text-paragraph
##### text
**Time:** B takes 8 weeks, compared with 6 for A and 4 for C. Cost alone does not determine the choice.
## text-paragraph
### text
Source: illustrative one-time cost estimates and planning durations.
```

### E. Decision table: make the trade-off visible

```doe
# slide
## section-heading
level=2
text=Only Option C meets both the budget and deadline
## text-paragraph
### text
Constraints: at most $100k implementation cost and four weeks to launch.
## data-table
borderStyle=three-line
columns=<[header="Option"],[header="Cost, USD k";align=right],[header="Weeks";align=right],[header="Meets both?"]>
rows=<[cells=<"A",120,6,"No">],[cells=<"B",90,8,"No">],[cells=<"C",100,4,[text="Yes";emphasis=highlight]>]>
## text-paragraph
### text
**Decision:** approve C if both limits are firm. Source: illustrative estimates.
```

### F. Delivery: gates, owners and outputs

```doe
# slide
## section-heading
level=2
text=Three gates turn the recommendation into a measured rollout
## numbered-node-timeline
orientation=horizontal
staggered=false
connectors=true
items=<[title="Baseline";text="Operations lead: define case counts and error rates."],[title="Replicate";text="Pilot lead: test one team using the same measures."],[title="Decide";text="Sponsor: review output and quality before scaling."]>
## text-paragraph
### text
**Gate:** agree throughput and quality thresholds before the pilot. Source: illustrative plan.
```

## 5. Final design pass

Before submission, check:

1. Can a reader understand the argument by reading only the page titles? Are claims supported at the stated level of certainty?
2. Does each page have one dominant evidence object, a visible reading order and a reason for its layout?
3. Are promised charts native and editable, units consistent, arithmetic correct, and sources/assumptions truthful?
4. Have redundant paragraphs, decorative icons and unnecessary containers been removed? If crowded, shorten or redistribute within the authorized page count; do not invent a smaller font.
5. Is the deck coherent without repeating one composition everywhere? Are comparable series ordered consistently?
6. If rendering or page inspection is available, inspect title wrapping, chart labels, table density and clipping. Revise visible problems; validation alone does not prove good visual design.

Avoid a dark-blue rectangle on every page, oversized metrics in place of analysis, generic "Insights" headings, rainbow charts, 3D diagrams without a structural reason, stock handshake imagery and invented citations. Restraint should make the decision easier to see, not remove necessary evidence.

## 6. Research basis

Public references inform hierarchy and analytical variety; the DOE recipes and fictional examples above are our own adaptation. These links are reading sources, not slide assets or proof of image inspection.

- [McKinsey Global Institute: 2025 in charts](https://www.mckinsey.com/mgi/our-research/mckinsey-global-institute-2025-in-charts)
- [McKinsey Design System, core artboards, 2020 v0.9.1](https://cdn.mckinsey.com/assets/sketch/McK_DS_core_Artboards.pdf)

## Image direction: compose for the slide before generating

Apply this section while planning the Outline, before images are generated. Analytical pages usually need native charts, tables or diagrams, not generated artwork. Use a photograph only when it establishes a setting, explains a physical process or gives a section a useful visual pause. Generated photographs are illustrative, never documentary evidence of a named company, facility, person or result.

For each image, decide its role, final aspect ratio, subject, occupied area, quiet area for editable text, lighting and crop. Keep all headlines, numbers, labels, logos and charts as DOE components. Never ask the image model to draw a finished slide. A quiet area is low-detail tonal space, not a visible placeholder box. For a narrow edge image, compose inside that image slot; do not waste half the crop leaving space for text that will sit outside the image.

Use these complete prompts as starting points; adapt the subject to the actual brief without inventing business facts:

**A. Section-opening context — 16:9, background retained.**

```text
Create a restrained editorial photograph for a business strategy presentation about urban infrastructure. A contemporary transport interchange occupies only the rightmost 40% of the wide frame, seen from a slightly elevated viewpoint at early morning. Keep the entire left 52% and a narrow central transition as calm pale overcast sky and softly out-of-focus architecture, with low detail and no strong edges; this area will receive dark editable slide text later. Cool slate, muted concrete and soft blue tones, realistic materials, natural diffuse light, subtle atmospheric depth, precise architectural lines. Keep important structures clear of the outer 8% crop margin. No people posing, no handshake imagery, no readable signs, text, numbers, logos, watermarks, graphs or presentation frames.
```

Under the Classic Blue consulting theme, prefer placing this asset in a right-hand edge-image layout with copy on the plain left surface. Inspect before cropping; use a dedicated portrait prompt below when the wide source loses its subject. Existing image-background reading surfaces remain part of the current theme.

**B. Physical operations — 3:4, background retained; for a right-edge image slot.**

```text
Create a realistic vertical editorial photograph of a modern automated warehouse, used as an illustrative industry context rather than evidence of a specific company. One conveyor and its scanner form the focal point around x=55%, y=55%; the machine remains fully recognizable within the middle 70% of the frame. Parallel shelving recedes upward and inward, with a quiet neutral wall near the top. Restrained slate gray and off-white with one muted blue equipment accent, accurate industrial proportions, clean but credible working conditions, soft overhead light, natural shadows and moderate depth of field. Compose for a tall narrow crop with 10% breathing room around the focal equipment. Do not reserve a blank half for slide copy: the editable copy will sit outside this image. No text, logos, labels, dashboards, charts, dramatic neon effects or staged businesspeople.
```

**C. One physical object — 4:3, background removed.**

```text
Create one photorealistic unbranded industrial valve assembly, shown in three-quarter view with the complete object visible. Center it inside the middle 70% of a 4:3 frame, leaving generous separation around all extremities for clean background removal. Brushed steel, restrained dark-gray fittings and one muted blue handle; accurate mechanical construction, soft studio key light from the upper left, gentle object shading and crisp natural edges. No floor, scenery, pedestal, strong cast shadow, transparent materials, exploded parts, text, numbers, labels, logos, badges or arrows. The object will be placed beside editable technical explanation on a plain slide.
```

For A/B write an Outline `## generateimg` with `removeBackground=false`; use `ratio=16:9` or `ratio=3:4`. For C use `removeBackground=true` and `ratio=4:3`; the host supplies the matting background instructions. The prompt is the node's literal body, not another JSON field. Confirmation triggers generation. If GenerateImage is supplied for a later authorized edit, use its actual declared arguments and the same composition brief; never regenerate an already successful asset merely to repeat a tool call.

Inspect the returned asset with ReadImage before placement: subject accuracy, crop, required quiet area, tonal contrast, absence of accidental lettering, and cutout edges. If a visible defect blocks the intended layout, first try a supported crop or a different layout; otherwise revise that specific defect in one authorized replacement request. Do not promise that a prompt alone guarantees correct pixels, and do not replace factual charts with a generated image.

## Decision, evidence and density discipline

Apply these checks to the recipes above without replacing the user's requested structure or facts. A conclusion must be supported by the supplied evidence. When the evidence cannot establish an answer, use a precise question or a scoped status statement instead of manufacturing a confident headline.

Distinguish **observed evidence**, **interpretation**, **assumption** and **recommended action**. Label an assumption where it affects the decision; do not bury it in a tiny footnote. An observed association does not establish causality. A proposed action is not a completed outcome. Preserve unknowns instead of filling empty fields with plausible business language.

- **Low density:** one supported answer and its decisive evidence, or a short decision with its condition. A sparse page does not need three cards, a decorative photograph or an invented metric.
- **Medium density:** one evidence object with a compact implication, or two coordinated evidence regions. Keep each heading, chart and explanation together in a stack; do not split their roles across unrelated columns.
- **High density:** a plain level-2 heading and a full-width native table, chart or ordered process. Remove mood photography and repeated conclusions first. Retain every required alternative, constraint, unit, denominator and exception. Reorganize or request a scope change if the agreed pages cannot remain readable; never solve density with unreadably small text or omitted facts.

Before submission, reconcile the page against the supplied material: all named options, distinguishing attributes, values, periods, bases and qualifications must remain visible. Recalculate totals, changes and percentage-point differences; use the correct denominator for each metric. Keep comparable scales and distinguish missing values from zero. Sources must identify real supplied or retrieved evidence, not an invented citation. Generated context images remain illustrative and are usually unnecessary on analytical pages. A successful save confirms neither factual completeness nor visual readability; inspect an available preview and disclose when that inspection was unavailable.


## Component selection and composition priority

This is the current selection policy. It overrides earlier component shortlists, density-to-layout prescriptions and fallback recommendations in this Skill. Examples teach syntax and possibilities, not a required page order or reusable deck skeleton. Preserve facts and the user's explicit composition choices. The preserved user-authored McKinsey prefix remains intact; its older lower-priority component examples illustrate syntax only and do not expand the current selection pool.

On content pages, consider a native `data-table` and the independent Diagrams alongside the preferred Contents below. Choose by the actual information relationship and usable space, not the topic or a component's name. Among equally suitable Contents, prefer Tier 1, then Tier 2. Do not proactively select other Contents for new compositions. Native charts remain appropriate for measured quantities and comparisons; headings, text, images and other base components support the composition rather than becoming a default text-only page.

**Tier 1 - the user's exact 13 choices**
- Distinct relevant images with editable captions: `image-above-text`.
- Co-equal conceptual parts: `segmented-semicircle`, `petal-diagram`, `segmented-circle`, `ring-node-diagram`; these shapes do not encode numerical shares.
- Genuine chronology: `numbered-node-timeline`; repeated feedback: `circular-arrow-cycle` with a real return path.
- Layered widening scope: `widening-stair-diagram`; real hierarchy: `layered-pyramid`; broad-to-narrow stages: `layered-inverted-pyramid`. Geometry must match the supplied relationship.
- Parallel ideas: `diagonal-rounded-cards`; ordered actions: `chevron-steps`; qualitative advancement: `ascending-arrow-steps`.

**Tier 2 - the user's exact 8 choices**
- Parallel ideas: `filled-cards`, `bottom-right-badge-cards`, `top-left-icon-cards`.
- Ordered actions: `slanted-numbered-steps`, `pill-numbered-steps`; qualitative advancement: `ascending-bar-steps`.
- Questions, viewpoints or attributed voices: `quote-frame-cards`, `speech-bubble-cards`. Framing is not evidence of a quotation; never invent an endorsement or speaker.

**Independent Diagrams - not assigned to either Contents tier**
- True narrowing sets: `horizontal-3d-funnel`, `vertical-3d-funnel` (1-4 items).
- Nested scope: `concentric-target` (1-4); layered structure: `layered-3d-cube` (1-4); interacting domains: `interlocking-3d-rings` (2-6, 1-3 per side).
- Actual ordered progress: `folded-rising-arrow` (1-4), `wave-rising-arrow` (exactly 3), `droplet-arrow-steps` (1-5), `serpentine-steps` (1-6), `staggered-arrow-cards` (1-4).
- Closed feedback: `folded-three-arrow-cycle` (exactly 3). Parallel semantic anchors: `large-icon-items` (1-4). Supplied percentages: `vertical-percentage-bars` (1-4, numeric 0-100).
Use counts, fields and optional icons exactly as defined by the current Schema. Diagrams can carry a content page at useful scale; do not reduce them to small decorations beside a larger generic card grid. A table is useful for shared comparison criteria, records or responsibilities, not a mandatory container for all prose.

**Check the previous two pages before selecting the next main visual.** Compare dominant geometry and overall composition: for example radial factors/full-width, timeline/horizontal band, table/asymmetric evidence, or image-cards/gallery. Headings, body text, footnotes, color changes and icon substitutions do not count as a different main visual. Avoid repeating the same dominant component family and layout across nearby pages. Choose a different semantically suitable option and a genuinely different arrangement; do not merely swap one card corner or badge. For a deliberate direct data comparison, keep the appropriate chart type and comparable scales when consistency improves understanding. Never invent a cycle, ranking, hierarchy, causal arrow, extra stage or number merely to obtain variety. A quiet opening, quotation or closing is valid when the message warrants it; no fixed component quota or page schedule applies.

Compose one clear reading path with the needed native evidence and related support. Full-width diagrams/tables, radial groups, horizontal bands, asymmetric evidence and image-led arrangements are all available. An edge image plus cards is one option, not the universal content-page recipe. Use the current Schema's heading hierarchy and preserve visible units, periods, qualifiers and sources; a hidden legend does not display its series name. Prefer inspected imagery and meaningful semantic icons where useful, with one coherent material family. Inspect actual renderings when available; compilation alone is not visual approval.


## Style-specific component combinations

This current supplement governs component selection where older examples default to plain columns or low-priority cards; it does not replace the analytical or factual discipline above. Use bottom-right-badge-cards for parallel actionable levers, chevron-steps for real execution gates, concentric-target for genuinely nested scope and a native chart/table whenever numbers drive the decision. A relationship diagram needs a structural reason; decoration never upgrades evidence. Preserve every value and qualification in a visible field, without repeating the full data series as prose.

### Native composition examples

These are fictional teaching examples. Replace the copy with the approved facts and use the user's language. Keep explicit verbatim constraints; never import illustrative claims into the user's deck.

#### Parallel operational levers

```doe
theme=yrkie-theme
# slide
## section-heading
variant=plain
level=2
text=Three independent levers address the operating model
## bottom-right-badge-cards
itemColumns=3
items=<[title="Process";text="Clarify the documented handoff.";icon="GitBranch"],[title="People";text="Define the accountable role.";icon="Users"],[title="Tools";text="Match the tool to the stated task.";icon="Settings"]>
```

#### Execution gates with real order

```doe
theme=yrkie-theme
# slide
## section-heading
variant=plain
level=2
text=Validate the proposal before broader execution
## chevron-steps
orientation=horizontal
items=<[title="Define";text="Agree the problem and success criteria."],[title="Validate";text="Test the proposal against the same criteria."],[title="Execute";text="Proceed only after the agreed review."]>
```


## Inner-page imagery and semantic markers

Carry image art direction throughout the deck, not only on the cover. Choose subject imagery that explains the brief, atmospheric scenes that establish mood, or page-surface artwork around editable content. A well-designed decorative background is a valid inner-page visual; it need not contain a subject photo. Preserve regular visual presence and varied page silhouettes without a fixed image percentage or asset count. Dense evidence pages may remain plain. Respect text/data-only requests and factual-image restrictions; illustration and atmosphere are not documentary evidence.

Plan each required asset by role, palette, occupied area and quiet reading area. Reuse inspected assets purposefully; do not generate per bullet. Include necessary new assets as generateimg, then ReadImage and use the exact returned reference. Adapt subjects to the brief, resolve recipe placeholders, and keep words, icons, cards, data and factual diagrams native. A prose promise is not an image.

Compose imagery and native information around the actual relationship. A full-width Diagram, comparison table, radial group or horizontal band can lead the page; use an edge image only when it earns its space. Keep related facts together, protect legends and vary the main silhouette rather than only changing the image subject.

Choose a meaningful Lucide icon for each icon-capable item: Leaf for selection/care, Truck for delivery, Droplets for watering, RefreshCw for renewal, Package for supply, Database for data, Users for people. Adapt to the meaning; do not reuse one generic sparkle. Some stable component IDs contain numbered; their decorative marker is now an icon. Keep real counts, amounts, percentages, dates and essential stage labels in text. Do not enter numerals in icon fields or fake relationships to justify a component.

**Image family for this style.** Keep analytic rigor while using relevant product/customer context and process/detail imagery on multiple inner pages. Data-dense tables may remain image-free; business/context/solution/closing pages carry the image plan. A small subject image plus concise icon-led implications can support a native chart without reducing its readable area.

### A relationship-led content composition

This independent teaching example uses fictional or generic content. It is not a mandatory page role; replace facts with the approved brief and compare its silhouette with nearby pages.

```doe
theme=yrkie-theme
# slide
## section-heading
variant=plain
level=1
text=Qualify the same cohort before comparing conversion
## horizontal-3d-funnel
items=<[title="Reached";text="800 leads"],[title="Qualified";text="240 leads"],[title="Converted";text="60 leads"]>
## text-paragraph
### text
Illustrative nested lead sets, not actual performance. The geometry is schematic; the labels carry the counts.
```


## Seamless image surfaces

The default slide fill for `yrkie-theme` is `#F9F9FF`. Match the actual page fill, not the outer workspace or a card fill; recheck after theme/background changes. For images meant to merge into the page, this overrides generic white/ivory backgrounds in older recipes. Choose:

- **Matched surface**, `removeBackground=false`: add "Use a flat, uniform #F9F9FF background up to every joining edge. Keep texture, lighting gradients, shadows and vignettes away from those edges; no frame or paper rectangle." Keep the subject and this Skill's visual material; retain planned text space. Intentional scene photographs may keep their own environment.
- **Freestanding cutout**, `removeBackground=true`: describe the complete isolated subject, with clean separated edges and no scene or ground. The host adds the selected matting preset and removes the background. Do not manually add green-screen instructions; requesting green with false leaves a green rectangle. Keep necessary green leaves their natural color; prefer a matched surface if matting damages them.

Use `fit=contain` for an uncropped isolated object. Inspect the returned image and its placement for a visible rectangle, halo, clipped tips or damaged edges. A color instruction is approximate, not a pixel-match guarantee. If exact seamlessness matters, prefer a verified transparent asset. Never claim alpha or an invisible seam from the prompt alone.



## Image-card compositions (v89)

Show two real operating contexts or customer touchpoints in a disciplined photo pair; keep quantitative comparisons in an adjacent native chart. Captions identify the observation, not an unsupported business outcome.

Use only where helpful: 2-4 different, brief-relevant subjects with one visual treatment. Set the four image options on the collection, not its items: full-width media, `cover` for photographs, `contain` for complete transparent objects. Use 1-2 cards in a narrow side region, never squeeze 3-4 text columns there. Photos do not prove data. Give each fact one primary home; captions add context instead of repeating headlines or chart values. Visible copy excludes component/tool/layout instructions, but retains real units, sources, estimates and limitations.

Teaching fragment: adapt subjects to the brief; replace URLs with authorized, inspected assets, not Skill reference images.

```doe
## image-above-text
itemColumns=2
imageSize=full
imageFit=cover
imageAspectRatio=4:3
surface=none
items=<[src=https://example.com/authorized-first.png;alt="Operating context";title="Operating context"],[src=https://example.com/authorized-second.png;alt="Customer touchpoint";title="Customer touchpoint"]>
```


## Decorative page-surface art direction

A native conclusion heading and chart/table dominate; the perimeter gesture only establishes brand rhythm. Use the actual page fill, not the workspace. Local-asset joining edges stay uniform; an intentional full-page surface may carry subtle material throughout. Inspect its quiet region before native placement; prompt coordinates are not DOE fields.

**Complete decorative-background prompt:** ratio=16:9, removeBackground=false.

> Create an original restrained corporate presentation background, landscape 16:9. Fill the entire field with uniform near-white #F9F9FF. Coordinates are normalized from (0,0) at top left to (1,1) at bottom right. Reserve x=0.06-0.94, y=0.06-0.91 as an uninterrupted flat reading area for editable native headings, charts and source lines. At the extreme left edge, x=0.00-0.018, y=0.00-0.58, place a single crisp blue #1B54DA vertical plane cropped by the canvas. A much shorter pale blue #D2DDF8 accent may touch the bottom-right edge, confined to x=0.84-1.00, y=0.96-1.00. Keep the geometry precise and asymmetrical; no gradients, texture, lighting effects or shadows. All undecorated pixels and joining edges retain #F9F9FF. This is a quiet supporting surface, not a chart or infographic. No text, numbers, logo, semantic icons, cards, panels, axes, data marks, picture frames, stamps, decorative border or completed slide.

Use the generated asset as a page background, not a screenshot containing content. Titles, cards, semantic icons, metrics and charts stay native and editable. If a separate freestanding motif needs transparency, use supported background removal and verify real alpha; green pixels or a checkerboard are not transparency.


## Cutout quality and background choice

For cutout quality, this guidance supersedes earlier illustrative removal settings and replacement-count advice. Green foliage, sage materials and green reflections can overlap the host's green key: a risk, not guaranteed failure. For green products or sustainability foliage, prefer `removeBackground=false`: use a uniform background matching the actual visible slide fill at placement (theme default `#F9F9FF`), or an intentional real scene. Preserve the subject's colors.

Prefer `removeBackground=true` for complete, clearly separated subjects whose visible colors contrast with the host's green key; avoid forcing green subjects through this route. Do not request a textured background, floor, scene or cast/drop shadow; the object's material texture and form shading may remain. The host supplies matting instructions.

Before placement, use `ReadImage` on the exact returned asset. Inspect speckles, gray/green halos, cropped tips and damaged edges at the intended scale. Do not enlarge or place a visibly dirty cutout. Use a matched-background `false` alternative or diagnose the observed defect before targeted regeneration through the normal tool, within existing tool limits and the user's authorized scope. A successful call does not prove clean edges or correct alpha; never claim an unverified cleanup.
