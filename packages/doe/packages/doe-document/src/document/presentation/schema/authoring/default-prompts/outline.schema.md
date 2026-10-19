<outline-schema>
DOE Outline V2.1 authoring uses a small Markdown tree, compiled deterministically by the platform. This contract supersedes older JSON authoring instructions. Return the complete resulting outline for create, replace and edit.

Syntax:
- Optional title=... names the deck. When omitted or invalid, the platform uses the first visible text (within 300 UTF-8 bytes).
- # page starts a page. Repeat in presentation order. The platform generates IDs, page numbers and total count. Do not output operation, expected_revision, index, page_count, size, editor, layout, theme or version. Operation and revision are bound to the trusted task; the author cannot choose them.
- ## text starts one audience-facing text unit. Start every page with a unit containing only its one-line headline: the editor displays the first text unit as the title and subsequent text units as the description. Put subtitles, labels, explanations, bullets, data and sources in a second or later ## text, preserving their line breaks. Never combine the headline and description in one unit; a newline does not separate fields. A title-only page may omit later units. Write actual text directly, not title=..., text=... or a body child. Literal quotes, punctuation and Unicode need no JSON escaping.
- ## generateimg starts one deferred image plan. Put optional removeBackground=true|false and ratio=... on their own lines, then the actual image description. Omitted settings use defaults; invalid removeBackground is rejected; unknown settings are ignored. Do not repeat defaults.
- A line starting with # plus space is structural. An ASCII key=value line is an attribute. To preserve such text literally, prefix that line with one backslash, or enclose the text in a local code fence. Use a longer fence if the text itself contains fences. Never wrap the entire response in a fence or add explanatory prose.
- For a multi-line literal image description, a ### prompt child with a local literal fence is also accepted. Text is not HTML or rich-text markup.

generateimg:
- When a direct-author tool exposes visual_plan, supply its separate page-by-page JSON manifest for multi-page Outlines. Plan interior subject, atmosphere or decorative images now, pair each with a real generateimg node or authorized reusable reference, and explain intentional native evidence pages. The manifest is not audience copy and does not replace generateimg or confirmation.
- removeBackground is a boolean, default false. true requests a transparent cutout: the shared image service appends green-screen requirements and removes the background after generation. false retains the image background and adds no constraints. Do not author type or imageType; historical type values are accepted only for compatibility. An explicit removeBackground takes precedence over legacy type.
- ratio defaults to 16:9. Allowed ratios: 1:1, 4:3, 3:4, 4:5, 16:9, 9:16. Choose according to subject geometry and placement; portrait side scenes usually need an explicit ratio.
- The description is required real content, with no invented fallback. Describe subject, view/action, composition and palette. The description is the actual image prompt; no fixed visual style is injected. Choose style from the user brief. Do not add green-screen instructions yourself; use removeBackground=true when needed. If intended behind text, explicitly reserve a plain text area.
- Put each image node immediately after the text it illustrates. Consistent framing/style across an item set belongs in each brief. No binding IDs, URLs, asset hashes, page layouts or component commands need to be generated.
- Parse, validation, automatic defaulting, streaming preview and saving only store image plans. Authorized confirmation starts image materialization and billing. The platform replaces each plan with an actual authorized asset reference before Slide generation. Never claim an unexecuted plan is an existing image.
- Existing authorized asset references belong in their own text unit and remain byte-for-byte unchanged. Never reconstruct a hash or change existing asset metadata.

Limits: 1-100 pages, 1-100 nonblank units per page, 8,000 UTF-8 bytes per compiled unit (including an internal image marker), 16 new image plans per deck, 256 uploaded-asset placements, 1 MiB compiled outline and 2 MiB response. Empty pages, missing image descriptions and exceeded resource limits require correction; never invent or drop real content to pass. Invalid removeBackground must be corrected to true or false; other optional settings follow their documented defaulting rules.

Example (substitute actual task content):
```markdown
title=Equipment overview

# page
## text
Response equipment
## text
The crew checks the vehicle before departure.
## generateimg
removeBackground=true
ratio=4:3
A complete fire engine in front three-quarter view, red and gray palette, no text.

# page
## text
Operating context
## text
The crew coordinates the response.
## generateimg
ratio=9:16
A fire engine and crew in a vertical urban street scene, crop-safe composition, red and blue palette, no text.
```
</outline-schema>
