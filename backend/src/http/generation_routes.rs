use super::{ApiError, StateData};
use crate::{assets, projects};
use axum::{
    Json, Router,
    body::Bytes,
    extract::{DefaultBodyLimit, Path, Query, State, rejection::JsonRejection},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post, put},
};
use serde::Deserialize;
use serde_json::{Value, json};

pub(super) fn routes() -> Router<StateData> {
    Router::new()
        .route("/api/v1/projects", get(list).post(create))
        .route("/api/v1/projects/{id}", get(read))
        .route(
            "/api/v1/projects/{id}/actions",
            post(action).layer(DefaultBodyLimit::max(3 * 1024 * 1024)),
        )
        .route(
            "/api/v1/projects/{id}/deck",
            put(save_deck).layer(DefaultBodyLimit::max(projects::MAX_DECK_BYTES + 1024)),
        )
        .route(
            "/api/v1/projects/{id}/outline",
            put(save_outline).layer(DefaultBodyLimit::max(3 * 1024 * 1024)),
        )
        .route(
            "/api/v1/projects/{id}/assets",
            get(list_assets)
                .post(upload)
                .layer(DefaultBodyLimit::max(assets::MAX_IMAGE_BYTES)),
        )
        .route("/api/v1/projects/{id}/assets/{asset}", get(read_asset))
        .route(
            "/api/v1/projects/{id}/image-jobs",
            get(list_jobs).post(generate_image),
        )
}
async fn list(State(state): State<StateData>) -> Result<Json<Value>, ApiError> {
    let rows = blocking(move || state.projects.list()).await?;
    Ok(Json(json!({"projects":rows})))
}
async fn read(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Json<projects::ProjectSnapshot>, ApiError> {
    Ok(Json(blocking(move || state.projects.read(&id)).await?))
}
async fn create(
    State(state): State<StateData>,
    body: Result<Json<projects::CreateProject>, JsonRejection>,
) -> Result<Json<projects::ProjectSnapshot>, ApiError> {
    let Json(request) = body.map_err(payload)?;
    let repository = state.projects.clone();
    let result = blocking(move || repository.create(request)).await?;
    if let Some(launch) = result.launch {
        state.runner.spawn(launch);
    }
    Ok(Json(result.snapshot))
}
async fn action(
    State(state): State<StateData>,
    Path(id): Path<String>,
    body: Result<Json<projects::ProjectAction>, JsonRejection>,
) -> Result<Json<projects::ProjectSnapshot>, ApiError> {
    let Json(request) = body.map_err(payload)?;
    let repository = state.projects.clone();
    let result = blocking(move || repository.action(&id, request)).await?;
    if let Some(run) = result.cancelled_run {
        state.runner.cancel(&run);
    }
    if let Some(launch) = result.launch {
        state.runner.spawn(launch);
    }
    Ok(Json(result.snapshot))
}
async fn save_deck(
    State(state): State<StateData>,
    Path(id): Path<String>,
    body: Result<Json<projects::SaveDeck>, JsonRejection>,
) -> Result<Json<projects::SessionSchemaDeck>, ApiError> {
    let Json(request) = body.map_err(payload)?;
    Ok(Json(
        blocking(move || state.projects.save_deck(&id, request)).await?,
    ))
}
async fn save_outline(
    State(state): State<StateData>,
    Path(id): Path<String>,
    body: Result<Json<projects::SaveOutline>, JsonRejection>,
) -> Result<Json<projects::ProjectSnapshot>, ApiError> {
    let Json(request) = body.map_err(payload)?;
    Ok(Json(
        blocking(move || state.projects.save_outline(&id, request)).await?,
    ))
}
async fn list_assets(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Json<Value>, ApiError> {
    let images = blocking(move || state.assets.list(&id)).await?;
    Ok(Json(json!({"images":images,"nextCursor":null})))
}
async fn list_jobs(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Json<Value>, ApiError> {
    let jobs = blocking(move || state.assets.list_jobs(&id)).await?;
    Ok(Json(json!({"jobs":jobs})))
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct UploadQuery {
    request_id: String,
}
async fn upload(
    State(state): State<StateData>,
    Path(id): Path<String>,
    Query(query): Query<UploadQuery>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<assets::ImageJob>, ApiError> {
    let mime = headers
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("");
    if !["image/png", "image/jpeg", "image/webp"].contains(&mime) {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "invalid_image",
            "Only PNG, JPEG and WebP uploads are supported",
        ));
    }
    Ok(Json(
        blocking(move || state.assets.store(&id, &query.request_id, &body, "upload")).await?,
    ))
}
async fn read_asset(
    State(state): State<StateData>,
    Path((id, asset)): Path<(String, String)>,
) -> Result<Response, ApiError> {
    let result = blocking(move || state.assets.read(&id, &asset)).await?;
    let mut response = result.bytes.into_response();
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(&result.mime).map_err(|_| ApiError::storage())?,
    );
    response.headers_mut().insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_static("inline"),
    );
    Ok(response)
}
async fn generate_image(
    State(state): State<StateData>,
    Path(id): Path<String>,
    body: Result<Json<assets::GenerateInput>, JsonRejection>,
) -> Result<Json<assets::ImageJob>, ApiError> {
    let Json(request) = body.map_err(payload)?;
    Ok(Json(state.runner.generate_image(id, request).await?))
}
fn payload(error: JsonRejection) -> ApiError {
    ApiError::new(
        if error.status() == StatusCode::PAYLOAD_TOO_LARGE {
            StatusCode::PAYLOAD_TOO_LARGE
        } else {
            StatusCode::BAD_REQUEST
        },
        "invalid_request",
        "Invalid or oversized project payload",
    )
}
async fn blocking<T: Send + 'static>(
    operation: impl FnOnce() -> Result<T, projects::Error> + Send + 'static,
) -> Result<T, ApiError> {
    tokio::task::spawn_blocking(operation)
        .await
        .map_err(|_| ApiError::storage())?
        .map_err(Into::into)
}

impl From<projects::Error> for ApiError {
    fn from(error: projects::Error) -> Self {
        match error {
            projects::Error::NotFound => Self::new(
                StatusCode::NOT_FOUND,
                "project_not_found",
                "The project or asset does not exist",
            ),
            projects::Error::Conflict => Self::new(
                StatusCode::CONFLICT,
                "conflict",
                "The document changed; reload before continuing",
            ),
            projects::Error::Busy => Self::new(
                StatusCode::CONFLICT,
                "generation_busy",
                "Generation is already active; wait or cancel it first",
            ),
            projects::Error::Inactive => Self::new(
                StatusCode::CONFLICT,
                "generation_inactive",
                "This generation is no longer active",
            ),
            projects::Error::Idempotency => Self::new(
                StatusCode::CONFLICT,
                "request_id_conflict",
                "The request identifier was already used for a different payload",
            ),
            projects::Error::Invalid(message) => {
                Self::new(StatusCode::BAD_REQUEST, "invalid_request", message)
            }
            projects::Error::Storage(_) => Self::storage(),
        }
    }
}
