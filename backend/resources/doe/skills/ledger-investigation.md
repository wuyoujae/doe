# Ledger Investigation

## Seamless image surfaces

The default slide fill for `yrkie-ledger` is `#F3F1EB`. Match the actual page fill, not the outer workspace or a card fill; recheck after theme/background changes. For images meant to merge into the page, this overrides generic white/ivory backgrounds in older recipes. Choose:

- **Matched surface**, `removeBackground=false`: add "Use a flat, uniform #F3F1EB background up to every joining edge. Keep texture, lighting gradients, shadows and vignettes away from those edges; no frame or paper rectangle." Keep the subject and this Skill's visual material; retain planned text space. Intentional scene photographs may keep their own environment.
- **Freestanding cutout**, `removeBackground=true`: describe the complete isolated subject, with clean separated edges and no scene or ground. The host adds the selected matting preset and removes the background. Do not manually add green-screen instructions; requesting green with false leaves a green rectangle. Keep necessary green leaves their natural color; prefer a matched surface if matting damages them.

Use `fit=contain` for an uncropped isolated object. Inspect the returned image and its placement for a visible rectangle, halo, clipped tips or damaged edges. A color instruction is approximate, not a pixel-match guarantee. If exact seamlessness matters, prefer a verified transparent asset. Never claim alpha or an invisible seam from the prompt alone.

## Inner-page imagery and semantic markers

Carry image art direction throughout the deck, not only on the cover. Choose subject imagery that explains the brief, atmospheric scenes that establish mood, or page-surface artwork around editable content. A well-designed decorative background is a valid inner-page visual; it need not contain a subject photo. Preserve regular visual presence and varied page silhouettes without a fixed image percentage or asset count. Dense evidence pages may remain plain. Respect text/data-only requests and factual-image restrictions; illustration and atmosphere are not documentary evidence.

Plan each required asset by role, palette, occupied area and quiet reading area. Reuse inspected assets purposefully; do not generate per bullet. Include necessary new assets as generateimg, then ReadImage and use the exact returned reference. Adapt subjects to the brief, resolve recipe placeholders, and keep words, icons, cards, data and factual diagrams native. A prose promise is not an image.

Compose imagery and native information around the actual relationship. A full-width Diagram, comparison table, radial group or horizontal band can lead the page; use an edge image only when it earns its space. Keep related facts together, protect legends and vary the main silhouette rather than only changing the image subject.

Choose a meaningful Lucide icon for each icon-capable item: Leaf for selection/care, Truck for delivery, Droplets for watering, RefreshCw for renewal, Package for supply, Database for data, Users for people. Adapt to the meaning; do not reuse one generic sparkle. Some stable component IDs contain numbered; their decorative marker is now an icon. Keep real counts, amounts, percentages, dates and essential stage labels in text. Do not enter numerals in icon fields or fake relationships to justify a component.

**Image family for this style.** Use authorized documentary objects, locations and evidence details across the story. A generated archive object is illustrative, never a fabricated receipt or factual exhibit. Pair a small documentary image with source-aware callouts next to native data.

## Component selection and composition priority

This is the current selection policy. It overrides earlier component shortlists, density-to-layout prescriptions and fallback recommendations in this Skill. Examples teach syntax and possibilities, not a required page order or reusable deck skeleton. Preserve facts and the user's explicit composition choices.

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

Use for an investigative report, public-interest story, financial review, documentary proposal or evidence-led institutional narrative. Aim for the visual force of a dossier: oversized black type, warm paper, tightly edited monospaced context and a small number of purposeful monochrome images. This original DOE direction is informed by the user's Gamma 5 references; it is not an official Gamma template.

## Compose roles, not templates

One focal point does not mean one component. Choose the page's message and reading path, then assign distinct jobs to type, evidence, explanation and imagery. Use `section-heading variant=display` for an independent oversized title, `variant=plain` for a heading without a rule, and a separate `text-paragraph` when supporting copy needs its own position. `title-group` is a combined title/subtitle unit, not a required cover template. A deliberate sparse composition may still use it.

For independent text blocks over a quiet background, use `textSurface=none` with suitable `foreground`, `contentWidth` and `contentAlign`. The image remains full-page; the text region controls wrapping. The three text primitives then have no automatic panel. Charts, collections and filled panels retain their own surfaces. Read the actual image: its quiet area may be smaller than the requested one. Fit the entire text block within that area with breathing room before the subject. A subject starting around 45% often needs contentWidth 0.35-0.4. Use an edge split when a long title would otherwise cross the subject; never rely on a fixed recipe width. Verify contrast over every line, not just at the first word. For direct text on a dark photo use foreground=light; foreground=dark retains theme colors. Do not reuse a large cover motif behind a dense, full-width content grid. Keep each heading and its description together in a stack or one collection item before arranging columns. Reserve display-size headings for short focal statements; use plain/section level=2 above substantial content. Put sequential actions in one steps composition instead of stacked full-size panels. On content pages, choose a native chart/table/process for the relationship; do not reduce every argument to cards or every cover to a title group.


## Read the reference, then design the page

Call `ReadImage` with the exact URL below before composing. One reference read is enough to establish the direction; reuse it within this Run. Reading this Markdown does not supply pixels. Reference images are design context, not automatically authorized slide assets. If unavailable, use the written recipes and state the limitation without claiming an inspection.

![Gamma 5 Ledger series: archive photograph above a paper-like closing statement](https://static.gamma.app/images/homepage/hero-slide-15.webp)

[Gamma's current homepage](https://gamma.app/) supplies this image. It shows a grayscale archive photograph, a light lower field, an oversized black statement and much smaller supporting text. The user's opening reference supplies the companion idea: a huge investigative question with a small evidence image. These are related visual benchmarks; do not describe the homepage image as that exact opening slide. [Gamma 5 announcement, October 6, 2026](https://gamma.app/insights/introducing-gamma-5-your-story-your-style-your-tools).

## Direction and page rhythm

Use `theme=yrkie-ledger` for a new deck without a required brand. The DOE theme supplies paper-colored surfaces, black typography, strong display hierarchy and its approved language fallback. Respect an explicitly chosen theme. Do not invent font, size, color, coordinate or CSS fields.

Treat the title as the composition's main object on opening and closing pages. Write a short question or supported conclusion, not a long abstract topic. Use `title-group` on sparse statement pages and `section-heading`, `level=2`, on evidence pages. Put a brief category or date in `eyebrow` or `kicker`; do not add fabricated case numbers, official seals or bureaucratic labels just for atmosphere.

Make evidence compact and specific. A photograph should show the relevant setting or object; a chart should establish the actual comparison. Let a dense evidence page be followed by a spare conclusion when the story benefits. Avoid a sequence of identical three-card grids. Keep recurring labels and source placement coherent while changing the main composition.

Select page roles from the approved argument. Vary dominant geometry and composition across nearby pages using the current selection policy; a role does not prescribe one component.

Select roles within the agreed outline and page count. The reference's file-folder tab, irregular paper edge and arbitrary text placement are not separate DOE authoring controls. Preserve the hierarchy with supported blocks; do not rasterize the whole slide to fake those details.

## Plan images before generating

At outline time, choose each image's job: full-page background, edge photograph or isolated object. Then choose the subject placement, text-safe region and aspect ratio. A left title needs quiet space on the left of a background image; an edge image has its own separate text column and should use its area for the subject. Do not ask for blank space inside every edge image.

Use `## generateimg` with `ratio` and `removeBackground` in the Outline. Its description is the actual image prompt. Plans are deferred; authorized confirmation generates them. For an authorized direct image request, `GenerateImage` accepts `prompt`, `ratio` and optional boolean `removeBackground`; use the same selected prompt. There are no `negativePrompt`, `style`, `type` or `imageType` arguments. Put visual exclusions in the prompt text. The host supplies background-removal presets; never request a green screen yourself.

**Subject template:** Replace `[SUBJECT]`, `[CONTEXT]` and `[VISUAL FACT]` before use: "Create an editorial photograph of [SUBJECT] in [CONTEXT]. Make [VISUAL FACT] observable. Use neutral grayscale, directional daylight and believable material detail. Compose for the selected slot: [SUBJECT POSITION], with [TEXT-SAFE REGION]. No words, letters, labels, logos, charts, watermarks or slide layout."

### Prompt A: restrained background with a real text-safe field

Use `ratio=16:9`, `removeBackground=false`; suitable for a sparse opening, not every evidence page.

> A restrained editorial still life for a documentary presentation background. Warm off-white archival paper fills the frame. A closed, unlabelled file folder, one metal binder clip and the edges of two blank sheets occupy only the lower-right quarter. The left 65 percent and upper center remain nearly uniform, clean paper with extremely subtle texture, reserved for large editable black typography added later. Soft raking daylight from the upper left, realistic paper fibers visible only near the objects, grayscale objects, no dramatic vignette. No writing, letters, numbers, stamps, logos, diagrams, watermark or presentation text. Wide horizontal composition, calm and credible rather than distressed or theatrical.

### Prompt B: portrait context photograph for an edge slot

Use `ratio=3:4`, `removeBackground=false`; change the setting when the story concerns something else.

> A documentary-style portrait photograph of an ordinary records room, viewed down a short aisle between shelves of plain archive boxes. Place the principal shelving and receding aisle around the center-right; keep important details inside the central 80 percent so the image can be cropped safely. Neutral black-and-white treatment, natural window light, clear midtones and realistic utilitarian materials. No people, no readable box labels, no seals, no agency branding, no dramatic crime-scene lighting and no text. This is an illustrative setting, not evidence of a specific organization or event. Fill the portrait frame with the setting; do not add a blank typography panel.

### Prompt C: isolated object, separate from editable text

Use `ratio=4:3`, `removeBackground=true`.

> One complete closed archival folder with a single plain metal binder clip, photographed at a slight three-quarter angle. Keep the entire silhouette visible with generous clearance on every side. Neutral gray folder, subtle realistic paper grain, crisp edges, soft directional studio light and a restrained contact shadow close to the object. A simple uncluttered background suitable for clean subject separation. No lettering, case numbers, handwriting, logos, stamps, torn fragments, extra objects or typography. The object should read clearly at a modest size beside a large editable headline.

Generated pictures are illustrations, never proof that an alleged event occurred. Prefer authentic supplied documents or photographs when the claim depends on them; do not replace missing evidence with a persuasive fake.

After generation, inspect the relevant returned assets with ReadImage. Check subject, crop, text-safe area, contrast and any accidental text. If one critical problem appears, make one targeted prompt correction, such as "keep the left two-thirds uniformly light"; retry only when the authorized workflow permits. Then use a safer native composition or report the limitation. Do not loop indefinitely or claim that an uninspected crop is safe.

## Executable recipes

Examples are illustrative; replace content and image placeholders with real evidence and exact authorized asset references. Content follows the user's language. Fences are for this Skill only, not the tool's final `markdown` payload.

### Outline: headline and image role are separate

```outline
title=An evidence-led review
# page
## text
Where did the delay begin?
## text
Opening question. The title will occupy the left of a restrained archive-themed background; the image is illustrative, not evidence.
## generateimg
ratio=16:9
removeBackground=false
An editorial still life on warm off-white archival paper. Place a closed unlabelled folder and one binder clip only in the lower-right quarter. Keep the left 65 percent uniformly light and empty for editable black text. Soft daylight, neutral grayscale objects, subtle texture. No writing, logos, stamps, numbers or slide elements.
```

### Type-led opening

```doe
title=An evidence-led review
theme=yrkie-ledger
# slide
## text-paragraph
### text
REVIEW BRIEFING
## section-heading
variant=display
text=Where did the delay begin?
align=left
## text-paragraph
### text
Evidence, sequence and next steps
```

### Narrow image, dominant question

```doe
theme=yrkie-ledger
# slide
## edge-image-layout
mediaPosition=right
mediaShape=straight
mediaRatio=0.28
### title-group
align=left
#### title
Follow the evidence
#### subtitle
One question, one source, one next step
### image
src=https://example.com/authorized-records-photo.jpg
alt=Replace with the inspected setting or document
fit=cover
position=50% 50%
```

### Background-led alternative

For an archive background, choose a combined title-group or separate display heading and body. Set textSurface=none when the independent text needs to sit directly on the inspected quiet area.

```doe
theme=yrkie-ledger
# slide
background=[src="https://example.com/authorized-archive-background.jpg";fit=cover;position="50% 50%";foreground=dark;contentAlign=left;contentVerticalAlign=center;textSurface=none;overlay=false]
## title-group
align=left
### title
Follow the evidence
### subtitle
A question worth checking
```

### Evidence stays native and editable

```doe
theme=yrkie-ledger
# slide
## section-heading
level=2
text=The queue grew in the second month
## grouped-bar-chart
categories=<"Month 1","Month 2">
series=<[name="Open cases";data=<80,120>]>
showLegend=false
includeZero=true
## text-paragraph
### text
Illustrative data only. Supply the real period, source and case definition before drawing a conclusion.
```

### Chronology before explanation

```doe
theme=yrkie-ledger
# slide
## section-heading
level=2
text=Separate the observed sequence from its explanation
## numbered-node-timeline
orientation=horizontal
staggered=false
items=<[title="Request";text="Record the verified starting event."],[title="Handoff";text="Identify the documented transfer."],[title="Outcome";text="State what the evidence establishes."]>
## text-paragraph
### text
Replace these illustrative stages with verified events and dates.
```

Before submission, remove unsupported claims, decorative official-looking details and repeated metadata. Verify that the largest text states the page's real purpose, evidence remains readable, and every generated image is treated as illustration. Restructure crowded material within scope rather than letting automatic shrinking destroy the hierarchy.


## Style-specific component combinations

Use top-left-icon-cards for parallel evidence questions, layered-inverted-pyramid for an actual narrowing of evidence and a native waterfall/table for money. Typography can be forceful, but the conclusion must stay within the evidence. An archive photograph gives context, not proof. Do not turn uncertainty into a confident causal chain or add a fake official stamp.

### Native composition examples

These are fictional teaching examples. Replace the copy with the approved facts and use the user's language. Keep explicit verbatim constraints; never import illustrative claims into the user's deck.

#### Parallel evidence checks

```doe
theme=yrkie-ledger
# slide
## section-heading
variant=plain
level=2
text=Three questions determine what the evidence supports
## top-left-icon-cards
itemColumns=3
items=<[title="Source";text="Who produced this record?";icon="FileText"],[title="Scope";text="Which period and entities does it cover?";icon="Calendar"],[title="Limit";text="What does the record fail to establish?";icon="Search"]>
```

#### An explicit evidence filter

```doe
theme=yrkie-ledger
# slide
## section-heading
variant=plain
level=2
text=Narrow the material before drawing a conclusion
## layered-inverted-pyramid
items=<[title="Collected records";text="All material available for review."],[title="Relevant records";text="Material matching the stated scope."],[title="Supported findings";text="Claims established by the relevant evidence."]>
```

### A relationship-led content composition

This independent teaching example uses fictional or generic content. It is not a mandatory page role; replace facts with the approved brief and compare its silhouette with nearby pages.

```doe
theme=yrkie-ledger
# slide
## section-heading
variant=plain
level=1
text=Keep observation separate from what remains unknown
## data-table
borderStyle=three-line
columns=<[header="Question"],[header="Observed"],[header="Still unknown"]>
rows=<[cells=<"Availability","The supplied record contains a dated entry.","Whether the service was used.">],[cells=<"Outcome","No outcome measure was supplied.","Whether any change followed.">]>
## text-paragraph
### text
Teaching example: replace records with supplied evidence and retain the distinction between absent evidence and a negative result.
```


## Image-card compositions (v89)

Pair documentary views of the relevant facility and work activity, with consistent neutral treatment. Use a separate native chart or source table for evidence; captions name what is actually visible and its source when known.

Use only where helpful: 2-4 different, brief-relevant subjects with one visual treatment. Set the four image options on the collection, not its items: full-width media, `cover` for photographs, `contain` for complete transparent objects. Use 1-2 cards in a narrow side region, never squeeze 3-4 text columns there. Photos do not prove data. Give each fact one primary home; captions add context instead of repeating headlines or chart values. Visible copy excludes component/tool/layout instructions, but retains real units, sources, estimates and limitations.

Teaching fragment: adapt subjects to the brief; replace URLs with authorized, inspected assets, not Skill reference images.

```doe
## image-above-text
itemColumns=2
imageSize=full
imageFit=cover
imageAspectRatio=4:3
surface=none
items=<[src=https://example.com/authorized-first.png;alt="Site context";title="Site context"],[src=https://example.com/authorized-second.png;alt="Observed activity";title="Observed activity"]>
```


## Decorative page-surface art direction

Pair a plain editorial headline with an open native chart or source table; the surface supplies material, never evidence. Use the actual page fill, not the workspace. Local-asset joining edges stay uniform; an intentional full-page surface may carry subtle material throughout. Inspect its quiet region before native placement; prompt coordinates are not DOE fields.

**Complete decorative-background prompt:** ratio=16:9, removeBackground=false.

> Create an original editorial paper surface for a serious evidence presentation, landscape 16:9. Use #F3F1EB warm-gray paper, viewed flat from above, with exceptionally fine uncoated fiber barely visible at normal reading distance. Keep normalized x=0.06-0.94, y=0.06-0.90 calm and even for editable native text and data. Along the bottom y=0.96-1.00, let one narrow charcoal #161616 printed edge enter from the left and taper to a clean end around x=0.38; a faint gray-green #A0ACA2 paper edge may sit at the far bottom-right. Confine any tactile depth or contrast to these outer edges, without a drop shadow crossing the reading field. Avoid old-newspaper stains or artificial antique damage. The paper fills the canvas without an inset sheet or surrounding mat; undecorated joining edges match #F3F1EB. Generate only material and perimeter artwork, with no newspaper text, letters, numbers, headlines, stamps, logos, citations, card rectangles, icons, charts, data, frames or finished presentation.

Use the generated asset as a page background, not a screenshot containing content. Titles, cards, semantic icons, metrics and charts stay native and editable. If a separate freestanding motif needs transparency, use supported background removal and verify real alpha; green pixels or a checkerboard are not transparency.


## Cutout quality and background choice

For cutout quality, this guidance supersedes earlier illustrative removal settings and replacement-count advice. Green foliage, sage materials and green reflections can overlap the host's green key: a risk, not guaranteed failure. For green site vegetation, packaging or equipment, prefer `removeBackground=false`: use a uniform background matching the actual visible slide fill at placement (theme default `#F3F1EB`), or an intentional real scene. Preserve the subject's colors.

Prefer `removeBackground=true` for complete, clearly separated subjects whose visible colors contrast with the host's green key; avoid forcing green subjects through this route. Do not request a textured background, floor, scene or cast/drop shadow; the object's material texture and form shading may remain. The host supplies matting instructions.

Before placement, use `ReadImage` on the exact returned asset. Inspect speckles, gray/green halos, cropped tips and damaged edges at the intended scale. Do not enlarge or place a visibly dirty cutout. Use a matched-background `false` alternative or diagnose the observed defect before targeted regeneration through the normal tool, within existing tool limits and the user's authorized scope. A successful call does not prove clean edges or correct alpha; never claim an unverified cleanup.
