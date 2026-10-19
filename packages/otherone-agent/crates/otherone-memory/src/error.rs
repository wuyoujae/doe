use thiserror::Error;

#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum MemoryError {
    #[error("memory point field '{field}' cannot be empty")]
    EmptyField { field: &'static str },

    #[error("memory point not found: {point_id}")]
    PointNotFound { point_id: String },

    #[error("memory point parent not found: {parent_id}")]
    ParentNotFound { parent_id: String },

    #[error("memory point already exists: {point_id}")]
    DuplicatePoint { point_id: String },

    #[error("IO error: {0}")]
    IoError(String),

    #[error("JSON error: {0}")]
    JsonError(String),

    #[error("headless point cannot be modified: {operation}")]
    HeadlessModification { operation: &'static str },

    #[error("headless point cannot be inserted into an existing tree")]
    CannotInsertHeadless,

    #[error("non-headless point must have a parent")]
    MissingParent,

    #[error("headless point must not have storage, types, or parent")]
    InvalidHeadlessPoint,

    #[error("memory tree cycle detected when attaching '{point_id}' under '{parent_id}'")]
    CycleDetected { point_id: String, parent_id: String },

    #[error("invalid point kind for '{point_id}': expected {expected}")]
    InvalidPointKind {
        point_id: String,
        expected: &'static str,
    },

    #[error("memory tree invariant failed: {message}")]
    TreeInvariant { message: String },
}
