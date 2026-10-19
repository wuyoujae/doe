use super::{ApiError, StateData};
use crate::exports::{self, CreateExport, Format};
use axum::{
    Json, Router,
    extract::{Path, State, rejection::JsonRejection},
    http::{HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};

pub(super) fn routes() -> Router<StateData> {
    Router::new()
        .route("/api/v1/projects/{id}/exports/{format}", post(create))
        .route("/api/v1/exports/{id}", get(read).delete(cancel))
        .route("/api/v1/exports/{id}/download", get(download))
}
async fn create(
    State(state): State<StateData>,
    Path((id, format)): Path<(String, String)>,
    body: Result<Json<CreateExport>, JsonRejection>,
) -> Result<Response, ApiError> {
    let format = match format.as_str() {
        "pdf" => Format::Pdf,
        "pptx" => Format::Pptx,
        _ => {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "unsupported_export_format",
                "Only PDF and PPTX exports are supported",
            ));
        }
    };
    let Json(input) = body.map_err(|_| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            "invalid_export_request",
            "A saved source revision is required",
        )
    })?;
    let repository = state.exports.repository.clone();
    let job = blocking(move || repository.create(&id, format, &input)).await?;
    Ok((StatusCode::ACCEPTED, Json(job)).into_response())
}
async fn read(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Json<exports::Job>, ApiError> {
    let repository = state.exports.repository.clone();
    Ok(Json(blocking(move || repository.read(&id)).await?))
}
async fn cancel(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Json<exports::Job>, ApiError> {
    let repository = state.exports.repository.clone();
    Ok(Json(blocking(move || repository.cancel(&id)).await?))
}
async fn download(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Response, ApiError> {
    let repository = state.exports.repository.clone();
    let (job, bytes) = blocking(move || repository.download(&id)).await?;
    let mut response = bytes.into_response();
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static(job.format.mime()),
    );
    response.headers_mut().insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!("attachment; filename=\"{}\"", job.file_name))
            .map_err(|_| ApiError::storage())?,
    );
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-store"),
    );
    Ok(response)
}
async fn blocking<T: Send + 'static>(
    task: impl FnOnce() -> Result<T, exports::Error> + Send + 'static,
) -> Result<T, ApiError> {
    tokio::task::spawn_blocking(task)
        .await
        .map_err(|_| ApiError::storage())?
        .map_err(|error| match error {
            exports::Error::NotFound => ApiError::new(
                StatusCode::NOT_FOUND,
                "export_not_found",
                "The export was not found",
            ),
            exports::Error::Conflict => ApiError::new(
                StatusCode::CONFLICT,
                "schema_revision_conflict",
                "The presentation changed or the export is not ready; save and retry",
            ),
            exports::Error::Invalid(message) => {
                ApiError::new(StatusCode::BAD_REQUEST, "invalid_export", message)
            }
            exports::Error::Runtime(code) => ApiError::new(
                StatusCode::BAD_GATEWAY,
                code,
                "The export artifact is unavailable; retry the export",
            ),
            exports::Error::Storage(_) => ApiError::storage(),
        })
}
