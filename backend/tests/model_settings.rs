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
    ai, http,
    models::{Repository, SaveSettings, StorageError},
};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

fn directory() -> PathBuf {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../test/20261018-model-settings-backend")
        .join(format!(
            "{timestamp}-{}",
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ))
}

fn payload(revision: u64) -> Value {
    json!({"revision":revision,"settings":{
        "text":{"provider":"custom","baseUrl":"https://example.com/v1","model":"test-model","options":{}},
        "image":{"provider":"custom","baseUrl":"","model":"","options":{}}
    }})
}

fn input(value: Value) -> SaveSettings {
    serde_json::from_value(value).expect("valid input shape")
}

#[test]
fn credentials_are_encrypted_persistent_and_endpoint_scoped() {
    let path = directory();
    let repository = Repository::open(&path).expect("open");
    let mut request = payload(0);
    request["settings"]["text"]["apiKey"] = json!("test-secret-not-a-real-api-key");
    let saved = repository.save(input(request)).expect("save");
    assert_eq!(saved.revision, 1);
    assert!(saved.settings.text.has_api_key);
    let response = serde_json::to_string(&saved).expect("response");
    assert!(!response.contains("test-secret"));
    assert!(!response.contains("\"apiKey\""));
    let connection = rusqlite::Connection::open(path.join("yrkie.sqlite3")).expect("database");
    let cipher: Vec<u8> = connection
        .query_row(
            "SELECT key_ciphertext FROM model_configs WHERE kind='text'",
            [],
            |row| row.get(0),
        )
        .expect("ciphertext");
    assert!(!String::from_utf8_lossy(&cipher).contains("test-secret"));
    drop(connection);
    drop(repository);

    let repository = Repository::open(&path).expect("restart with same key");
    let mut unchanged = payload(1);
    unchanged["settings"]["text"]["baseUrl"] = json!("https://example.com/v1/");
    assert!(
        repository
            .save(input(unchanged))
            .expect("normalized URL preserves key")
            .settings
            .text
            .has_api_key
    );
    assert_eq!(
        repository
            .resolve("text")
            .expect("resolve")
            .api_key
            .as_str(),
        "test-secret-not-a-real-api-key"
    );
    let mut moved = payload(2);
    moved["settings"]["text"]["baseUrl"] = json!("https://new.example.com/v1");
    assert!(
        !repository
            .save(input(moved))
            .expect("different endpoint")
            .settings
            .text
            .has_api_key
    );
    let mut replace = payload(3);
    replace["settings"]["text"]["apiKey"] = json!("another-fake-key");
    repository.save(input(replace)).expect("replace key");
    let mut clear = payload(4);
    clear["settings"]["text"]["apiKey"] = json!("");
    assert!(
        !repository
            .save(input(clear))
            .expect("clear key")
            .settings
            .text
            .has_api_key
    );
}

#[test]
fn concurrent_writes_have_one_winner_and_preserve_both_model_groups() {
    let repository = Arc::new(Repository::open(&directory()).expect("open"));
    let barrier = Arc::new(Barrier::new(3));
    let mut threads = Vec::new();
    for name in ["first", "second"] {
        let repository = repository.clone();
        let barrier = barrier.clone();
        threads.push(std::thread::spawn(move || {
            let mut request = payload(0);
            request["settings"]["text"]["model"] = json!(name);
            request["settings"]["image"] = json!({"provider":"openai","baseUrl":"https://api.openai.com/v1","model":name,"options":{}});
            barrier.wait(); repository.save(input(request))
        }));
    }
    barrier.wait();
    let results: Vec<_> = threads
        .into_iter()
        .map(|thread| thread.join().expect("writer"))
        .collect();
    assert_eq!(results.iter().filter(|result| result.is_ok()).count(), 1);
    assert_eq!(
        results
            .iter()
            .filter(|result| matches!(result, Err(StorageError::Conflict)))
            .count(),
        1
    );
    let saved = repository.read().expect("read");
    assert_eq!(saved.revision, 1);
    assert_eq!(saved.settings.text.model, saved.settings.image.model);
}

#[test]
fn missing_or_wrong_master_key_never_reinitializes_existing_data() {
    let path = directory();
    let repository = Repository::open(&path).expect("open");
    let mut request = payload(0);
    request["settings"]["text"]["apiKey"] = json!("fake-encrypted-key");
    repository.save(input(request)).expect("save");
    drop(repository);
    std::fs::rename(path.join("master.key"), path.join("master.key.backup"))
        .expect("simulate missing key");
    assert!(Repository::open(&path).is_err());
    assert!(!path.join("master.key").exists());
    std::fs::write(path.join("master.key"), [0; 32]).expect("simulate wrong key");
    assert!(Repository::open(&path).is_err());
}

#[test]
fn invalid_ranges_urls_provider_options_and_controlled_extras_are_rejected() {
    let mut cases = Vec::new();
    for options in [
        json!({"temperature":3}),
        json!({"contextWindow":1023}),
        json!({"maxIterations":0}),
        json!({"requestTimeoutSeconds":60}),
        json!({"extraParams":{"model":"override"}}),
        json!({"extraParams":{"temperature":1}}),
    ] {
        let mut value = payload(0);
        value["settings"]["text"]["options"] = options;
        cases.push(value);
    }
    for url in [
        "https://user:password@example.com/v1",
        "https://example.com/v1?key=secret",
        "ftp://example.com",
        "https://example.com/#fragment",
    ] {
        let mut value = payload(0);
        value["settings"]["text"]["baseUrl"] = json!(url);
        cases.push(value);
    }
    let mut image = payload(0);
    image["settings"]["image"]["options"] = json!({"temperature":1});
    cases.push(image);
    let mut claude = payload(0);
    claude["settings"]["text"] = json!({"provider":"anthropic","baseUrl":"https://api.anthropic.com/v1","model":"test","options":{"reasoningEffort":"low"}});
    cases.push(claude);
    for value in cases {
        assert!(input(value).validate().is_err());
    }
    let mut unknown = payload(0);
    unknown["settings"]["text"]["options"] = json!({"typo":1});
    assert!(serde_json::from_value::<SaveSettings>(unknown).is_err());
    let mut valid = payload(0);
    valid["settings"]["image"] = json!({"provider":"xai","baseUrl":"https://api.x.ai/v1","model":"image-test","options":{"extraParams":{"aspect_ratio":"16:9"}}});
    assert!(input(valid).validate().is_ok());
}

#[tokio::test]
async fn http_boundary_masks_credentials_and_returns_real_conflicts() {
    let data_dir = directory();
    let repository = Arc::new(Repository::open(&data_dir).expect("open"));
    let doe = Arc::new(yrkie_backend::doe::Repository::open(&data_dir).expect("DOE defaults"));
    let projects =
        Arc::new(yrkie_backend::projects::Repository::open(&data_dir).expect("projects"));
    let assets = Arc::new(yrkie_backend::assets::Repository::open(&data_dir).expect("assets"));
    let runner = Arc::new(yrkie_backend::generation::Runner::new(
        projects.clone(),
        repository.clone(),
        doe.clone(),
        assets.clone(),
    ));
    let exports = yrkie_backend::exports::Service::open(&data_dir, assets.clone()).expect("exports");
    let playback = Arc::new(yrkie_backend::playback::Service::open(&data_dir).expect("playback"));
    let app = http::router(
        repository,
        doe,
        projects,
        assets,
        runner,
        Arc::new(yrkie_backend::attachments::Repository::open(&data_dir).expect("attachments")),
        exports,
        playback,
        vec!["http://127.0.0.1:7762".into()],
        vec!["127.0.0.1:7763".into()],
    );
    for (host, origin) in [
        ("evil.example", "http://127.0.0.1:7762"),
        ("127.0.0.1:7763", "https://evil.example"),
        ("127.0.0.1:7763", "null"),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/v1/model-settings")
                    .header("host", host)
                    .header("origin", origin)
                    .body(Body::empty())
                    .expect("request"),
            )
            .await
            .expect("response");
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(response.headers()["cache-control"], "no-store");
    }
    let mut value = payload(0);
    value["settings"]["text"]["apiKey"] = json!("http-test-secret");
    for expected in [StatusCode::OK, StatusCode::CONFLICT] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/api/v1/model-settings")
                    .header("host", "127.0.0.1:7763")
                    .header("origin", "http://127.0.0.1:7762")
                    .header("content-type", "application/json")
                    .body(Body::from(value.to_string()))
                    .expect("request"),
            )
            .await
            .expect("response");
        assert_eq!(response.status(), expected);
        let body = to_bytes(response.into_body(), 32_768).await.expect("body");
        assert!(!String::from_utf8_lossy(&body).contains("http-test-secret"));
    }
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/model-settings")
                .header("host", "127.0.0.1:7763")
                .header("sec-fetch-site", "cross-site")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[test]
fn request_adapter_separates_agent_budget_from_openai_payload_without_network_calls() {
    let repository = Repository::open(&directory()).expect("open");
    let mut value = payload(0);
    value["settings"]["text"]["options"] = json!({"contextWindow":32768,"maxIterations":12,"thresholdPercentage":0.75,"temperature":0,"stream":false,"reasoningEffort":"none","extraParams":{"seed":42}});
    repository.save(input(value)).expect("save");
    let resolved = repository.resolve("text").expect("resolve");
    let prepared = ai::prepare_text(
        &resolved,
        vec![json!({"role":"user","content":"test"})],
        None,
    )
    .expect("prepare");
    assert_eq!(prepared.budget.context_window, 32768);
    assert_eq!(prepared.budget.max_iterations, 12);
    assert_eq!(
        prepared.request.url().as_str(),
        "https://example.com/v1/chat/completions"
    );
    let body: Value = serde_json::from_slice(
        prepared
            .request
            .body()
            .expect("body")
            .as_bytes()
            .expect("JSON bytes"),
    )
    .expect("JSON");
    assert_eq!(body["stream"], false);
    assert_eq!(body["reasoning_effort"], "none");
    assert_eq!(body["seed"], 42);
    assert!(body.get("contextWindow").is_none());
    assert!(body.get("top_p").is_none());
    assert!(body.get("max_tokens").is_none());
}
