use super::StateData;
use crate::attachments::{self, Error, UploadRecord};
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Multipart, Path, Query, State},
    http::{HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::Deserialize;
use serde_json::{Value, json};

pub(super) fn routes() -> Router<StateData> {
    Router::new()
        .route(
            "/api/v1/uploads",
            get(list)
                .post(upload)
                .delete(cancel)
                .layer(DefaultBodyLimit::max(
                    attachments::MAX_FILE_BYTES + 16 * 1024,
                )),
        )
        .route("/api/v1/uploads/{id}", get(read).delete(delete))
        .route("/api/v1/uploads/{id}/retry", post(retry))
        .route("/api/v1/uploads/{id}/content", get(read_document))
        .route("/api/v1/uploads/{id}/file", get(read_file))
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ListQuery {
    draft_id: Option<String>,
    project_id: Option<String>,
}
async fn list(
    State(state): State<StateData>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Value>, AttachmentError> {
    let uploads = match (q.draft_id, q.project_id) {
        (Some(draft), None) => blocking(move || state.attachments.list(&draft)).await?,
        (None, Some(project)) => {
            blocking(move || state.attachments.list_for_project(&project)).await?
        }
        _ => {
            return Err(Error::validation(
                "invalid_upload_request",
                "Provide exactly one draftId or projectId.",
            )
            .into());
        }
    };
    Ok(Json(json!({"uploads":uploads})))
}
async fn read(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Json<UploadRecord>, AttachmentError> {
    Ok(Json(blocking(move || state.attachments.get(&id)).await?))
}
async fn upload(
    State(state): State<StateData>,
    mut multipart: Multipart,
) -> Result<Json<UploadRecord>, AttachmentError> {
    let mut draft = None;
    let mut client = None;
    let mut file = None;
    while let Some(field) = multipart.next_field().await.map_err(multipart_error)? {
        match field.name() {
            Some("draftId") if draft.is_none() => {
                let value = field.bytes().await.map_err(multipart_error)?;
                if value.len() > 128 {
                    return Err(invalid_form());
                }
                draft = Some(String::from_utf8(value.to_vec()).map_err(|_| invalid_form())?);
            }
            Some("clientUploadId") if client.is_none() => {
                let value = field.bytes().await.map_err(multipart_error)?;
                if value.len() > 128 {
                    return Err(invalid_form());
                }
                client = Some(String::from_utf8(value.to_vec()).map_err(|_| invalid_form())?);
            }
            Some("file") if file.is_none() => {
                let name = field.file_name().ok_or_else(invalid_form)?.to_string();
                let mime = field.content_type().map(str::to_owned);
                let bytes = field.bytes().await.map_err(multipart_error)?;
                if bytes.len() > attachments::MAX_FILE_BYTES {
                    return Err(Error {
                        code: "upload_too_large".into(),
                        message: "The attachment exceeds the 30 MiB file limit.".into(),
                        retryable: false,
                        status: 413,
                    }
                    .into());
                }
                file = Some((name, mime, bytes));
            }
            _ => return Err(invalid_form()),
        }
    }
    let draft = draft.ok_or_else(invalid_form)?;
    let client = client.ok_or_else(invalid_form)?;
    let (name, mime, bytes) = file.ok_or_else(invalid_form)?;
    let repository = state.attachments.clone();
    let result =
        blocking(move || repository.start(&draft, &client, &name, mime.as_deref(), &bytes)).await?;
    if result.status == "processing" {
        state.attachments.spawn(&result.upload_id)
    }
    Ok(Json(result))
}
async fn retry(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<Json<UploadRecord>, AttachmentError> {
    let repository = state.attachments.clone();
    let result = blocking(move || repository.retry(&id)).await?;
    if result.status == "processing" {
        state.attachments.spawn(&result.upload_id)
    }
    Ok(Json(result))
}
async fn delete(
    State(state): State<StateData>,
    Path(id): Path<String>,
) -> Result<StatusCode, AttachmentError> {
    blocking(move || state.attachments.delete(&id)).await?;
    Ok(StatusCode::NO_CONTENT)
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CancelQuery {
    draft_id: String,
    client_upload_id: String,
}
async fn cancel(
    State(state): State<StateData>,
    Query(q): Query<CancelQuery>,
) -> Result<StatusCode, AttachmentError> {
    blocking(move || state.attachments.cancel(&q.draft_id, &q.client_upload_id)).await?;
    Ok(StatusCode::NO_CONTENT)
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ContentQuery {
    project_id: String,
    #[serde(default = "first_line")]
    start_line: usize,
    #[serde(default = "page_lines")]
    line_count: usize,
}
fn first_line() -> usize {
    1
}
fn page_lines() -> usize {
    100
}
async fn read_document(
    State(state): State<StateData>,
    Path(id): Path<String>,
    Query(q): Query<ContentQuery>,
) -> Result<Json<attachments::ReadDocumentResult>, AttachmentError> {
    Ok(Json(
        blocking(move || {
            state
                .attachments
                .read_for_project(&q.project_id, &id, q.start_line, q.line_count)
        })
        .await?,
    ))
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct FileQuery {
    project_id: String,
}
async fn read_file(
    State(state): State<StateData>,
    Path(id): Path<String>,
    Query(q): Query<FileQuery>,
) -> Result<Response, AttachmentError> {
    let content =
        blocking(move || state.attachments.original_for_project(&q.project_id, &id)).await?;
    let mut response = content.bytes.into_response();
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(&content.mime).map_err(|_| Error::internal())?,
    );
    response.headers_mut().insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_static("attachment; filename=\"attachment\""),
    );
    Ok(response)
}
fn invalid_form() -> AttachmentError {
    Error::validation(
        "invalid_upload_request",
        "Upload one file with draftId and clientUploadId.",
    )
    .into()
}
fn multipart_error(error: axum::extract::multipart::MultipartError) -> AttachmentError {
    if error.status() == StatusCode::PAYLOAD_TOO_LARGE {
        Error {
            code: "upload_too_large".into(),
            message: "The attachment exceeds the 30 MiB file limit.".into(),
            retryable: false,
            status: 413,
        }
        .into()
    } else {
        invalid_form()
    }
}
async fn blocking<T: Send + 'static>(
    f: impl FnOnce() -> Result<T, Error> + Send + 'static,
) -> Result<T, AttachmentError> {
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|_| Error::internal())?
        .map_err(Into::into)
}
struct AttachmentError(Error);
impl From<Error> for AttachmentError {
    fn from(error: Error) -> Self {
        Self(error)
    }
}
impl IntoResponse for AttachmentError {
    fn into_response(self) -> Response {
        let error = self.0;
        (StatusCode::from_u16(error.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),Json(json!({"error":{"code":error.code,"message":error.message,"retryable":error.retryable}}))).into_response()
    }
}
