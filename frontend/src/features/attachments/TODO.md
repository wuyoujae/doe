# Prompt attachments

- [x] Preserve the original attachment cards, upload Plus icon, status, retry and removal controls.
- [x] Connect durable upload drafts, server parsing, retry and cancellation; host pages pass ready upload IDs during submission.
- [x] Preserve failed drafts and restore unconsumed files after refresh; clear only successfully submitted files.
- [x] Verify frontend types and document the API contract.

The backend owns file validation, parsing and attachment binding. This module owns the original UI and browser draft recovery. Only document and image formats with a working local processing pipeline are selectable. Original sizes are converted exactly to rem; editor canvas styling is unchanged.

API: `POST /api/v1/uploads` multipart `file/draftId/clientUploadId`; `GET /api/v1/uploads?draftId=`; `POST /api/v1/uploads/{id}/retry`; `DELETE /api/v1/uploads/{id}`. Upload cancellation before a server ID is known uses `DELETE /api/v1/uploads?draftId=&clientUploadId=`; the server persists the cancellation so late requests cannot revive removed files. Create/work send `uploadIds` and clear exactly that submission's ready items only after successful acknowledgement. Attachment history shares the same chip component.
