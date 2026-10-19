# Atelier Editorial

## Seamless image surfaces

The default slide fill for `yrkie-atelier` is `#700F0A`. Match the actual page fill, not the outer workspace or a card fill; recheck after theme/background changes. For images meant to merge into the page, this overrides generic white/ivory backgrounds in older recipes. Choose:

- **Matched surface**, `removeBackground=false`: add "Use a flat, uniform #700F0A background up to every joining edge. Keep texture, lighting gradients, shadows and vignettes away from those edges; no frame or paper rectangle." Keep the subject and this Skill's visual material; retain planned text space. Intentional scene photographs may keep their own environment.
- **Freestanding cutout**, `removeBackground=true`: describe the complete isolated subject, with clean separated edges and no scene or ground. The host adds the selected matting preset and removes the background. Do not manually add green-screen instructions; requesting green with false leaves a green rectangle. Keep necessary green leaves their natural color; prefer a matched surface if matting damages them.

Use `fit=contain` for an uncropped isolated object. Inspect the returned image and its placement for a visible rectangle, halo, clipped tips or damaged edges. A color instruction is approximate, not a pixel-match guarantee. If exact seamlessness matters, prefer a verified transparent asset. Never claim alpha or an invisible seam from the prompt alone.

## Inner-page imagery and semantic markers

Carry image art direction throughout the deck, not only on the cover. Choose subject imagery that explains the brief, atmospheric scenes that establish mood, or page-surface artwork around editable content. A well-designed decorative background is a valid inner-page visual; it need not contain a subject photo. Preserve regular visual presence and varied page silhouettes without a fixed image percentage or asset count. Dense evidence pages may remain plain. Respect text/data-only requests and factual-image restrictions; illustration and atmosphere are not documentary evidence.

Plan each required asset by role, palette, occupied area and quiet reading area. Reuse inspected assets purposefully; do not generate per bullet. Include necessary new assets as generateimg, then ReadImage and use the exact returned reference. Adapt subjects to the brief, resolve recipe placeholders, and keep words, icons, cards, data and factual diagrams native. A prose promise is not an image.

Compose imagery and native information around the actual relationship. A full-width Diagram, comparison table, radial group or horizontal band can lead the page; use an edge image only when it earns its space. Keep related facts together, protect legends and vary the main silhouette rather than only changing the image subject.

Choose a meaningful Lucide icon for each icon-capable item: Leaf for selection/care, Truck for delivery, Droplets for watering, RefreshCw for renewal, Package for supply, Database for data, Users for people. Adapt to the meaning; do not reuse one generic sparkle. Some stable component IDs contain numbered; their decorative marker is now an icon. Keep real counts, amounts, percentages, dates and essential stage labels in text. Do not enter numerals in icon fields or fake relationships to justify a component.

**Image family for this style.** Use one subject portrait/still life, one making/process scene and a close material detail. Alternate an edge photograph plus icon-led collection with a native evidence page containing a smaller detail image. Keep wine, cream and consistent editorial lighting.

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

Use for food, restaurants, cultural travel, craft, exhibitions or a richly art-directed brand story. Build an expressive editorial presentation: wine-red surfaces, pale cream type, elegant serif headlines and one substantial photographic subject. This original DOE direction is informed by Gamma 5's Bologna example; it is not an official Gamma template or a reproduction of that identity.

## Compose roles, not templates

One focal point does not mean one component. Choose the page's message and reading path, then assign distinct jobs to type, evidence, explanation and imagery. Use `section-heading variant=display` for an independent oversized title, `variant=plain` for a heading without a rule, and a separate `text-paragraph` when supporting copy needs its own position. `title-group` is a combined title/subtitle unit, not a required cover template. A deliberate sparse composition may still use it.

For independent text blocks over a quiet background, use `textSurface=none` with suitable `foreground`, `contentWidth` and `contentAlign`. The image remains full-page; the text region controls wrapping. The three text primitives then have no automatic panel. Charts, collections and filled panels retain their own surfaces. Read the actual image: its quiet area may be smaller than the requested one. Fit the entire text block within that area with breathing room before the subject. A subject starting around 45% often needs contentWidth 0.35-0.4. Use an edge split when a long title would otherwise cross the subject; never rely on a fixed recipe width. Verify contrast over every line, not just at the first word. For direct text on a dark photo use foreground=light; foreground=dark retains theme colors. Do not reuse a large cover motif behind a dense, full-width content grid. Keep each heading and its description together in a stack or one collection item before arranging columns. Reserve display-size headings for short focal statements; use plain/section level=2 above substantial content. Put sequential actions in one steps composition instead of stacked full-size panels. On content pages, choose a native chart/table/process for the relationship; do not reduce every argument to cards or every cover to a title group.


## Read the relevant visual reference

Call `ReadImage` with one exact URL below before composing. Choose the cover for a hero page or the ingredient page for an explanatory composition. Read the second only if its different structure will help. Reuse observations within the Run, respect the image budget and never claim that a Markdown caption supplies pixels. If references fail, continue with the written recipes and state the limitation.

![Gamma 5 Bologna cover: burgundy, oversized serif typography and one photographic plate](https://static.gamma.app/images/homepage/hero-slide-1.webp)

![Gamma 5 Bologna companion page: an editorial headline and a structured ingredient display](https://static.gamma.app/images/homepage/hero-slide-6.webp)

Both are from [Gamma's current homepage](https://gamma.app/); the first matches the user's Bologna cover. Observe the single dominant plate against a disciplined palette, then the change to an explanatory page with ingredient images and smaller text. The original cover layers repeated words behind the plate. Current DOE Markdown does not provide arbitrary overlap, repeated background typography or a free-positioned ingredient grid. Translate the hierarchy with supported image and text blocks rather than generating a flat copy of the slide. [Gamma 5 announcement](https://gamma.app/insights/introducing-gamma-5-your-story-your-style-your-tools).

## Direction and page rhythm

Use `theme=yrkie-atelier` for a new unbranded deck. DOE supplies a burgundy field, pale cream foreground, EB Garamond display headings and readable supporting typography. Preserve an explicit user theme. Do not invent font, color or freeform position fields.

Give one subject generous scale. Food should look tangible; cultural objects should retain their shape and material. A title should name the place, proposition or experience in few words. Use `title-group` for a sparse opening and `section-heading`, `level=2`, for explanation. Do not repeat a location name merely as decoration or imitate the reference's brand identifiers.

Use images to set desire or reveal a meaningful detail, then use native content to explain. Follow a sensory cover with a clearer origin, method or evidence page. A rich picture on every page weakens the moments that deserve it. Avoid treating all information as a menu of equal cards.

Select page roles from the approved argument. Vary dominant geometry and composition across nearby pages using the current selection policy; a role does not prescribe one component.

Choose these roles within the approved outline; they are not eight mandatory slides. The Gamma reference changes page backgrounds, but this DOE deck has one selected theme. Do not simulate arbitrary page colors using fake syntax or generate solid-color images solely to bypass that contract.

## Compose the image before writing its prompt

At outline time select the image's purpose, aspect ratio and composition. A full background must leave a deliberately calm region behind the future editable title. An edge image should preserve its subject inside the crop, with title text outside it. A cutout should show the complete object, with enough clearance for clean separation; its typography remains a separate DOE component.

Use `## generateimg`, `ratio` and boolean `removeBackground` for Outline plans. Plans generate only after authorized confirmation. For an authorized direct generation, use `GenerateImage` with `prompt`, `ratio` and optional `removeBackground`, not `aspectRatio`, `negativePrompt`, `style`, `type` or `imageType`. Put exclusions inside the prompt. The platform supplies background-removal requirements; never add a green-screen instruction.

**Subject template:** "An editorial photograph of [DISH, OBJECT OR MATERIAL], showing [VERIFIED VISUAL DETAILS]. Compose for [BACKGROUND, EDGE IMAGE OR CUTOUT], with [SUBJECT POSITION] and [TEXT-SAFE REGION OR CROP MARGIN]. Use [LIGHT], believable texture and a burgundy/cream-compatible setting. No words, labels, typography, branding, watermark or slide layout." Replace all placeholders and omit any detail that has not been supplied or approved.

### Prompt A: a full background with a calm title zone

Use `ratio=16:9`, `removeBackground=false`.

> A high-quality editorial food photograph of a single ceramic plate of handmade ribbon pasta with a rich tomato-based sauce and a few fresh basil leaves. Place the plate in the lower-right portion, occupying about 40 percent of the wide frame. The entire left half and upper-left quarter remain a quiet, nearly uniform deep burgundy tabletop close to #700F0A, intentionally reserved for large editable cream typography added later. Soft directional light from the upper left, natural highlights on the pasta, tactile ceramic and restrained shadows. Warm, appetizing and believable, not a glossy plastic render. No cutlery crossing the text-safe area, extra plates, hands, wine labels, letters, menu text, logos or watermark. The image is a visual concept, not evidence of a particular restaurant's dish.

### Prompt B: portrait food detail for an edge panel

Use `ratio=3:4`, `removeBackground=false`.

> A close editorial food photograph of a handmade pasta dish on a pale ceramic plate, captured from a three-quarter dining angle. Keep the main mound of pasta near the center, with the plate edge and important garnish safely inside the crop. Show realistic folds, sauce texture and delicate steam without obscuring the food. Deep warm burgundy surroundings, soft daylight, gentle shadow falloff and restrained styling. No crowded table setting, no glossy advertising effects, no text, labels, logos, menu graphics or human hands. Fill the portrait frame with the food experience; the presentation's headline will sit in a separate text column.

### Prompt C: complete hero object for background removal

Use `ratio=4:3`, `removeBackground=true`.

> One complete shallow pale ceramic plate holding handmade ribbon pasta, textured sauce and a small fresh herb garnish, photographed at a slight three-quarter angle. Preserve the entire plate rim and all food inside it, with generous clearance around the silhouette. Natural editorial food lighting, believable ceramic and fresh ingredients, rich detail without exaggerated gloss, a minimal contact shadow close to the plate. Use a simple uncluttered background suitable for clean subject separation. No tableware, loose floating ingredients, hands, text, labels, logo, typography, menu or watermark. The result will be placed beside editable serif text, not over a pre-rendered headline.

These are complete starting prompts; replace the dish when needed rather than applying pasta to every topic. For a museum or craft narrative, preserve the same composition logic and describe the actual object and material. Do not fabricate provenance, ingredients, dietary properties or an institution's collection.

Inspect returned assets with ReadImage before using them. Check the plate/object silhouette, credible material, crop, background match and empty text region. If a critical flaw appears, make one specific correction and retry only when authorized. If it remains unresolved, switch to a safer native composition or report the limitation; do not regenerate indefinitely. Never bake headings, labels or numbers into the image to imitate the reference.

## Working recipes

The examples are illustrative and independent. Replace names, claims and placeholder URLs with the user's material and exact authorized project references. Keep content in the user's language and the Schema identifiers unchanged. Outer fences are not part of a tool's `markdown` payload.

### Outline: plan a complete subject for an edge composition

```outline
title=A culinary journal
# page
## text
A place worth tasting
## text
A short editorial invitation on the left, one complete dish as the visual focus on the right.
## generateimg
ratio=4:3
removeBackground=true
One complete pale ceramic plate of handmade ribbon pasta with textured sauce and a small herb garnish, slight three-quarter angle, full plate rim visible and ample clearance around the silhouette. Natural editorial light, believable fresh food, minimal contact shadow, simple background for clean separation. No letters, labels, typography, logos, tableware, hands or extra objects.
```

### One title, one plate

```doe
title=A place worth tasting
theme=yrkie-atelier
# slide
## edge-image-layout
mediaPosition=right
mediaShape=straight
mediaRatio=0.5
### stack-layout-group
#### section-heading
variant=display
text=A place worth tasting
align=left
#### text-paragraph
##### text
An illustrative culinary journal
align=left
### image
src=https://example.com/authorized-food-cutout.png
alt=Replace with the inspected dish and visible ingredients
fit=contain
position=50% 50%
```

### Background-led alternative

A background composition is an alternative to the edge layout. A title-group can keep a short headline/subtitle together; use independent display heading and body with textSurface=none when their placement needs separate control. Use `contentWidth=0.35;contentAlign=left` to constrain all native content to the left 48% of the page's safe width while the photograph remains full-page; verify that this region matches the inspected image's empty area.

```doe
theme=yrkie-atelier
# slide
background=[src="https://example.com/authorized-burgundy-food-background.jpg";fit=cover;position="50% 50%";foreground=light;contentWidth=0.35;contentAlign=left;contentVerticalAlign=center;textSurface=none;overlay=false]
## title-group
align=left
### title
A place worth tasting
### subtitle
An illustrative culinary journal
```

### Two details with readable captions

```doe
theme=yrkie-atelier
# slide
## section-heading
level=2
text=Two details shape the experience
## image-above-text
itemLayout=grid
itemColumns=2
columnPreference=2
items=<[src="https://example.com/authorized-ingredient.jpg";alt="Replace with the inspected ingredient";title="The ingredient";text="State the verified role of this ingredient."],[src="https://example.com/authorized-process.jpg";alt="Replace with the inspected process detail";title="The method";text="Explain the actual preparation choice."]>
```

### A method stays editable

```doe
theme=yrkie-atelier
# slide
## section-heading
level=2
text=The method is part of the story
## numbered-node-timeline
orientation=horizontal
staggered=false
items=<[title="Prepare";text="Describe the verified starting step."],[title="Shape";text="Show the relevant craft decision."],[title="Finish";text="Explain the intended result."]>
## text-paragraph
### text
Illustrative structure. Replace with the actual method; do not invent cooking times or safety instructions.
```

### The practical page earns its own clarity

```doe
theme=yrkie-atelier
# slide
## section-heading
level=2
text=Choose the experience that fits the occasion
## data-table
columns=<[header="Format"],[header="Focus"],[header="What to confirm"]>
rows=<[cells=<"Tasting","A guided introduction","Actual menu and availability">],[cells=<"Workshop","A hands-on process","Eligibility, materials and schedule">]>
borderStyle=three-line
```

Finish by checking that the food or object is relevant, imagery and typography have separate jobs, and the explanatory pages remain legible. Preserve factual labels and sources. If an image dominates so much that the audience cannot find the decision or story, reduce the competing content or choose a different composition rather than adding more decoration.


## Style-specific component combinations

Use diagonal-rounded-cards for parallel ingredients or objects, droplet-arrow-steps for a real preparation method and petal-diagram for a shared flavor/material concept. Keep one photographic protagonist or detail in a supporting edge slot; do not repeat a full plate behind every grid. A collection may be visually rich through theme and geometry without decorative extra copy.

### Native composition examples

These are fictional teaching examples. Replace the copy with the approved facts and use the user's language. Keep explicit verbatim constraints; never import illustrative claims into the user's deck.

#### Equal ingredients with a shared visual treatment

```doe
theme=yrkie-atelier
# slide
## section-heading
variant=plain
level=2
text=Three ingredients, three distinct roles
## diagonal-rounded-cards
itemColumns=3
items=<[title="Grain";text="Provides the structure of the dish."],[title="Vegetable";text="Adds the specified seasonal element."],[title="Sauce";text="Connects the selected flavors."]>
```

#### A genuine preparation order

```doe
theme=yrkie-atelier
# slide
## section-heading
variant=plain
level=2
text=Prepare before cooking; finish before serving
## droplet-arrow-steps
items=<[title="Prepare";text="Measure and prepare the required ingredients."],[title="Cook";text="Follow the specified cooking method."],[title="Finish";text="Add the final elements before serving."]>
```

### A relationship-led content composition

This independent teaching example uses fictional or generic content. It is not a mandatory page role; replace facts with the approved brief and compare its silhouette with nearby pages.

```doe
theme=yrkie-atelier
# slide
## section-heading
variant=plain
level=1
text=Let the preparation sequence explain the craft
## droplet-arrow-steps
items=<[title="Select";text="Choose the specified material.";icon=Search],[title="Shape";text="Apply the documented forming method.";icon=Hand],[title="Finish";text="Inspect the surface before presentation.";icon=Check]>
## text-paragraph
### text
Illustrative craft sequence, not a claim about a particular maker.
```


## Image-card compositions (v89)

Present complete materials and finished objects from this brief as an editorial pair, with generous negative space and restrained serif hierarchy. Use one short sensory caption per object; add a native process only when the sequence is real.

Use only where helpful: 2-4 different, brief-relevant subjects with one visual treatment. Set the four image options on the collection, not its items: full-width media, `cover` for photographs, `contain` for complete transparent objects. Use 1-2 cards in a narrow side region, never squeeze 3-4 text columns there. Photos do not prove data. Give each fact one primary home; captions add context instead of repeating headlines or chart values. Visible copy excludes component/tool/layout instructions, but retains real units, sources, estimates and limitations.

Teaching fragment: adapt subjects to the brief; replace URLs with authorized, inspected assets, not Skill reference images.

```doe
## image-above-text
itemColumns=2
imageSize=full
imageFit=contain
imageAspectRatio=4:3
surface=none
items=<[src=https://example.com/authorized-first.png;alt="Source material";title="Source material"],[src=https://example.com/authorized-second.png;alt="Finished object";title="Finished object"]>
```


## Decorative page-surface art direction

Cream native editorial type and a concise collection or chart sit in the quiet wine field; artwork suggests material rather than prescribing an unrelated food subject. Use the actual page fill, not the workspace. Local-asset joining edges stay uniform; an intentional full-page surface may carry subtle material throughout. Inspect its quiet region before native placement; prompt coordinates are not DOE fields.

**Complete decorative-background prompt:** ratio=16:9, removeBackground=false.

> Create an original wine-colored editorial background, landscape 16:9, with a quiet matte #700F0A field. Coordinates run from top-left (0,0) to bottom-right (1,1). Keep x=0.06-0.91, y=0.07-0.91 completely free of objects, strong texture, shadows and highlights for editable cream typography and native content. Along the far right x=0.95-1.00, allow a cropped thin fold of warm cream #F4E5B8 handmade paper to enter the canvas. Place a restrained clay #D69A68 tactile edge only along the lower-right margin, y=0.96-1.00. Use elegant irregular paper contours, soft side light and almost imperceptible fibers; contact shadows stay inside the perimeter motifs. Leave all other pixels uniformly wine-colored, including any edge intended to join the slide. No food, utensils, unrelated product, handwriting, decorative lettering, digits, logo, semantic icon, card shape, chart, frame, border, inset sheet or slide mockup. The artwork is a material atmosphere behind native editorial content, not the content itself.

Use the generated asset as a page background, not a screenshot containing content. Titles, cards, semantic icons, metrics and charts stay native and editable. If a separate freestanding motif needs transparency, use supported background removal and verify real alpha; green pixels or a checkerboard are not transparency.


## Cutout quality and background choice

For cutout quality, this guidance supersedes earlier illustrative removal settings and replacement-count advice. Green foliage, sage materials and green reflections can overlap the host's green key: a risk, not guaranteed failure. For green ingredients, leaves or glazed objects, prefer `removeBackground=false`: use a uniform background matching the actual visible slide fill at placement (theme default `#700F0A`), or an intentional real scene. Preserve the subject's colors.

Prefer `removeBackground=true` for complete, clearly separated subjects whose visible colors contrast with the host's green key; avoid forcing green subjects through this route. Do not request a textured background, floor, scene or cast/drop shadow; the object's material texture and form shading may remain. The host supplies matting instructions.

Before placement, use `ReadImage` on the exact returned asset. Inspect speckles, gray/green halos, cropped tips and damaged edges at the intended scale. Do not enlarge or place a visibly dirty cutout. Use a matched-background `false` alternative or diagnose the observed defect before targeted regeneration through the normal tool, within existing tool limits and the user's authorized scope. A successful call does not prove clean edges or correct alpha; never claim an unverified cleanup.
