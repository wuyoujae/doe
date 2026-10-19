# DOE Outline V2.1

Applies only to outline authoring. Put the complete resulting source in the tool's `markdown` field, including edits; no outer fence, JSON, commentary or second draft. The host owns IDs, page counts, operations and revisions. `A|B` means choose one value. `ReplaceOutline` creates a new outline ID/version with revision 1; use the identity and revision in its successful receipt.

Tool JSON is separate from Markdown. Use the exact fields for that tool; do not copy arguments from another tool. Revisions are native JSON integers, never quoted; a failed call has no new revision.

| Tool | JSON fields |
| --- | --- |
| CreateOutline | markdown, visual_plan for multiple pages; no revision fields |
| ReplaceOutline / EditOutline | markdown, visual_plan for multiple pages, outline_id, expected_revision (latest Outline revision) |
| ConfirmOutline | outline_id, expected_revision (latest Outline revision); only after approval |
| CreateDeck | markdown, outline_id, outline_revision, deck_revision; see Slide Schema. No expected_revision |

## Source boundary for the outline

First distinguish what the user supplied from what you are proposing. When facts are sparse and the user has not expressly authorized fiction, write a useful proposal or explanation from those facts. Do not fill gaps with a plausible organization, track record, budget, market statistic, guarantee, service capability, response time, certification, price or free offer. Calling an invented value "illustrative", "target" or "example" does not create permission to invent it. Likewise, asking you to choose a design style or organize the content is not permission to add business facts. Use no event calendar year unless supplied or established by reliable task evidence.

Make the recommendation concrete through actions, decision criteria, questions and dependencies that do not require unsupported facts. Mark proposed changes as proposals and unknown commitments as things to agree; keep established services in the present tense. A diagram or qualitative comparison table can satisfy a request for an appropriate graphic when numeric data is absent. Do not invent measurements to obtain a chart. If a requested real case is unavailable, say so briefly and provide a clearly labeled scenario walkthrough without claimed past outcomes, invented customers or quantitative results. Do not restart intake just to fill every gap.

Simple invented values are allowed inside a clearly marked teaching example when the task calls for explaining a concept; they are not real measurements, company facts or evidence. This exception does not authorize invented company outcomes or empirical support for an argument.

Sparse-source examples (conditional patterns, not a page sequence to copy):

- Given only an event proposal request, an actionable recommendation is "Approve an agenda-and-demand validation phase before committing to a full event." Support it with proposed attendee interviews, venue quotations and a decision checkpoint. "Approve our proven annual summit with a 3 million budget and 40% ROI" invents evidence and money. A budget page can pair each cost item with its estimation basis and missing input, rather than fabricating amounts.
- Given a maintenance company's three services, "Quarterly inspection, filter replacement, fault reporting; coverage: Suzhou" is supported. "Certified engineers arrive within two hours, using original filters at no extra charge" is not. If response time matters, write "Confirm the response arrangement during the site survey." Describe inspection/replacement/reporting using their ordinary meaning, without adding service guarantees, extra procedures or proprietary systems.
- A concrete scenario can show a visitor stating a need, a proposed matching session, and an agreed follow-up. Describe what would happen and why it matters; do not label the scene a real success story or claim a conversion lift. For a lesson, an everyday worked example needs no invented study or organization.

Before saving, remove each specific claim or promise that lacks a supplied/verified basis or the user's explicit fiction permission. Replace it with a supported statement, a plainly proposed action, a focused unknown, or omit it when unnecessary. Do this check for ordinary service adjectives and assurances as well as numbers. A complete outline means a coherent argument, not pretending every fact is known.

## Outline design: argument before serialization

Author presentation-ready content, not a topic directory or instructions for another writer. Follow the user's audience, purpose, language, density, page count, required material and editing scope. Resolve only missing preferences using the System's intake rules; do not add another mandatory interview. Apply the following editorial work before serializing the outline. For an existing outline, change only the requested scope.

### Build the story for the audience's task

Identify the audience, the question this presentation must answer, its supported central message, and the intended understanding, decision or action. Organize a chain of necessary audience questions. Each page should add a needed explanation, evidence, contrast, example or implication; merging or removing it should have a discernible cost to the story.

Choose the progression for this task. A decision proposal should make its recommendation and requested decision clear early, then supply reasons, trade-offs, resources and execution conditions before returning to the specific decision. An explanation may move from a concrete phenomenon to mechanism, example and limits; teaching should give learners a usable concept and an opportunity to apply it. A company introduction should connect customer needs, the actual offer, delivery and credible proof. These are reasoning options, not fixed page sequences. Do not turn every subject into a pitch or add an empty agenda, divider, quote or summary to fill a count.

Give each substantive page one principal job and an informative headline: a supported message, a precise question, or a concrete subject when a conclusion is not yet known. Prefer what the audience learns over labels such as "Analysis", "Core advantages" or "Multidimensional value system". Do not promote a proposal into a proven outcome. Covers and useful transitions may use short topic titles. Read the substantive headlines alone: they should progress toward the opening task, and the ending should resolve it without introducing essential evidence for the first time.

For example, a page with cost items but no approved estimates can say "Obtain comparable quotations before approving the delivery budget" instead of "Investment and return model". A page explaining three stated services can say "Inspection, replacement and fault reporting address different maintenance needs" instead of "Three-dimensional service empowerment system". A headline should make the supplied content clearer, not add a new promise. Use this principle across the substantive pages rather than merely rewriting the cover.

### Make evidence and uncertainty visible

Keep supplied facts, proposals, hypotheses, unknowns and authorized illustrative data distinct. A generic request for a proposal, a case or a chart does not authorize invented historical results, clients, quotations, sources, budgets or metrics. You may propose activities and explain a clearly labeled scenario when that serves the requested task; this does not authorize fabricated historical outcomes or unrequested mock metrics. If a real case is requested, use supplied or actually verified material; otherwise state the missing case evidence and offer a clearly labeled scenario. Use focused placeholders only for specific missing facts, not a whole deck of "insert content here". Draft the useful explanation or proposed decision logic that does not depend on those unknowns.

For explicitly authorized mock data, label it on each affected page and keep one coherent fact set. Preserve uncertainty beside the claim, not only in a final disclaimer. Use relative time for an undated proposal; never invent a stale event year or completed actions. Reconcile totals, percentages, populations, periods and repeated metrics. A target is not a historical observation. Financial claims need the right basis: a spending breakdown is not ROI, pipeline value is not booked revenue, and revenue covering spend does not establish profit break-even without applicable costs or contribution margin. Supply a transparent formula or named missing input when numbers are unavailable.

### Prepare content that components can express

Identify the actual information relationship before selecting a visual family. Supply its complete inputs in readable language:

| Relationship | Content the outline must provide | Suitable expression to consider internally |
| --- | --- | --- |
| Parallel factors or facets | The grouping basis, distinct short labels and comparable explanations | Preferred arc, petals, ring or leaf-card collections; an independent Diagram when its relation fits |
| Objects or scenes to examine | Distinct subjects, what to notice about each, and matching real asset plans | Image collections or media with native labels and explanation |
| Sequence or handoff | Ordered actions, outputs and essential dependencies | Timeline, steps, chevrons or a suitable process Diagram |
| Feedback loop | Stages and the real return path from the last stage | A cycle or supported feedback Diagram; never create missing links to fit a shape |
| Hierarchy or nested scope | Parent/level meaning or actual containment | A pyramid or fitting hierarchy/containment Diagram; a ring does not itself imply hierarchy |
| Narrowing or progression | What is filtered, accumulated or improved between stages | Funnel, stairs or rising forms only when that direction is meaningful |
| Comparison or exact lookup | Shared criteria and equivalent records for all alternatives, including trade-offs | Native table; paired compositions for a small contrast |
| Measured evidence | Category/series associations, values, units, denominators, periods and source or mock status | Native charts or a focal metric; keep incompatible units out of one shared numeric scale |
| Testimony or dialogue | The actual speaker, exact quotation and its context or explicit fictional status | Quote or speech treatments only when there is real quotation/dialogue content |

Use the System/Skill's current 13/8 preferred Contents pool, native tables/charts, independent Diagrams and Base elements as eligible choices, not quotas. The purpose is to give the Slide author usable meaning, not to preselect a decorative wrapper. A set of abstract nouns is not a complete process. Three reasons do not become a funnel; equal petals do not establish measured market shares.

### Write separable, economical audience copy

Keep the first text unit as the headline. Put each supporting item or data record in a separate subsequent text unit, with its short meaningful label and explanation together. For a comparison, repeat the same criteria across records; for a sequence, give each stage its action or output. This prepares editable components without new fields or parser conventions. Avoid a single paragraph containing the whole page, pipe tables, nested pseudo-components, and unpaired numbers. In this editor, line breaks alone do not create separate items.

Budget the headline, primary visual, details, labels and necessary qualifications together on a fixed 16:9 page. Medium density needs a clear main structure with concise supporting detail; it does not mean every page has the same three bullets. Image-led pages usually need less copy; evidence tables may need more. Shorten repeated or vague wording before confirmation, preserve required facts and exact quotations, and use the requested page range intelligently. Do not expect the Slide stage to rescue overcrowding with tiny type or omitted caveats. Do not repeat the same data in a paragraph, a chart and a table unless each serves a different question.

For example, replace a generic heading such as "Follow-up workflow" with a proposed message such as "Route each qualified lead to an owner before follow-up begins". Support it with separate, concrete records: "Qualify: record the need and permission to follow up."; "Assign: name an owner and the next contact date."; "Review: record the outcome and return unresolved leads for reassignment." This example illustrates recoverable meaning, not a required process or three-item template.

### Plan images and page rhythm with the content

Decide whether a page needs a subject image, explanatory scene, atmospheric treatment, decorative surface or native evidence composition before prose fills its space. Plan useful interior imagery as well as the opening. A generic ornament does not substitute for a needed product or scenario image; a quantitative page need not add a distracting photograph. Use generateimg and the existing visual_plan to make image intentions executable, reserving native text/data space and suitable crops. Do not ask an image model to paint the chart, table or final slide copy.

Review the preceding two pages' dominant expression and silhouette. Avoid repeatedly planning title-plus-three-cards, even when their names, icons or colors differ; vary information shape where the story supports it. Preserve the same encoding when a real side-by-side or sequential comparison needs continuity. Do not impose the same cards/process/chart/timeline skeleton across unrelated decks.

Keep this planning internal: no component names, relationship tags, layout instructions or invented metadata in audience text. visual_plan remains the image manifest defined below; it is not a new narrative/component-plan channel. Actual Slide syntax is chosen later from the confirmed content.

Before saving, check: the requested task and page count; the headline progression; concrete and distinct supporting records; complete relationship inputs; the provenance/status and consistency of claims; readable content/visual allocation; useful image plans; and justified changes of expression. Repair actual defects. A saved outline is not a rendered or visually approved deck.

## Structure

- Optional `title=...` before the first page: single-line document name, <=300 UTF-8 bytes. For multiline titles, use `# title` followed by its body instead. Missing, blank or overlong titles derive from the first visible text, truncated to 300 bytes at a Unicode boundary; image-only outlines use `Untitled presentation`. Visible page headings need text units too.
- Repeat exact `# page` for each page; `## text` starts a text unit. Same-level headings start siblings; the next `# page` starts the next page. Bodies display as plain text, not rendered Markdown tables. Put each supporting point or data record in its own `## text`; write comparisons as readable records, e.g. `Gross margin: current 34%; 12-month target 42%.`, not pipe tables or separator rows. Preserve explicitly supplied wording. Use a native table/chart when authoring the Slide later. Blank lines create no pages/units. Each page needs nonblank text or an image plan. No Slide components, layout/theme fields or `<...>` collections.
- Start each page with a `## text` containing only its one-line page headline. The editor displays this first text unit as the title; subsequent text units form the description. Put subtitles, explanations, bullets, data and sources in a second or later `## text`, preserving their line breaks. These are audience-facing words, not internal layout instructions. Never combine the headline and description in one unit: a newline does not separate fields. A title-only page may omit later text units.
- `title=...` before the first page names the document, not a page. Inside `## text`, write the actual text directly; do not use `title=...`, `text=...` or a `body` child to label fields.
- Bodies are literal Unicode text; outer whitespace is trimmed. Prefix a structural heading, ASCII `key=value` line, or backtick/tilde fence line with `\` to keep it literal: `\# page`, `\target=100`. Alternatively fence a literal body with >=3 backticks, using more than any backtick run inside; delimiters are not content. Other text needs no JSON escaping. Attribute values are unquoted; do not duplicate fields.

## Images

For a multi-page direct-author tool call, put `visual_plan` beside `markdown` in tool JSON, never in audience copy. Its `pages` array has one entry per page in order: `page_number`, `role=subject|atmosphere|surface|native`, a specific `reason`, and optional `source_page` for image reuse. Every image role must point to a page with a real generateimg node or authorized image reference; omit source_page to use its own page. Native pages have no image source. `native_interior_reason` is only for an explicit no-image request or a deliberately evidence-only brief. Do not leave all interior images for a follow-up request. The backend checks plan/source consistency and that planned images appear in the delivered Slide pages. A new tool plan does not generate images itself or bypass Outline confirmation.

- `## generateimg` plans one image. Optional settings, one per line, precede one nonempty description, written directly or under `### prompt`, never both.
- `removeBackground=true|false` (default false): false retains the generated background; true removes it. The host adds green-screen requirements; never add them yourself.
- `ratio=1:1|4:3|3:4|4:5|16:9|9:16` (default 16:9). Omit default settings. No type/imageType/width/height/count/tool arguments.
- If the planned visual needs a new photograph/illustration, include its generateimg node now; mentioning an image in text does not generate it. Write an English art-direction prompt: subject, role, placement, crop, palette/light and quiet text region if a background. Keep slide copy and factual charts out of generated pixels. Put plans beside related text; separate nodes for separate images.
- Plan the distinct assets that the story actually needs, including useful inner-page imagery rather than only a cover. Subject photographs, atmospheric scenes and decorative page surfaces are different valid roles; select from the System/Skill's composition guidance, not a fixed asset or page-coverage quota. Each generateimg creates one asset; do not duplicate it just for reuse. After confirmation, reuse exact returned references with purposeful crops and leave dense evidence pages room when appropriate. Icons/charts do not replace a needed photograph or illustration. Keep required facts and explicit user restrictions; do not put internal design directions in visible text units.
- Save/preview stores plans; authorized confirmation generates images. Slides use actual returned assets. Author plans with `## generateimg`, never legacy markers, invented assets or unauthorized URLs. Put an existing project-authorized image's exact reference alone in a `## text` unit; no Markdown link or regeneration.
- Saved state/ReadOutline may expose `GENRATEIMG[type=content|decorative,ratio=...](prompt)`: valid internal storage, not visible copy or a failed write. `content` preserves `removeBackground=true`; `decorative` preserves false. Do not replace a correct outline just to change its serialization.

## Limits

1..100 pages; 1..100 units/page; 8,000 UTF-8 bytes/compiled unit, including image-marker overhead; 16 new image plans; 256 asset-reference placements; 1 MiB compiled JSON; 2 MiB Markdown source. Bytes are not tokens. Preserve required content when fixing limits. Unknown fields/nodes may be ignored; invalid ratio defaults, invalid removeBackground fails. Use exact names/values; fallbacks never supply missing content.

Before saving, count exact `# page` headings against the requested total. Each direct child is `## text` or `## generateimg`; never `## metric-summary`, `## line-chart` or another Slide component. Translate planned charts/diagrams into readable text records, preserving every supplied value. A successful save does not prove that unsupported nodes survived. Keep the headline alone in the first text unit and verify the receipt's page count.

## Example

The fence below is illustrative, not an output wrapper. Its demonstration numbers are fictional and visibly labeled; they are not facts to reuse in a user's outline.

```markdown
title=Recovery review
# page
## text
Collection results
## text
In this illustrative example, collection volume increased across both reporting months.
## text
April: 120 kg; May: 150 kg (illustrative figures).
## generateimg
removeBackground=true
ratio=4:3
A complete reusable collection bin, isolated subject.
# page
## text
Next steps
## text
Keep reusable bins at the collection points.
## text
Review collection volume at the next monthly meeting.
```
