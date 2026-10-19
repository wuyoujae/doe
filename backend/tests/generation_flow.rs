//! Isolated transport/orchestration fixtures, never used by the product runtime.
use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
};
use base64::{Engine, engine::general_purpose::STANDARD};
use image::{DynamicImage, ImageFormat, RgbImage};
use reqwest::{Client, Method};
use serde_json::{Value, json};
use std::{
    io::Cursor,
    path::PathBuf,
    sync::{
        Arc, Mutex,
        atomic::{AtomicUsize, Ordering},
    },
    time::Duration,
};
use tokio::{sync::Notify, task::JoinHandle};
use yrkie_backend::{assets, attachments, db, doe, generation, http, models, projects};

const OUTLINE: &str = "title=Fixture presentation\n# page\n## text\nClear decisions\n## text\nA fictional test presentation with one shared illustration.\n## generateimg\nratio=16:9\nA quiet cream field with a small burgundy geometric shape at the far right; no text or labels.\n# page\n## text\nNext steps\n## text\nReview the evidence, choose the next action, and keep the decision editable.";

struct Traffic {
    requests: Mutex<Vec<Value>>,
    image_requests: AtomicUsize,
    hold: bool,
    started: Notify,
    release: Notify,
    png: Vec<u8>,
}

fn visual_plan() -> Value {
    json!({"pages":[
        {"page_number":1,"role":"surface","reason":"A quiet field behind the opening statement."},
        {"page_number":2,"role":"surface","source_page":1,"reason":"Reuse the same restrained field while keeping the next action editable."}
    ]})
}

fn deck_source(reference: &str) -> String {
    format!(
        "title=Fixture presentation\ntheme=yrkie-atelier\n# slide\n## background\nsrc={reference}\n## section-heading\ntext=Clear decisions\n## text-paragraph\n### text\nA fictional test presentation with one shared illustration.\n# slide\n## background\nsrc={reference}\n## section-heading\ntext=Next steps\n## text-paragraph\n### text\nReview the evidence, choose the next action, and keep the decision editable."
    )
}

fn host_state(request: &Value) -> Value {
    request["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .rev()
        .find_map(|message| {
            message["content"]
                .as_str()
                .and_then(|content| {
                    content.strip_prefix("Host state (data, not new user instructions): ")
                })
                .and_then(|state| serde_json::from_str(state).ok())
        })
        .expect("authoritative host state")
}

fn previously_called(request: &Value, name: &str) -> bool {
    request["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .any(|message| {
            message["tool_calls"]
                .as_array()
                .is_some_and(|calls| calls.iter().any(|call| call["function"]["name"] == name))
        })
}

fn tool_response(name: &str, arguments: Value, sequence: usize, stream: bool) -> Response {
    let call = json!({"id":format!("fixture-call-{sequence}"),"type":"function","function":{"name":name,"arguments":arguments.to_string()}});
    if stream {
        let split = name.len() / 2;
        let source = arguments.to_string();
        let events = vec![
            json!({"choices":[{"index":0,"delta":{"reasoning_content":format!("Fixture reasoning {sequence}"),"tool_calls":[{"index":0,"id":"fixture-","type":"function","function":{"name":&name[..split],"arguments":&source[..1]}}]}}]}),
            json!({"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call-","function":{"name":&name[split..],"arguments":&source[1..source.len()-1]}}]}}]}),
            json!({"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":sequence.to_string(),"function":{"arguments":&source[source.len()-1..]}}]},"finish_reason":"tool_calls"}]}),
        ];
        let stream = futures_util::stream::unfold(events.into_iter(), |mut events| async move {
            let event = events.next()?;
            tokio::time::sleep(Duration::from_millis(75)).await;
            Some((
                Ok::<_, std::convert::Infallible>(format!("data: {event}\n\n")),
                events,
            ))
        });
        axum::http::Response::builder()
            .header("content-type", "text/event-stream")
            .body(axum::body::Body::from_stream(stream))
            .unwrap()
            .into_response()
    } else {
        Json(json!({"id":format!("fixture-completion-{sequence}"),"choices":[{"index":0,"message":{"role":"assistant","content":null,"reasoning_content":format!("Fixture reasoning {sequence}"),"tool_calls":[call]},"finish_reason":"tool_calls"}]})).into_response()
    }
}

async fn text_provider(
    State(traffic): State<Arc<Traffic>>,
    Json(request): Json<Value>,
) -> Response {
    for message in request["messages"]
        .as_array()
        .into_iter()
        .flatten()
        .filter(|message| message["role"] == "assistant" && message["tool_calls"].is_array())
    {
        if message["tool_calls"]
            .as_array()
            .unwrap()
            .iter()
            .any(|call| {
                call["id"]
                    .as_str()
                    .is_some_and(|id| id.starts_with("fixture-call-"))
            })
        {
            assert!(
                message["reasoning_content"]
                    .as_str()
                    .is_some_and(|reasoning| reasoning.starts_with("Fixture reasoning ")),
                "Otherone must preserve the actual reasoning_content on subsequent tool turns"
            );
        }
    }
    let sequence = {
        let mut requests = traffic.requests.lock().expect("capture requests");
        requests.push(request.clone());
        requests.len()
    };
    traffic.started.notify_one();
    if traffic.hold {
        traffic.release.notified().await;
    }
    let state = host_state(&request);
    let stream = request["stream"] == true;
    if state["stage"] == "edit" {
        if !previously_called(&request, "ReadSlide") {
            return tool_response("ReadSlide", json!({"page_number":1}), sequence, stream);
        }
        if !previously_called(&request, "EditSlide") {
            let read = request["messages"]
                .as_array()
                .unwrap()
                .iter()
                .rev()
                .filter(|message| message["role"] == "tool")
                .filter_map(|message| message["content"].as_str())
                .filter_map(|text| serde_json::from_str::<Value>(text).ok())
                .find(|result| result["markdown"].is_string() && result["slideId"].is_string())
                .expect("saved source receipt");
            let markdown = read["markdown"]
                .as_str()
                .unwrap()
                .replace("Clear decisions", "Revised by chat");
            return tool_response(
                "EditSlide",
                json!({"slide_id":read["slideId"],"expected_revision":read["revision"],"markdown":markdown}),
                sequence,
                stream,
            );
        }
        return ([("content-type","text/event-stream")],format!("data: {}\n\ndata: {}\n\ndata: [DONE]\n\n",json!({"choices":[{"index":0,"delta":{"content":"已修改第一页标题。"}}]}),json!({"choices":[{"index":0,"delta":{"content":"其他页面和图片保持原样。"},"finish_reason":"stop"}]}))).into_response();
    } else if state["stage"] == "outline" {
        let answered = request["messages"]
            .as_array()
            .expect("messages")
            .iter()
            .any(|message| {
                message["role"] == "user"
                    && message["content"]
                        .as_str()
                        .is_some_and(|content| content.starts_with("User answers:"))
            });
        if !answered && !traffic.hold {
            return tool_response(
                "AskQuestions",
                json!({"questions":[
                    {"id":"density","question":"选择信息密度","options":["低","中（推荐）","高"]},
                    {"id":"style","question":"选择视觉风格","options":["Atelier Editorial（推荐）","Swiss Signal"]}
                ]}),
                sequence,
                stream,
            );
        }
        if !previously_called(&request, "ReadDoeSkill") {
            return tool_response(
                "ReadDoeSkill",
                json!({"skill":"atelier-editorial"}),
                sequence,
                stream,
            );
        }
        tool_response(
            "CreateOutline",
            json!({"markdown":OUTLINE,"visual_plan":visual_plan()}),
            sequence,
            stream,
        )
    } else if !previously_called(&request, "ReadOutline") {
        tool_response("ReadOutline", json!({}), sequence, stream)
    } else {
        let source = state["authorized_assets"]
            .as_array()
            .and_then(|sources| sources.first())
            .and_then(Value::as_str)
            .expect("materialized image reference");
        tool_response(
            "CreateDeck",
            json!({"markdown":deck_source(source),"outline_id":state["outline_id"],"outline_revision":state["outline_revision"],"deck_revision":state["deck"]["revision"]}),
            sequence,
            stream,
        )
    }
}

async fn image_provider(
    State(traffic): State<Arc<Traffic>>,
    Json(request): Json<Value>,
) -> Json<Value> {
    assert_eq!(request["model"], "fixture-image");
    assert_eq!(request["n"], 1);
    assert!(
        request["prompt"]
            .as_str()
            .is_some_and(|prompt| !prompt.is_empty())
    );
    traffic.image_requests.fetch_add(1, Ordering::SeqCst);
    Json(json!({"data":[{"b64_json":STANDARD.encode(&traffic.png)}]}))
}

struct Fixture {
    client: Client,
    base: String,
    directory: PathBuf,
    traffic: Arc<Traffic>,
    tasks: Vec<JoinHandle<()>>,
}
impl Drop for Fixture {
    fn drop(&mut self) {
        for task in &self.tasks {
            task.abort();
        }
    }
}

impl Fixture {
    async fn start(hold: bool, port: u16) -> Self {
        let mut output = Cursor::new(Vec::new());
        DynamicImage::ImageRgb8(RgbImage::from_pixel(8, 8, image::Rgb([246, 239, 225])))
            .write_to(&mut output, ImageFormat::Png)
            .expect("fixture PNG");
        let traffic = Arc::new(Traffic {
            requests: Mutex::new(Vec::new()),
            image_requests: AtomicUsize::new(0),
            hold,
            started: Notify::new(),
            release: Notify::new(),
            png: output.into_inner(),
        });
        let provider = Router::new()
            .route("/v1/chat/completions", post(text_provider))
            .route("/v1/images/generations", post(image_provider))
            .with_state(traffic.clone());
        let provider_listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("provider listener");
        let provider_base = format!(
            "http://{}/v1",
            provider_listener.local_addr().expect("address")
        );
        let provider_task = tokio::spawn(async move {
            axum::serve(provider_listener, provider)
                .await
                .expect("provider server");
        });
        let directory = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../test/20261019-generation")
            .join(uuid::Uuid::new_v4().to_string());
        let models = Arc::new(models::Repository::open(&directory).expect("isolated models"));
        let doe = Arc::new(doe::Repository::open(&directory).expect("original DOE defaults"));
        let projects = Arc::new(projects::Repository::open(&directory).expect("isolated projects"));
        let assets = Arc::new(assets::Repository::open(&directory).expect("isolated assets"));
        let runner = Arc::new(generation::Runner::new(
            projects.clone(),
            models.clone(),
            doe.clone(),
            assets.clone(),
        ));
        let listener = tokio::net::TcpListener::bind(("127.0.0.1", port))
            .await
            .expect("app listener");
        let address = listener.local_addr().expect("app address");
        let base = format!("http://{address}");
        let exports =
            yrkie_backend::exports::Service::open(&directory, assets.clone()).expect("exports");
        let playback =
            Arc::new(yrkie_backend::playback::Service::open(&directory).expect("playback"));
        let router = http::router(
            models,
            doe,
            projects,
            assets,
            runner,
            Arc::new(
                yrkie_backend::attachments::Repository::open(&directory).expect("attachments"),
            ),
            exports,
            playback,
            vec!["http://127.0.0.1:7772".into()],
            vec![address.to_string(), "127.0.0.1:7772".into()],
        );
        let app_task = tokio::spawn(async move {
            axum::serve(listener, router).await.expect("app server");
        });
        let fixture = Self {
            client: Client::new(),
            base,
            directory,
            traffic,
            tasks: vec![provider_task, app_task],
        };
        let (status,_) = fixture.json(Method::PUT,"/api/v1/model-settings",Some(json!({"revision":0,"settings":{
            "text":{"provider":"custom","baseUrl":provider_base,"model":"fixture-text","apiKey":"fixture-only-not-a-real-key","options":{"contextWindow":131072,"maxOutputTokens":8192,"maxIterations":8,"temperature":0.2,"stream":true}},
            "image":{"provider":"custom","baseUrl":provider_base,"model":"fixture-image","apiKey":"fixture-only-not-a-real-key","options":{}}
        }}))).await;
        assert_eq!(status, StatusCode::OK);
        fixture
    }

    async fn json(&self, method: Method, path: &str, body: Option<Value>) -> (StatusCode, Value) {
        let mut request = self.client.request(method, format!("{}{path}", self.base));
        if let Some(body) = body {
            request = request.json(&body);
        }
        let response = request.send().await.expect("HTTP response");
        let status = response.status();
        let body = response.json().await.expect("JSON response");
        (status, body)
    }

    async fn wait_status(&self, id: &str, expected: &str) -> Value {
        let start = std::time::Instant::now();
        loop {
            let (status, snapshot) = self
                .json(Method::GET, &format!("/api/v1/projects/{id}"), None)
                .await;
            assert_eq!(status, StatusCode::OK);
            if snapshot["status"] == expected {
                return snapshot;
            }
            assert_ne!(
                snapshot["status"], "failed",
                "generation failed: {}",
                snapshot["run"]
            );
            assert!(
                start.elapsed() < Duration::from_secs(15),
                "timed out waiting for {expected}: {}",
                snapshot["run"]
            );
            tokio::time::sleep(Duration::from_millis(15)).await;
        }
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn confirmed_generation_uses_settings_and_survives_editor_reload() {
    let fixture = Fixture::start(false, 0).await;
    let create = json!({"requestId":"create-flow","prompt":"为一个虚构项目制作两页演示文稿，并先问我密度和风格。"});
    let (status, created) = fixture
        .json(Method::POST, "/api/v1/projects", Some(create.clone()))
        .await;
    assert_eq!(status, StatusCode::OK);
    let id = created["id"].as_str().expect("project id");
    let (status, replayed) = fixture
        .json(Method::POST, "/api/v1/projects", Some(create))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(replayed["id"], id);
    let questions = fixture.wait_status(id, "questions").await;
    assert_eq!(
        questions["run"]["questions"]
            .as_array()
            .expect("questions")
            .len(),
        2
    );
    assert_eq!(fixture.traffic.image_requests.load(Ordering::SeqCst), 0);
    let (status,_)=fixture.json(Method::POST,&format!("/api/v1/projects/{id}/actions"),Some(json!({"action":"confirm","requestId":"premature-confirm","expectedRevision":questions["revision"]}))).await;
    assert_eq!(
        status,
        StatusCode::BAD_REQUEST,
        "questions never authorize slides"
    );
    let (status,_)=fixture.json(Method::POST,&format!("/api/v1/projects/{id}/actions"),Some(json!({"action":"answer","requestId":"answers-flow","expectedRevision":questions["revision"],"answers":[{"id":"density","answer":"中"},{"id":"style","answer":"Atelier Editorial"}]}))).await;
    assert_eq!(status, StatusCode::OK);
    let outline = fixture.wait_status(id, "outline_ready").await;
    assert_eq!(outline["outline"]["confirmed"], false);
    assert_eq!(
        outline["outline"]["document"]["body"]
            .as_array()
            .expect("pages")
            .len(),
        2
    );
    assert!(outline["schemaDeck"].is_null());
    assert_eq!(
        fixture.traffic.image_requests.load(Ordering::SeqCst),
        0,
        "saving an outline must not call image generation"
    );

    let confirm = json!({"action":"confirm","requestId":"confirm-flow","expectedRevision":outline["revision"]});
    let (status, _) = fixture
        .json(
            Method::POST,
            &format!("/api/v1/projects/{id}/actions"),
            Some(confirm.clone()),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let ready = fixture.wait_status(id, "ready").await;
    assert_eq!(ready["outline"]["confirmed"], true);
    assert_eq!(
        ready["schemaDeck"]["deck"]["deck"]["slides"]
            .as_array()
            .expect("slides")
            .len(),
        2
    );
    assert_eq!(fixture.traffic.image_requests.load(Ordering::SeqCst), 1);
    let (status, replayed) = fixture
        .json(
            Method::POST,
            &format!("/api/v1/projects/{id}/actions"),
            Some(confirm),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(replayed["status"], "ready");
    assert_eq!(
        fixture.traffic.image_requests.load(Ordering::SeqCst),
        1,
        "repeat confirm must not generate again"
    );

    let (status, assets) = fixture
        .json(Method::GET, &format!("/api/v1/projects/{id}/assets"), None)
        .await;
    assert_eq!(status, StatusCode::OK);
    let images = assets["images"].as_array().expect("assets");
    assert_eq!(images.len(), 1);
    let asset_id = images[0]["assetId"].as_str().expect("asset id");
    let response = fixture
        .client
        .get(format!(
            "{}/api/v1/projects/{id}/assets/{asset_id}",
            fixture.base
        ))
        .send()
        .await
        .expect("asset response");
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.headers()["content-type"], "image/png");
    assert_eq!(
        response.bytes().await.expect("asset bytes").as_ref(),
        fixture.traffic.png
    );
    let mut deck = ready["schemaDeck"]["deck"].clone();
    deck["deck"]["title"] = json!("Edited in Work");
    let (status, saved) = fixture
        .json(
            Method::PUT,
            &format!("/api/v1/projects/{id}/deck"),
            Some(json!({"expectedRevision":ready["schemaDeck"]["revision"],"deck":deck})),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(saved["revision"], 2);
    let (status, reloaded) = fixture
        .json(Method::GET, &format!("/api/v1/projects/{id}"), None)
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        reloaded["schemaDeck"]["deck"]["deck"]["title"],
        "Edited in Work"
    );
    let reopened = projects::Repository::open(&fixture.directory)
        .expect("reopen persisted project")
        .read(id)
        .expect("persisted deck");
    assert_eq!(
        reopened.schema_deck.expect("deck").deck["deck"]["title"],
        "Edited in Work"
    );
    let (status, _) = fixture
        .json(
            Method::PUT,
            &format!("/api/v1/projects/{id}/deck"),
            Some(json!({"expectedRevision":1,"deck":ready["schemaDeck"]["deck"]})),
        )
        .await;
    assert_eq!(
        status,
        StatusCode::CONFLICT,
        "old editor revision must not overwrite saved edits"
    );

    let chat = json!({"action":"chat","requestId":"chat-edit","message":"把第一页标题改成 Revised by chat，保留所有其他内容。","expectedRevision":reloaded["revision"],"expectedDeckRevision":reloaded["schemaDeck"]["revision"]});
    let (status, _) = fixture
        .json(
            Method::POST,
            &format!("/api/v1/projects/{id}/actions"),
            Some(chat.clone()),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let edited = fixture.wait_status(id, "ready").await;
    assert_eq!(edited["schemaDeck"]["revision"], 3);
    assert_eq!(
        edited["schemaDeck"]["deck"]["deck"]["slides"][1],
        reloaded["schemaDeck"]["deck"]["deck"]["slides"][1]
    );
    assert!(
        edited["schemaDeck"]["deck"]
            .to_string()
            .contains("Revised by chat")
    );
    assert_eq!(fixture.traffic.image_requests.load(Ordering::SeqCst), 1);
    let (status, replayed) = fixture
        .json(
            Method::POST,
            &format!("/api/v1/projects/{id}/actions"),
            Some(chat),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(replayed["schemaDeck"]["revision"], 3);
    let repository = projects::Repository::open(&fixture.directory).unwrap();
    let conversation = repository.conversation(id, 0, 500).unwrap();
    let mut visible_tools = std::collections::BTreeMap::<String, (String, String, bool)>::new();
    for event in &conversation.events {
        let payload = &event.payload;
        let item = payload["itemId"].as_str().unwrap_or("").to_owned();
        match event.kind.as_str() {
            "tool_start" => {
                assert!(
                    visible_tools
                        .insert(
                            item,
                            (
                                payload["name"].as_str().unwrap_or("").into(),
                                String::new(),
                                false
                            )
                        )
                        .is_none()
                );
            }
            "tool_arguments_delta" => visible_tools
                .get_mut(&item)
                .expect("started tool")
                .1
                .push_str(payload["delta"].as_str().unwrap()),
            "tool_identity" => {
                let mut previous = visible_tools
                    .remove(payload["previousItemId"].as_str().unwrap())
                    .expect("identity remaps an existing single tool item");
                previous.0 = payload["name"].as_str().unwrap().into();
                assert!(
                    visible_tools.insert(item, previous).is_none(),
                    "No partial/parallel identity collisions"
                );
            }
            "tool_result" => {
                visible_tools
                    .get_mut(&item)
                    .expect("result matches the final provider identity")
                    .2 = true;
            }
            _ => {}
        }
    }
    assert!(!visible_tools.is_empty());
    for (id, (name, arguments, finished)) in visible_tools {
        assert!(
            id.starts_with("fixture-call-") && id["fixture-call-".len()..].parse::<usize>().is_ok()
        );
        assert!(
            [
                "AskQuestions",
                "ReadDoeSkill",
                "CreateOutline",
                "ReadOutline",
                "CreateDeck",
                "ReadSlide",
                "EditSlide"
            ]
            .contains(&name.as_str())
        );
        assert!(
            finished,
            "No fragmented identity may leave a running orphan tool"
        );
        assert!(
            serde_json::from_str::<Value>(&arguments)
                .unwrap()
                .is_object(),
            "All argument fragments survive identity remapping"
        );
    }

    assert!(
        conversation
            .events
            .iter()
            .any(|event| event.kind == "tool_result"
                && event.payload["name"] == "AskQuestions"
                && event.payload["result"]["requestId"] == questions["run"]["id"])
    );
    assert!(
        conversation
            .events
            .iter()
            .any(|event| event.kind == "outline_draft")
    );
    assert!(conversation.events.iter().any(|event| {
        event.kind == "tool_result"
            && event.payload["name"] == "ReadDoeSkill"
            && event.payload["result"]["content"]
                .as_str()
                .is_some_and(|content| content.contains("Atelier"))
    }));
    assert!(
        conversation
            .events
            .iter()
            .any(|event| event.kind == "tool_result"
                && event.payload["name"] == "EditSlide"
                && event.payload["result"]["committed"] == true)
    );
    let text = conversation
        .events
        .iter()
        .filter(|event| event.kind == "assistant_delta")
        .map(|event| event.payload["delta"].as_str().unwrap())
        .collect::<String>();
    assert!(text.contains("已修改第一页标题。其他页面和图片保持原样。"));
    let requests = fixture.traffic.requests.lock().expect("captured requests");
    assert_eq!(requests.len(), 8);
    assert!(
        requests
            .iter()
            .all(|request| request["model"] == "fixture-text"
                && request["temperature"] == 0.2
                && request["stream"] == true)
    );
    assert!(
        requests[0]["messages"][0]["content"]
            .as_str()
            .expect("system")
            .contains("You are DOE")
    );
    assert!(
        requests[2]["messages"][0]["content"]
            .as_str()
            .expect("selected skill")
            .contains("Atelier")
    );
    assert!(
        !serde_json::to_string(&reloaded)
            .expect("public snapshot")
            .contains("fixture-only-not-a-real-key")
    );
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn uploaded_documents_and_images_reach_the_model_without_polluting_history() {
    let fixture = Fixture::start(false, 0).await;
    let uploads = Arc::new(attachments::Repository::open(&fixture.directory).unwrap());
    let document_body = "# Reference brief\nThe verified fixture launch date is 2031-04-17.\nThis source is complete and editable.";
    let document = uploads
        .start(
            "draft-transport",
            "document-transport",
            "Reference brief.md",
            Some("text/markdown"),
            document_body.as_bytes(),
        )
        .expect("managed document bytes");
    // The parser has its own integration tests. Seed its completed result here so
    // model transport/persistence remains deterministic without a sidecar service.
    let connection = db::connect(&fixture.directory.join("yrkie.sqlite3")).unwrap();
    connection.execute(
        "UPDATE uploads SET status='ready',parsed_markdown=?2,content_chars=?3,estimated_tokens=32 WHERE upload_id=?1",
        rusqlite::params![document.upload_id, document_body, document_body.chars().count() as u64],
    ).unwrap();
    let picture = uploads
        .start(
            "draft-transport",
            "image-transport",
            "Reference image.png",
            Some("image/png"),
            &fixture.traffic.png,
        )
        .expect("managed image bytes");
    uploads.spawn(&picture.upload_id);
    let start = std::time::Instant::now();
    loop {
        let image = uploads.get(&picture.upload_id).unwrap();
        if image.status == "ready" {
            break;
        }
        assert_ne!(
            image.status, "failed",
            "image processing failed: {}",
            image.error_message
        );
        assert!(
            start.elapsed() < Duration::from_secs(5),
            "image processing timed out"
        );
        tokio::time::sleep(Duration::from_millis(10)).await;
    }

    let create = json!({"requestId":"create-attachment-transport","prompt":"Use the attached brief and reference image to prepare a presentation.","uploadIds":[document.upload_id,picture.upload_id]});
    let (status, created) = fixture
        .json(Method::POST, "/api/v1/projects", Some(create.clone()))
        .await;
    assert_eq!(status, StatusCode::OK, "create response: {created}");
    let id = created["id"].as_str().unwrap();
    let questions = fixture.wait_status(id, "questions").await;
    let first_request = fixture.traffic.requests.lock().unwrap()[0].clone();
    let parts: Vec<&Value> = first_request["messages"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|message| message["content"].as_array())
        .flatten()
        .collect();
    let source = parts
        .iter()
        .find_map(|part| {
            part["text"]
                .as_str()
                .filter(|text| text.contains("YRKiE_UPLOADED_DOCUMENT_"))
        })
        .expect("document text sent in the real HTTP model request");
    assert!(
        source.contains(document_body),
        "the full parsed document must reach the model"
    );
    assert!(source.contains("Reference brief.md"));
    assert!(source.contains(&format!(
        "[YRKiE_UPLOADED_DOCUMENT_{}_BEGIN]",
        document.upload_id
    )));
    assert!(source.contains(&format!(
        "[YRKiE_UPLOADED_DOCUMENT_{}_END]",
        document.upload_id
    )));
    let image_url = parts
        .iter()
        .find_map(|part| part["image_url"]["url"].as_str())
        .expect("actual OpenAI image_url part");
    let encoded = image_url
        .strip_prefix("data:image/png;base64,")
        .expect("managed PNG data URI");
    let image =
        image::load_from_memory(&STANDARD.decode(encoded).expect("valid image bytes")).unwrap();
    assert_eq!((image.width(), image.height()), (8, 8));
    assert_eq!(
        *image.to_rgb8().get_pixel(0, 0),
        image::Rgb([246, 239, 225])
    );

    let history: String = connection
        .query_row(
            "SELECT history_json FROM generation_runs WHERE id=?1",
            [questions["run"]["id"].as_str().unwrap()],
            |row| row.get(0),
        )
        .unwrap();
    assert!(
        !history.contains("data:image/"),
        "provider-only image bytes must never enter persisted model history"
    );
    assert!(
        !history.contains("YRKiE_UPLOADED_DOCUMENT_"),
        "attachment source is resolved on demand rather than duplicated into history"
    );
    assert!(!history.contains(document_body));
    let (status, conversation) = fixture
        .json(
            Method::GET,
            &format!("/api/v1/projects/{id}/conversation?after=0"),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let user = conversation["events"]
        .as_array()
        .unwrap()
        .iter()
        .find(|event| event["kind"] == "user_message")
        .unwrap();
    let metadata = user["payload"]["attachments"].as_array().unwrap();
    assert_eq!(metadata.len(), 2);
    assert!(
        metadata
            .iter()
            .any(|item| item["uploadId"] == document.upload_id
                && item["originalName"] == "Reference brief.md"
                && item["pipeline"] == "document")
    );
    assert!(
        metadata
            .iter()
            .any(|item| item["uploadId"] == picture.upload_id && item["pipeline"] == "image")
    );
    assert!(!conversation.to_string().contains("data:image/"));
    assert!(!conversation.to_string().contains(document_body));
    let (_, refreshed) = fixture
        .json(
            Method::GET,
            &format!("/api/v1/projects/{id}/conversation?after=0"),
            None,
        )
        .await;
    assert_eq!(
        refreshed["events"][0]["payload"]["attachments"], user["payload"]["attachments"],
        "refresh retains attachment history"
    );
    let (status, replayed) = fixture
        .json(Method::POST, "/api/v1/projects", Some(create))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(replayed["id"], id);
    assert_eq!(
        fixture.traffic.requests.lock().unwrap().len(),
        1,
        "recovering a creation receipt never calls the model again"
    );
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn cancel_fences_a_late_provider_result_and_replays_without_new_calls() {
    let fixture = Fixture::start(true, 0).await;
    let (_, created) = fixture
        .json(
            Method::POST,
            "/api/v1/projects",
            Some(json!({"requestId":"create-cancel","prompt":"Cancellation fixture"})),
        )
        .await;
    let id = created["id"].as_str().expect("id");
    tokio::time::timeout(Duration::from_secs(10), fixture.traffic.started.notified())
        .await
        .expect("provider started");
    let (_, running) = fixture
        .json(Method::GET, &format!("/api/v1/projects/{id}"), None)
        .await;
    let cancel =
        json!({"action":"cancel","requestId":"cancel-once","expectedRevision":running["revision"]});
    let (status, cancelled) = fixture
        .json(
            Method::POST,
            &format!("/api/v1/projects/{id}/actions"),
            Some(cancel.clone()),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(cancelled["status"], "cancelled");
    fixture.traffic.release.notify_one();
    tokio::time::sleep(Duration::from_millis(75)).await;
    let (status, replayed) = fixture
        .json(
            Method::POST,
            &format!("/api/v1/projects/{id}/actions"),
            Some(cancel),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(replayed["status"], "cancelled");
    assert!(replayed["outline"].is_null());
    assert!(replayed["schemaDeck"].is_null());
    assert_eq!(fixture.traffic.requests.lock().expect("requests").len(), 1);
    assert_eq!(fixture.traffic.image_requests.load(Ordering::SeqCst), 0);
}

/// Optional manual browser fixture, isolated from the normal backend/data directory.
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "manual browser fixture; serves until Ctrl-C"]
async fn serve_browser_fixture() {
    let fixture = Fixture::start(false, 7773).await;
    println!(
        "Fixture backend: {}\nFixture data: {}\nUse a separate frontend on 7772 with /api/v1 proxying to 7773. All model responses are local test fixtures.",
        fixture.base,
        fixture.directory.display()
    );
    tokio::signal::ctrl_c().await.expect("Ctrl-C");
}
