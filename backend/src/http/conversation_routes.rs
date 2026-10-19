//! Durable event replay and demand-driven SSE: dropping the response drops its polling future.
use super::{ApiError, StateData};
use crate::projects;
use axum::{
    Json, Router,
    extract::{Path, Query, State, rejection::QueryRejection},
    http::{HeaderMap, HeaderValue, StatusCode},
    response::{
        IntoResponse, Response, Sse,
        sse::{Event, KeepAlive},
    },
    routing::get,
};
use futures_util::stream;
use serde::Deserialize;
use std::{collections::VecDeque, io, sync::Arc, time::Duration};
use tokio::time::{Instant, sleep_until};

pub(super) fn routes() -> Router<StateData> {
    Router::new()
        .route("/api/v1/projects/{id}/conversation", get(history))
        .route("/api/v1/projects/{id}/events", get(events))
}

#[derive(Default, Deserialize)]
#[serde(deny_unknown_fields)]
struct Cursor {
    #[serde(default)]
    after: u64,
}

fn cursor(
    query: Result<Query<Cursor>, QueryRejection>,
    headers: Option<&HeaderMap>,
) -> Result<u64, ApiError> {
    let Query(query) = query.map_err(|_| invalid_cursor())?;
    let previous = headers
        .and_then(|headers| headers.get("last-event-id"))
        .map(|header| {
            header
                .to_str()
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .ok_or_else(invalid_cursor)
        })
        .transpose()?
        .unwrap_or(0);
    let after = query.after.max(previous);
    if after > i64::MAX as u64 {
        return Err(invalid_cursor());
    }
    Ok(after)
}
fn invalid_cursor() -> ApiError {
    ApiError::new(
        StatusCode::BAD_REQUEST,
        "invalid_cursor",
        "The conversation cursor must be a nonnegative integer",
    )
}

async fn history(
    State(state): State<StateData>,
    Path(id): Path<String>,
    query: Result<Query<Cursor>, QueryRejection>,
) -> Result<Json<projects::ConversationPage>, ApiError> {
    let after = cursor(query, None)?;
    let page = tokio::task::spawn_blocking(move || state.projects.conversation(&id, after, 500))
        .await
        .map_err(|_| ApiError::storage())??;
    Ok(Json(page))
}

struct Tail {
    repository: Arc<projects::Repository>,
    project: String,
    cursor: u64,
    pending: VecDeque<Event>,
    snapshot_key: String,
    next_poll: Instant,
}

impl Tail {
    async fn read(
        &self,
    ) -> Result<(projects::ConversationPage, projects::ProjectSnapshot), ApiError> {
        let repository = self.repository.clone();
        let project = self.project.clone();
        let after = self.cursor;
        tokio::task::spawn_blocking(move || {
            let page = repository.conversation(&project, after, 200)?;
            let snapshot = repository.read(&project)?;
            Ok::<_, projects::Error>((page, snapshot))
        })
        .await
        .map_err(|_| ApiError::storage())?
        .map_err(Into::into)
    }

    fn enqueue(
        &mut self,
        page: projects::ConversationPage,
        snapshot: projects::ProjectSnapshot,
    ) -> Result<(), io::Error> {
        for event in &page.events {
            self.pending.push_back(
                Event::default()
                    .event("conversation")
                    .id(event.sequence.to_string())
                    .json_data(event)
                    .map_err(|_| io::Error::other("Conversation event could not be encoded"))?,
            );
        }
        self.cursor = page.cursor;
        let key = serde_json::to_string(&(
            &snapshot.revision,
            &snapshot.updated_at,
            snapshot.run.as_ref().map(|run| {
                (
                    &run.id,
                    &run.status,
                    &run.message,
                    &run.error_code,
                    run.events.last().map(|event| event.sequence),
                )
            }),
        ))
        .map_err(|_| io::Error::other("Project snapshot could not be encoded"))?;
        if key != self.snapshot_key {
            self.pending.push_back(
                Event::default()
                    .event("snapshot")
                    .json_data(&snapshot)
                    .map_err(|_| io::Error::other("Project snapshot could not be encoded"))?,
            );
            self.snapshot_key = key;
        }
        let active = snapshot
            .run
            .as_ref()
            .is_some_and(|run| matches!(run.status.as_str(), "queued" | "running"));
        self.next_poll = Instant::now()
            + if page.has_more {
                Duration::ZERO
            } else if active {
                Duration::from_millis(200)
            } else {
                Duration::from_secs(1)
            };
        Ok(())
    }
}

async fn events(
    State(state): State<StateData>,
    Path(id): Path<String>,
    query: Result<Query<Cursor>, QueryRejection>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let after = cursor(query, Some(&headers))?;
    let mut tail = Tail {
        repository: state.projects,
        project: id,
        cursor: after,
        pending: VecDeque::new(),
        snapshot_key: String::new(),
        next_poll: Instant::now(),
    };
    // Validate the project and replay cursor before committing a 200 event-stream response.
    let (page, snapshot) = tail.read().await?;
    tail.enqueue(page, snapshot)
        .map_err(|_| ApiError::storage())?;
    let output = stream::try_unfold(tail, |mut tail| async move {
        loop {
            if let Some(event) = tail.pending.pop_front() {
                return Ok::<_, io::Error>(Some((event, tail)));
            }
            sleep_until(tail.next_poll).await;
            let (page, snapshot) = tail
                .read()
                .await
                .map_err(|_| io::Error::other("Conversation stream interrupted"))?;
            tail.enqueue(page, snapshot)?;
        }
    });
    let mut response = Sse::new(output)
        .keep_alive(
            KeepAlive::new()
                .interval(Duration::from_secs(15))
                .text("keep-alive"),
        )
        .into_response();
    response
        .headers_mut()
        .insert("x-accel-buffering", HeaderValue::from_static("no"));
    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    use std::{convert::Infallible, path::PathBuf};
    #[test]
    fn reconnect_cursor_never_rewinds_and_rejects_invalid_headers() {
        let mut headers = HeaderMap::new();
        headers.insert("last-event-id", HeaderValue::from_static("8"));
        assert_eq!(
            cursor(Ok(Query(Cursor { after: 3 })), Some(&headers)).ok(),
            Some(8)
        );
        assert_eq!(
            cursor(Ok(Query(Cursor { after: 12 })), Some(&headers)).ok(),
            Some(12)
        );
        headers.insert("last-event-id", HeaderValue::from_static("not-a-number"));
        assert!(cursor(Ok(Query(Cursor::default())), Some(&headers)).is_err());
        assert!(cursor(Ok(Query(Cursor { after: u64::MAX })), None).is_err());
    }

    #[tokio::test]
    async fn durable_history_encodes_named_frames_and_resume_does_not_repeat_them() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../test/20261019-conversation-http")
            .join(uuid::Uuid::new_v4().to_string());
        let repository = Arc::new(projects::Repository::open(&path).expect("fixture database"));
        let created = repository
            .create(projects::CreateProject {
                upload_ids: vec![],
                prompt: "An isolated conversation fixture".into(),
                request_id: "sse-fixture".into(),
            })
            .expect("fixture project");
        let mut tail = Tail {
            repository,
            project: created.snapshot.id,
            cursor: 0,
            pending: VecDeque::new(),
            snapshot_key: String::new(),
            next_poll: Instant::now(),
        };
        let (page, snapshot) = tail.read().await.ok().expect("history read");
        let first = page
            .events
            .first()
            .expect("persisted user message")
            .sequence;
        tail.enqueue(page, snapshot).expect("encode frames");
        let frames = tail
            .pending
            .drain(..)
            .map(Ok::<_, Infallible>)
            .collect::<Vec<_>>();
        let response = Sse::new(stream::iter(frames)).into_response();
        let body = to_bytes(response.into_body(), 1024 * 1024)
            .await
            .expect("finite fixture body");
        let text = String::from_utf8(body.to_vec()).expect("UTF8 SSE");
        assert!(text.contains("event: conversation\n"));
        assert!(text.contains(&format!("id: {first}\n")));
        assert!(text.contains("event: snapshot\n"));
        assert!(text.contains("An isolated conversation fixture"));
        let (page, snapshot) = tail.read().await.ok().expect("resume history");
        assert!(page.events.is_empty());
        tail.enqueue(page, snapshot).expect("unchanged snapshot");
        assert!(tail.pending.is_empty());
    }
}
