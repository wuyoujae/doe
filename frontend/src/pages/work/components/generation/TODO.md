# Original DOE questions and generation status

- [x] Extract commercial `features/work/questions/DoeQuestionsCard.tsx`, preserving DOM, interaction and draft recovery.
- [x] Copy its `questions.css` and the original `components/LoadingState.tsx` without visual changes.
- [x] Extract original loading styles, shimmer keyframes and all nine question translations; convert loading CSS pixels exactly to rem at 16 px/rem.
- [x] Adapt the commercial message submission boundary to `{ id, answer }[]`; use plain props and project/request identity.
- [x] Extract the original outline regeneration dialog, preserving its DOM/CSS and 160 ms close animation; protect pending submissions and restore keyboard focus.
- [x] Validate TypeScript (`npm run check --workspace @yrkie/frontend`).
- [ ] Complete visual integration in the owning Work page.

## Decisions

The open-source host owns API requests and busy/error state. This module owns only the original question form and loading presentation. Failed submissions preserve the draft. A project/request/question fingerprint isolates restored answers. Upload controls appear only when an uploader callback exists. `GeneratingIndicator` retains the original Dots animation and 60-second label rotation; the optional status label is screen-reader text, not a new layout.

Source in the original repository: `app/frontend/src/features/work/questions/`, `components/LoadingState.tsx`, the `GeneratingIndicator` in `components/MessagePanel.tsx`, and loading rules in `features/work/messages.css`. The original Work shell supplies shared typography and design variables. Removing this module and its caller imports rolls back the extraction; no backend or data migration is involved.
