use axum::{
    body::{Body, to_bytes},
    http::{Request, StatusCode},
};
use serde_json::{Value, json};
use std::{
    path::PathBuf,
    sync::{
        Arc, Barrier,
        atomic::{AtomicU64, Ordering},
    },
    time::{SystemTime, UNIX_EPOCH},
};
use tower::ServiceExt;
use yrkie_backend::{
    doe::{self, Repository, SaveSettings, SettingsError},
    models,
};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

fn directory() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../test/20261018-doe-settings-backend")
        .join(format!(
            "{}-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock")
                .as_nanos(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ))
}

fn setup() -> (PathBuf, models::Repository, Repository) {
    let directory = directory();
    let models = models::Repository::open(&directory).expect("database");
    let doe = Repository::open(&directory).expect("DOE resources");
    (directory, models, doe)
}

fn input(snapshot: &doe::SettingsSnapshot) -> Value {
    json!({"revision":snapshot.revision,"entries":snapshot.entries.iter().map(|entry|json!({"id":entry.id,"content":entry.content,"enabled":entry.enabled})).collect::<Vec<_>>()})
}

fn parse(value: Value) -> SaveSettings {
    serde_json::from_value(value).expect("input")
}

#[test]
fn defaults_overrides_restore_and_runtime_skill_reads_are_revision_bound() {
    let (path, _, repository) = setup();
    let initial = repository.read().expect("defaults");
    assert_eq!(initial.entries.len(), 21);
    assert_eq!(initial.revision, 0);
    assert!(
        initial
            .entries
            .iter()
            .all(|entry| !entry.is_modified && entry.enabled)
    );
    let runtime = repository.resolve().expect("runtime");
    assert_eq!(runtime.skills.len(), 18);
    let skill = &runtime.skills[0].id;
    let original_skill = repository
        .read_skill(runtime.revision, skill)
        .expect("read")
        .expect("enabled skill");
    let mut request = input(&initial);
    request["entries"][0]["content"] = json!("Changed system prompt");
    let skill_index = initial
        .entries
        .iter()
        .position(|entry| &entry.id == skill)
        .expect("skill index");
    request["entries"][skill_index]["content"] = json!("Updated skill content");
    request["entries"][skill_index]["enabled"] = json!(false);
    let updated = repository.save(parse(request)).expect("save");
    assert_eq!(updated.revision, 1);
    assert!(updated.entries[0].is_modified);
    assert_eq!(repository.resolve().expect("runtime").skills.len(), 17);
    assert!(
        repository
            .read_skill(1, skill)
            .expect("read disabled")
            .is_none()
    );
    assert_eq!(
        repository
            .read_skill(0, skill)
            .expect("read frozen")
            .expect("frozen"),
        original_skill
    );
    drop(repository);
    let reopened = Repository::open(&path).expect("reopen");
    assert_eq!(
        reopened.read().expect("persisted").entries[0].content,
        "Changed system prompt"
    );
    let mut restored = input(&initial);
    restored["revision"] = json!(1);
    let restored = reopened.save(parse(restored)).expect("restore defaults");
    assert_eq!(restored.revision, 2);
    assert!(restored.entries.iter().all(|entry| !entry.is_modified));
    assert_eq!(
        reopened
            .save(parse(input(&restored)))
            .expect("no-op")
            .revision,
        2
    );
    let connection = rusqlite::Connection::open(path.join("yrkie.sqlite3")).expect("database");
    let overrides: u64 = connection
        .query_row("SELECT count(*) FROM doe_overrides", [], |row| row.get(0))
        .expect("overrides");
    let versions: u64 = connection
        .query_row(
            "SELECT count(DISTINCT revision) FROM doe_revisions",
            [],
            |row| row.get(0),
        )
        .expect("history");
    assert_eq!(overrides, 0);
    assert_eq!(versions, 3);
}

#[test]
fn atomic_validation_and_concurrent_cas_preserve_the_bundle() {
    let (_, _, repository) = setup();
    let repository = Arc::new(repository);
    let initial = repository.read().expect("defaults");
    for (index, field, value) in [
        (0, "enabled", json!(false)),
        (1, "content", json!(" ")),
        (3, "content", json!("x".repeat(64 * 1024 + 1))),
    ] {
        let mut bad = input(&initial);
        bad["entries"][index][field] = value;
        assert!(matches!(
            repository.save(parse(bad)),
            Err(SettingsError::Validation { .. })
        ));
    }
    let mut duplicate = input(&initial);
    duplicate["entries"][1]["id"] = duplicate["entries"][0]["id"].clone();
    assert!(matches!(
        repository.save(parse(duplicate)),
        Err(SettingsError::Validation { .. })
    ));
    assert_eq!(repository.read().expect("untouched").revision, 0);
    let barrier = Arc::new(Barrier::new(3));
    let mut threads = Vec::new();
    for text in ["writer one", "writer two"] {
        let repository = repository.clone();
        let barrier = barrier.clone();
        let mut request = input(&initial);
        request["entries"][0]["content"] = json!(text);
        threads.push(std::thread::spawn(move || {
            barrier.wait();
            repository.save(parse(request))
        }));
    }
    barrier.wait();
    let results = threads
        .into_iter()
        .map(|thread| thread.join().expect("thread"))
        .collect::<Vec<_>>();
    assert_eq!(results.iter().filter(|result| result.is_ok()).count(), 1);
    assert_eq!(
        results
            .iter()
            .filter(|result| matches!(result, Err(SettingsError::Conflict)))
            .count(),
        1
    );
}

#[tokio::test]
async fn http_accepts_real_bundle_above_model_limit_and_rejects_stale_or_unknown_fields() {
    let (directory, models, repository) = setup();
    let initial = repository.read().expect("defaults");
    let models = Arc::new(models);
    let repository = Arc::new(repository);
    let projects =
        Arc::new(yrkie_backend::projects::Repository::open(&directory).expect("projects"));
    let assets = Arc::new(yrkie_backend::assets::Repository::open(&directory).expect("assets"));
    let runner = Arc::new(yrkie_backend::generation::Runner::new(
        projects.clone(),
        models.clone(),
        repository.clone(),
        assets.clone(),
    ));
    let exports = yrkie_backend::exports::Service::open(&directory, assets.clone()).expect("exports");
    let playback = Arc::new(yrkie_backend::playback::Service::open(&directory).expect("playback"));
    let app = yrkie_backend::http::router(
        models,
        repository,
        projects,
        assets,
        runner,
        Arc::new(yrkie_backend::attachments::Repository::open(&directory).expect("attachments")),
        exports,
        playback,
        vec!["http://127.0.0.1:7762".into()],
        vec!["127.0.0.1:7763".into()],
    );
    let mut request = input(&initial);
    request["entries"][0]["content"] = json!("Saved through HTTP");
    let body = serde_json::to_vec(&request).expect("body");
    assert!(body.len() > 64 * 1024);
    for expected in [StatusCode::OK, StatusCode::CONFLICT] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/api/v1/doe-settings")
                    .header("host", "127.0.0.1:7763")
                    .header("origin", "http://127.0.0.1:7762")
                    .header("content-type", "application/json")
                    .body(Body::from(body.clone()))
                    .expect("request"),
            )
            .await
            .expect("response");
        assert_eq!(response.status(), expected);
        assert_eq!(response.headers()["cache-control"], "no-store");
        let payload: Value = serde_json::from_slice(
            &to_bytes(response.into_body(), 4 * 1024 * 1024)
                .await
                .expect("body"),
        )
        .expect("json");
        if expected == StatusCode::OK {
            assert_eq!(payload["entries"][0]["content"], "Saved through HTTP");
        } else {
            assert_eq!(payload["error"]["code"], "conflict");
        }
    }
    request["revision"] = json!(1);
    request["entries"][0]["name"] = json!("Cannot rename");
    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri("/api/v1/doe-settings")
                .header("host", "127.0.0.1:7763")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(&request).expect("json")))
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[test]
fn version_one_migration_preserves_credentials_and_expands_provider_constraints() {
    let path = directory();
    let secrets = yrkie_backend::security::SecretStore::open(&path, false).expect("key");
    let mut connection = yrkie_backend::db::connect(&path.join("yrkie.sqlite3")).expect("database");
    connection
        .execute_batch(include_str!("../migrations/0001_model_settings.sql"))
        .expect("v1");
    connection.execute_batch("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES (1,'0001_model_settings','original'); PRAGMA user_version=1; UPDATE model_settings_state SET revision=7;").expect("v1 history");
    let ciphertext = secrets
        .encrypt("text", "fake-migration-key")
        .expect("encrypt");
    connection.execute("UPDATE model_configs SET provider='openai',base_url='https://api.openai.com/v1',model_id='existing-model',key_ciphertext=?1 WHERE kind='text'", [&ciphertext]).expect("old model");
    yrkie_backend::db::migrate(&mut connection).expect("migration");
    let new_cipher: Vec<u8> = connection
        .query_row(
            "SELECT key_ciphertext FROM model_configs WHERE kind='text'",
            [],
            |row| row.get(0),
        )
        .expect("preserved ciphertext");
    assert_eq!(new_cipher, ciphertext);
    drop(connection);
    let repository = models::Repository::open(&path).expect("reopen migrated");
    assert_eq!(repository.read().expect("settings").revision, 7);
    assert_eq!(
        repository.resolve("text").expect("key").api_key.as_str(),
        "fake-migration-key"
    );
    let mut revision = 7;
    for (id, provider) in &*models::catalog::PROVIDERS {
        if id == "custom" {
            continue;
        }
        for kind in &provider.kinds {
            let snapshot = repository.read().expect("settings");
            let mut payload = serde_json::to_value(snapshot).expect("json");
            for group in ["text", "image"] {
                payload["settings"][group]
                    .as_object_mut()
                    .expect("endpoint")
                    .remove("hasApiKey");
            }
            payload["settings"][kind] = json!({"provider":id,"baseUrl":provider.base_url,"model":"test-model","options":{}});
            let saved = repository
                .save(serde_json::from_value(payload).expect("save input"))
                .expect("catalog provider supported");
            revision += 1;
            assert_eq!(saved.revision, revision);
        }
    }
}
