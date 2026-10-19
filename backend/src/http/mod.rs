use crate::doe;
use crate::{assets, generation, projects};
mod attachment_routes;
mod browser_snapshot_routes;
mod conversation_routes;
mod export_routes;
mod generation_routes;
mod playback_routes;
use crate::models::{Repository, SaveSettings, SettingsSnapshot, StorageError};
use axum::{
    Json, Router,
    body::Body,
    extract::{DefaultBodyLimit, Request, State, rejection::JsonRejection},
    http::{HeaderValue, StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::Serialize;
use std::sync::Arc;

#[derive(Clone)]
struct StateData {
    repository: Arc<Repository>,
    doe_repository: Arc<doe::Repository>,
    projects: Arc<projects::Repository>,
    assets: Arc<assets::Repository>,
    attachments: Arc<crate::attachments::Repository>,
    exports: Arc<crate::exports::Service>,
    playback: Arc<crate::playback::Service>,
    runner: Arc<generation::Runner>,
    origins: Vec<String>,
    hosts: Vec<String>,
}

pub fn router(
    repository: Arc<Repository>,
    doe_repository: Arc<doe::Repository>,
    projects: Arc<projects::Repository>,
    assets: Arc<assets::Repository>,
    runner: Arc<generation::Runner>,
    attachments: Arc<crate::attachments::Repository>,
    exports: Arc<crate::exports::Service>,
    playback: Arc<crate::playback::Service>,
    origins: Vec<String>,
    hosts: Vec<String>,
) -> Router {
    let state = StateData {
        repository,
        doe_repository,
        projects,
        assets,
        attachments,
        exports,
        playback,
        runner,
        origins,
        hosts,
    };
    Router::new()
        .merge(generation_routes::routes())
        .merge(conversation_routes::routes())
        .merge(attachment_routes::routes())
        .merge(browser_snapshot_routes::routes())
        .merge(export_routes::routes())
        .merge(playback_routes::routes())
        .route(
            "/api/v1/health",
            get(|| async { Json(serde_json::json!({"status":"ok"})) }),
        )
        .route("/api/v1/model-settings", get(read).put(save))
        .route(
            "/api/v1/doe-settings",
            get(read_doe)
                .put(save_doe)
                .layer(DefaultBodyLimit::max(doe::MAX_BODY_BYTES)),
        )
        .route(
            "/api/v1/doe/compile",
            post(compile_doe).layer(DefaultBodyLimit::max(doe::MAX_BODY_BYTES)),
        )
        .fallback(|| async {
            ApiError::new(StatusCode::NOT_FOUND, "not_found", "Unknown API route").into_response()
        })
        .layer(DefaultBodyLimit::max(64 * 1024))
        .layer(middleware::from_fn_with_state(state.clone(), boundary))
        .with_state(state)
}

async fn read_doe(State(state): State<StateData>) -> Result<Json<doe::SettingsSnapshot>, ApiError> {
    let result = tokio::task::spawn_blocking(move || state.doe_repository.read())
        .await
        .map_err(|_| ApiError::storage())??;
    Ok(Json(result))
}

async fn save_doe(
    State(state): State<StateData>,
    body: Result<Json<doe::SaveSettings>, JsonRejection>,
) -> Result<Json<doe::SettingsSnapshot>, ApiError> {
    let Json(request) = body.map_err(|rejection| {
        ApiError::new(
            if rejection.status() == StatusCode::PAYLOAD_TOO_LARGE {
                StatusCode::PAYLOAD_TOO_LARGE
            } else {
                StatusCode::BAD_REQUEST
            },
            "invalid_settings",
            "Invalid or oversized DOE settings payload",
        )
    })?;
    let result = tokio::task::spawn_blocking(move || state.doe_repository.save(request))
        .await
        .map_err(|_| ApiError::storage())??;
    Ok(Json(result))
}

async fn compile_doe(
    body: Result<Json<doe::compiler::CompileRequest>, JsonRejection>,
) -> Result<Response, ApiError> {
    let Json(request) = body.map_err(|rejection| {
        ApiError::new(
            if rejection.status() == StatusCode::PAYLOAD_TOO_LARGE {
                StatusCode::PAYLOAD_TOO_LARGE
            } else {
                StatusCode::BAD_REQUEST
            },
            "invalid_document",
            "Invalid or oversized DOE compile payload",
        )
    })?;
    let result = tokio::task::spawn_blocking(move || doe::compiler::compile(request))
        .await
        .map_err(|_| ApiError::storage())?;
    Ok((
        if result.valid {
            StatusCode::OK
        } else {
            StatusCode::UNPROCESSABLE_ENTITY
        },
        Json(result),
    )
        .into_response())
}

async fn read(State(state): State<StateData>) -> Result<Json<SettingsSnapshot>, ApiError> {
    let result = tokio::task::spawn_blocking(move || state.repository.read())
        .await
        .map_err(|_| ApiError::storage())??;
    Ok(Json(result))
}

async fn save(
    State(state): State<StateData>,
    body: Result<Json<SaveSettings>, JsonRejection>,
) -> Result<Json<SettingsSnapshot>, ApiError> {
    let Json(request) = body.map_err(|rejection| {
        if rejection.status() == StatusCode::PAYLOAD_TOO_LARGE {
            ApiError::new(
                StatusCode::PAYLOAD_TOO_LARGE,
                "invalid_settings",
                "Model settings request is too large",
            )
        } else {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                "invalid_settings",
                "Invalid model settings payload or unknown field",
            )
        }
    })?;
    let result = tokio::task::spawn_blocking(move || state.repository.save(request))
        .await
        .map_err(|_| ApiError::storage())??;
    Ok(Json(result))
}

async fn boundary(State(state): State<StateData>, request: Request<Body>, next: Next) -> Response {
    let host = request
        .headers()
        .get(header::HOST)
        .and_then(|header| header.to_str().ok());
    let origin = request.headers().get(header::ORIGIN);
    let site = request
        .headers()
        .get("sec-fetch-site")
        .and_then(|header| header.to_str().ok());
    let denied = !host.is_some_and(|host| state.hosts.iter().any(|allowed| allowed == host))
        || origin.is_some_and(|origin| {
            !origin
                .to_str()
                .ok()
                .is_some_and(|origin| state.origins.iter().any(|allowed| allowed == origin))
        })
        || site == Some("cross-site");
    let mut response = if denied {
        ApiError::new(
            StatusCode::FORBIDDEN,
            "forbidden_origin",
            "This local API only accepts requests from the configured application",
        )
        .into_response()
    } else {
        next.run(request).await
    };
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response.headers_mut().insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    response
}

#[derive(Serialize)]
struct ErrorBody {
    error: ErrorDetails,
}
#[derive(Serialize)]
struct ErrorDetails {
    code: &'static str,
    message: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    field: Option<String>,
}
struct ApiError {
    status: StatusCode,
    details: ErrorDetails,
}
impl ApiError {
    fn new(status: StatusCode, code: &'static str, message: &'static str) -> Self {
        Self {
            status,
            details: ErrorDetails {
                code,
                message,
                field: None,
            },
        }
    }
    fn storage() -> Self {
        Self::new(
            StatusCode::SERVICE_UNAVAILABLE,
            "storage_unavailable",
            "Settings could not be saved or loaded",
        )
    }
}
impl From<doe::SettingsError> for ApiError {
    fn from(error: doe::SettingsError) -> Self {
        match error {
            doe::SettingsError::Validation { field, message } => Self {
                status: StatusCode::BAD_REQUEST,
                details: ErrorDetails {
                    code: "invalid_settings",
                    message,
                    field: Some(field),
                },
            },
            doe::SettingsError::Conflict => Self::new(
                StatusCode::CONFLICT,
                "conflict",
                "The settings changed; reload before saving",
            ),
            doe::SettingsError::Storage(error) => {
                eprintln!("DOE settings storage error: {error}");
                Self::storage()
            }
        }
    }
}
impl From<StorageError> for ApiError {
    fn from(error: StorageError) -> Self {
        match error {
            StorageError::Validation(error) => Self {
                status: StatusCode::BAD_REQUEST,
                details: ErrorDetails {
                    code: "invalid_settings",
                    message: error.message,
                    field: Some(error.field),
                },
            },
            StorageError::Conflict => Self::new(
                StatusCode::CONFLICT,
                "conflict",
                "The settings changed; reload before saving",
            ),
            StorageError::Storage(error) => {
                eprintln!("Model settings storage error: {error}");
                Self::storage()
            }
        }
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ErrorBody {
                error: self.details,
            }),
        )
            .into_response()
    }
}
