//! Local host for the original DOE live playback protocol. Ink is never Deck data.
mod projection;
mod reducer;
mod repository;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::{HashMap, VecDeque},
    path::PathBuf,
    sync::Mutex,
};
use tokio::sync::broadcast;

pub const OWNER_COOKIE: &str = "yrkie_playback_owner";
const LIVE_TTL_MS: u64 = 86_400_000;

#[derive(Debug, thiserror::Error)]
#[error("{0}")]
pub struct Error(pub &'static str);
impl From<rusqlite::Error> for Error {
    fn from(_: rusqlite::Error) -> Self {
        Self("playback_unavailable")
    }
}
impl From<serde_json::Error> for Error {
    fn from(_: serde_json::Error) -> Self {
        Self("playback_unavailable")
    }
}
impl From<std::io::Error> for Error {
    fn from(_: std::io::Error) -> Self {
        Self("playback_unavailable")
    }
}
pub type Result<T> = std::result::Result<T, Error>;

#[derive(Clone, Serialize)]
pub struct Access {
    pub access: &'static str,
    pub operate: &'static str,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub revision: u64,
    pub presenter_link: String,
    pub audience_link: String,
    pub presenter: Access,
    pub audience: Access,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Start {
    pub source_revision: u64,
    #[serde(default)]
    pub motions: Value,
    #[serde(default)]
    pub restart: bool,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveAccess {
    pub expected_revision: u64,
    pub presenter: InputAccess,
    pub audience: InputAccess,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct InputAccess {
    pub access: String,
    pub operate: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveNote {
    pub content: String,
    pub expected_revision: u64,
    pub epoch: String,
}

struct Grant {
    project: String,
    key: String,
    role: &'static str,
    settings: Settings,
    snapshot: Value,
    source_revision: u64,
}
struct Live {
    state: Value,
    sender: broadcast::Sender<Value>,
    expires: u64,
    commands: VecDeque<(String, String)>,
    rate: VecDeque<u64>,
}
pub struct Subscription {
    pub receiver: broadcast::Receiver<Value>,
    pub initial: Value,
}
pub struct Service {
    path: PathBuf,
    owner: String,
    lives: Mutex<HashMap<String, Live>>,
}

pub fn valid_link(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|v| v.is_ascii_digit() || (b'a'..=b'f').contains(&v))
}
fn random_id() -> String {
    format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    )
}
fn now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
fn unavailable<T>(_: T) -> Error {
    Error("playback_unavailable")
}
fn capability(grant: &Grant) -> Value {
    serde_json::json!({"role":grant.role,"canOperate":true,"isOwner":true,"accessRevision":grant.settings.revision})
}
