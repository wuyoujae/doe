use super::{ApiError, StateData};
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, State, rejection::JsonRejection},
    routing::post,
};

pub(super) fn routes() -> Router<StateData> {
    Router::new().route(
        "/api/v1/browser-document-snapshots",
        post(create).layer(DefaultBodyLimit::max(100 * 1024 * 1024)),
    )
}
async fn create(
    State(state): State<StateData>,
    body: Result<Json<crate::projects::BrowserSnapshotInput>, JsonRejection>,
) -> Result<Json<crate::projects::BrowserSnapshot>, ApiError> {
    let Json(request) = body.map_err(|_| {
        ApiError::new(
            axum::http::StatusCode::BAD_REQUEST,
            "invalid_document_snapshot",
            "Invalid or oversized browser document snapshot",
        )
    })?;
    Ok(Json(
        tokio::task::spawn_blocking(move || {
            state.projects.browser_snapshot(request, &state.assets)
        })
        .await
        .map_err(|_| ApiError::storage())??,
    ))
}
