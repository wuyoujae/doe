# Original DOE outline migration

- [x] Extract the original V1 view, helpers, drag/edit/delete behavior and damped scrolling.
- [x] Preserve original outline, toolbar, regenerate dialog, responsive styles and stage animations.
- [x] Remove commercial generation-limit controls and dependencies.
- [x] Retain stable server page IDs when saving or reordering.
- [x] Preserve dirty drafts across polling and own-save acknowledgements; external changes require explicit reload.
- [ ] Integrate the parent Work controller with local outline persistence, confirmation and revision APIs.
- [ ] Verify the complete desktop/mobile flow after integration.

Source in the original repository: `app/frontend/src/components/WorkPreviewPanel.tsx` (V1 `WorkOutlinePreview`), `components/WorkPreviewPanel.css`, and `features/work/layout.css`. The pure view retains `onSave(cards, expectedRevision)` and `saveNow()` so Work can flush edits before confirmation or revision. `SessionOutlineRecord.revision` is supplied by the local adapter; no commercial account, payment or session APIs are copied. `original-layout.css` must be imported after the shared Work styles. A dirty draft is preserved on external document changes and autosave stops; the parent offers explicit reload/remount. Resolve uncertain saves against the exact submitted document in the adapter before reporting success. Rollback removes this isolated view and its Work-controller imports; project data is unaffected.
