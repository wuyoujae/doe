//! HTTP adapter for the original DOE playback protocol; local origin boundary is shared.
use super::{ApiError, StateData};
use crate::playback;
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Path, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{
        IntoResponse, Response, Sse,
        sse::{Event, KeepAlive},
    },
    routing::{get, post},
};
use futures_util::stream;
use serde_json::{Value, json};
use std::{convert::Infallible, sync::Arc, time::Duration};

pub(super) fn routes() -> Router<StateData> {
    Router::new()
        .route("/api/v1/projects/{project}/playback", get(settings))
        .route(
            "/api/v1/projects/{project}/playback/access",
            axum::routing::put(access),
        )
        .route("/api/v1/projects/{project}/playback/start", post(start))
        .route("/api/v1/playback-links/{link}", get(snapshot))
        .route("/api/v1/playback-links/{link}/events", get(events))
        .route("/api/v1/playback-links/{link}/commands", post(command))
        .route(
            "/api/v1/playback-links/{link}/notes/{slide}",
            get(read_note).put(save_note),
        )
        .route("/api/v1/playback-links/{link}/assets/{asset}", get(asset))
        .layer(DefaultBodyLimit::max(512 * 1024))
}
fn error(error: playback::Error) -> ApiError {
    let code = error.0;
    ApiError::new(
        match code {
            "playback_login" => StatusCode::UNAUTHORIZED,
            "playback_forbidden" => StatusCode::FORBIDDEN,
            "playback_not_found" => StatusCode::NOT_FOUND,
            "playback_conflict" => StatusCode::CONFLICT,
            "playback_ended" => StatusCode::GONE,
            "playback_invalid" => StatusCode::BAD_REQUEST,
            "playback_capacity" | "playback_rate_limited" => StatusCode::TOO_MANY_REQUESTS,
            _ => StatusCode::SERVICE_UNAVAILABLE,
        },
        code,
        "The local presentation could not complete this operation",
    )
}
fn owner(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::COOKIE)?
        .to_str()
        .ok()?
        .split(';')
        .find_map(|part| {
            let (name, value) = part.trim().split_once('=')?;
            (name == playback::OWNER_COOKIE).then(|| value.to_owned())
        })
}
async fn blocking<T: Send + 'static>(
    action: impl FnOnce() -> playback::Result<T> + Send + 'static,
) -> Result<T, ApiError> {
    tokio::task::spawn_blocking(action)
        .await
        .map_err(|_| ApiError::storage())?
        .map_err(error)
}
fn response(value: impl serde::Serialize) -> Response {
    let mut response = Json(value).into_response();
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-store"),
    );
    response.headers_mut().insert(
        "x-robots-tag",
        HeaderValue::from_static("noindex, noarchive"),
    );
    response
}
async fn settings(
    State(state): State<StateData>,
    Path(project): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    // A link alone never grants ownership. Only visiting the same-origin application can bootstrap it.
    if headers.get("sec-fetch-dest").is_some_and(|v| v != "empty") {
        return Err(error(playback::Error("playback_forbidden")));
    }
    let service = state.playback.clone();
    let cookie = service.cookie_header();
    let value = blocking(move || service.settings(&project)).await?;
    let mut out = response(value);
    out.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&cookie).map_err(|_| ApiError::storage())?,
    );
    Ok(out)
}
async fn access(
    State(state): State<StateData>,
    Path(project): Path<String>,
    headers: HeaderMap,
    Json(input): Json<playback::SaveAccess>,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    Ok(response(
        blocking(move || {
            state
                .playback
                .save_access(&project, token.as_deref(), input)
        })
        .await?,
    ))
}
async fn start(
    State(state): State<StateData>,
    Path(project): Path<String>,
    headers: HeaderMap,
    Json(input): Json<playback::Start>,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    Ok(response(
        blocking(move || state.playback.start(&project, token.as_deref(), input)).await?,
    ))
}
async fn snapshot(
    State(state): State<StateData>,
    Path(link): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    Ok(response(
        blocking(move || state.playback.snapshot(&link, token.as_deref())).await?,
    ))
}
async fn command(
    State(state): State<StateData>,
    Path(link): Path<String>,
    headers: HeaderMap,
    Json(input): Json<Value>,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    Ok(response(
        blocking(move || state.playback.command(&link, token.as_deref(), input)).await?,
    ))
}
async fn read_note(
    State(state): State<StateData>,
    Path((link, slide)): Path<(String, String)>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    Ok(response(
        blocking(move || state.playback.note(&link, &slide, token.as_deref(), None)).await?,
    ))
}
async fn save_note(
    State(state): State<StateData>,
    Path((link, slide)): Path<(String, String)>,
    headers: HeaderMap,
    Json(input): Json<playback::SaveNote>,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    Ok(response(
        blocking(move || {
            state
                .playback
                .note(&link, &slide, token.as_deref(), Some(input))
        })
        .await?,
    ))
}
struct Tail {
    service: Arc<playback::Service>,
    link: String,
    token: Option<String>,
    subscription: playback::Subscription,
    first: bool,
    heartbeat: tokio::time::Interval,
    done: bool,
}
async fn events(
    State(state): State<StateData>,
    Path(link): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    let service = state.playback.clone();
    let read_link = link.clone();
    let read_token = token.clone();
    let subscription =
        blocking(move || service.subscribe(&read_link, read_token.as_deref())).await?;
    let mut heartbeat = tokio::time::interval(Duration::from_secs(2));
    heartbeat.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
    let tail = Tail {
        service: state.playback,
        link,
        token,
        subscription,
        first: true,
        heartbeat,
        done: false,
    };
    let output = stream::unfold(tail, |mut tail| async move {
        if tail.done {
            return None;
        }
        let event = if tail.first {
            tail.first = false;
            tail.subscription.initial.clone()
        } else {
            tokio::select! {
                next=tail.subscription.receiver.recv()=>match next{Ok(value)=>value,Err(_)=>return None},
                _=tail.heartbeat.tick()=>{let service=tail.service.clone();let link=tail.link.clone();let token=tail.token.clone();match blocking(move||service.heartbeat(&link,token.as_deref())).await{Ok(value)=>value,Err(_)=>json!({"kind":"end","code":"playback_ended"})}}
            }
        };
        tail.done = matches!(event["kind"].as_str(), Some("end" | "restart" | "denied"));
        Some((
            Ok::<_, Infallible>(Event::default().data(event.to_string())),
            tail,
        ))
    });
    let mut out = Sse::new(output)
        .keep_alive(KeepAlive::default())
        .into_response();
    out.headers_mut()
        .insert("x-accel-buffering", HeaderValue::from_static("no"));
    out.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-store"),
    );
    Ok(out)
}
async fn asset(
    State(state): State<StateData>,
    Path((link, asset)): Path<(String, String)>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let token = owner(&headers);
    let service = state.playback;
    let asset_id = asset.clone();
    let project =
        blocking(move || service.asset_project(&link, &asset_id, token.as_deref())).await?;
    let bytes = tokio::task::spawn_blocking(move || state.assets.read(&project, &asset))
        .await
        .map_err(|_| ApiError::storage())??;
    let mut out = bytes.bytes.into_response();
    out.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(&bytes.mime).map_err(|_| ApiError::storage())?,
    );
    out.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-store"),
    );
    Ok(out)
}
