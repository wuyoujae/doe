use super::{
    operations::{apply, Edit},
    Snapshot,
};

use serde_json::{json, Value};
#[path = "page/mod.rs"]
mod function_page;
 use function_page::page;

#[path = "edit-changes-only-the-named-field-and-preserves-original/mod.rs"]
mod function_edit_changes_only_the_named_field_and_preserves_original;

#[path = "editing-cannot-change-identity-or-escape-the-target/mod.rs"]
mod function_editing_cannot_change_identity_or_escape_the_target;

#[path = "sequential-operations-are-atomic-on-missing-nodes/mod.rs"]
mod function_sequential_operations_are_atomic_on_missing_nodes;

#[path = "snapshot-fence-ignores-other-pages-revision-and-tracks-theme-and-content/mod.rs"]
mod function_snapshot_fence_ignores_other_pages_revision_and_tracks_theme_and_content;

#[path = "insert-replace-and-remove-preserve-sibling-order/mod.rs"]
mod function_insert_replace_and_remove_preserve_sibling_order;

#[path = "rejected-arguments-and-candidates-return-actionable-validation-errors/mod.rs"]
mod function_rejected_arguments_and_candidates_return_actionable_validation_errors;

#[path = "validation-preserves-legacy-fields-but-checks-changed-content-and-identity/mod.rs"]
mod function_validation_preserves_legacy_fields_but_checks_changed_content_and_identity;

