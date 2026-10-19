use serde_json::{Value, json};
use std::{
    io::Cursor,
    path::PathBuf,
    sync::{Arc, Barrier},
};
use yrkie_backend::{
    assets, models,
    projects::{self, Action, CreateProject, Error, ProjectAction, SaveDeck, SaveOutline},
};

fn setup() -> (PathBuf, projects::Repository, assets::Repository) {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../test/20261019-generation-store")
        .join(uuid::Uuid::new_v4().to_string());
    models::Repository::open(&path).expect("model key and migrations");
    let projects = projects::Repository::open(&path).expect("projects");
    let assets = assets::Repository::open(&path).expect("assets");
    (path, projects, assets)
}
fn create(repository: &projects::Repository, request: &str) -> projects::Mutation {
    repository
        .create(CreateProject {
            upload_ids: vec![],
            prompt: "A focused presentation about astronomy".into(),
            request_id: request.into(),
        })
        .expect("create")
}
fn action(action: Action, revision: u64, id: &str) -> ProjectAction {
    ProjectAction {
        upload_ids: vec![],
        action,
        expected_revision: revision,
        expected_deck_revision: None,
        request_id: id.into(),
        message: None,
        answers: None,
        outline_markdown: None,
    }
}
fn deck() -> Value {
    json!({"version":4,"pageNumber":{"enabled":true,"format":"number"},"deck":{"title":"Astronomy","theme":"paper","slides":[{"id":"slide-1","size":{"width":960,"height":540,"unit":"pt"},"blocks":[{"id":"heading-1","type":"heading","props":{"text":"Astronomy","level":1}}]}]}})
}
fn outline() -> Value {
    json!({"title":"Astronomy","page_count":1,"body":[{"contents":["Astronomy","Stars and planets"]}]})
}
fn png() -> Vec<u8> {
    let mut bytes = Cursor::new(Vec::new());
    image::DynamicImage::new_rgb8(3, 2)
        .write_to(&mut bytes, image::ImageFormat::Png)
        .expect("PNG");
    bytes.into_inner()
}

fn ready_deck(repository: &projects::Repository, key: &str) -> String {
    let created = create(repository, key);
    let id = created.snapshot.id;
    let run = created.launch.unwrap();
    repository
        .set_outline(
            &run.run_id,
            "# page\n## text\nAstronomy\n## text\nStars and planets",
            &outline(),
            &json!([]),
        )
        .unwrap();
    let current = repository.read(&id).unwrap();
    let launch = repository
        .action(
            &id,
            action(Action::Confirm, current.revision, &format!("{key}-confirm")),
        )
        .unwrap()
        .launch
        .unwrap();
    repository.complete(&launch.run_id, &deck()).unwrap();
    id
}

#[test]
fn conversation_pagination_preserves_order_and_cancel_stops_late_stream_writes() {
    let (path, repository, _) = setup();
    let created = create(&repository, "conversation-pages");
    let run = created.launch.unwrap();
    let id = created.snapshot.id;
    repository.claim(&run.run_id).unwrap();
    for index in 0..7 {
        repository
            .append_run_event(
                &run.run_id,
                "assistant_delta",
                &json!({"messageId":run.run_id,"itemId":"text","delta":format!("片段{index}")}),
            )
            .unwrap();
    }
    let all = repository.conversation(&id, 0, 500).unwrap();
    let reopened = projects::Repository::open(&path).unwrap();
    let mut after = 0;
    let mut collected = Vec::new();
    loop {
        let page = reopened.conversation(&id, after, 2).unwrap();
        assert!(
            page.events
                .windows(2)
                .all(|pair| pair[0].sequence < pair[1].sequence)
        );
        after = page.cursor;
        collected.extend(
            page.events
                .into_iter()
                .map(|event| (event.sequence, event.kind, event.payload)),
        );
        if !page.has_more {
            break;
        }
    }
    assert_eq!(
        collected,
        all.events
            .into_iter()
            .map(|event| (event.sequence, event.kind, event.payload))
            .collect::<Vec<_>>()
    );
    let current = repository.read(&id).unwrap();
    repository
        .action(&id, action(Action::Cancel, current.revision, "stop-stream"))
        .unwrap();
    assert!(matches!(
        repository.append_run_event(&run.run_id, "assistant_delta", &json!({"delta":"late"})),
        Err(Error::Inactive)
    ));
}

#[test]
fn legacy_conversation_is_backfilled_once_without_duplicating_inherited_messages() {
    let (path, repository, _) = setup();
    let created = create(&repository, "legacy-conversation");
    let run = created.launch.unwrap();
    let id = created.snapshot.id;
    let legacy = json!([
        {"role":"user","content":"A focused presentation about astronomy"},
        {"role":"assistant","content":"Original saved explanation.","tool_calls":[{"id":"old-call","type":"function","function":{"name":"ReadDoeSkill","arguments":"{\"skill\":\"atelier-editorial\"}"}}]},
        {"role":"tool","tool_call_id":"old-call","content":"{\"status\":\"ok\",\"content\":\"Saved skill detail\"}"}
    ]);
    repository.checkpoint(&run.run_id, &legacy).unwrap();
    repository
        .fail(&run.run_id, "fixture", "Saved failure")
        .unwrap();
    let failed = repository.read(&id).unwrap();
    let retry = repository
        .action(&id, action(Action::Retry, failed.revision, "legacy-retry"))
        .unwrap()
        .launch
        .unwrap();
    repository.checkpoint(&retry.run_id, &legacy).unwrap();
    let connection = rusqlite::Connection::open(path.join("yrkie.sqlite3")).unwrap();
    // Model the pre-conversation database while preserving real saved run history.
    connection
        .execute("DELETE FROM conversation_events WHERE project_id=?1", [&id])
        .unwrap();
    connection
        .execute(
            "DELETE FROM conversation_backfills WHERE project_id=?1",
            [&id],
        )
        .unwrap();
    let first = repository.conversation(&id, 0, 500).unwrap();
    let second = repository.conversation(&id, 0, 500).unwrap();
    assert_eq!(first.cursor, second.cursor);
    assert_eq!(first.events.len(), second.events.len());
    assert_eq!(
        first
            .events
            .iter()
            .filter(|event| event.kind == "assistant_delta"
                && event.payload["delta"] == "Original saved explanation.")
            .count(),
        1
    );
    assert_eq!(
        first
            .events
            .iter()
            .filter(|event| event.kind == "tool_result" && event.payload["callId"] == "old-call")
            .count(),
        1
    );
}

#[test]
fn legacy_questions_restore_missing_receipt_and_finish_the_waiting_turn() {
    let (path, repository, _) = setup();
    let created = create(&repository, "legacy-questions");
    let run = created.launch.unwrap();
    let id = created.snapshot.id;
    let questions = vec![projects::Question {
        id: "style".into(),
        question: "Which style?".into(),
        options: vec!["Simple".into(), "Detailed".into()],
    }];
    let legacy = json!([
        {"role":"assistant","tool_calls":[{"id":"pending-question","type":"function","function":{"name":"AskQuestions","arguments":"{}"}}]}
    ]);
    repository
        .set_awaiting_answers(&run.run_id, questions, &legacy)
        .unwrap();
    let connection = rusqlite::Connection::open(path.join("yrkie.sqlite3")).unwrap();
    connection
        .execute("DELETE FROM conversation_events WHERE project_id=?1", [&id])
        .unwrap();
    connection
        .execute(
            "DELETE FROM conversation_backfills WHERE project_id=?1",
            [&id],
        )
        .unwrap();
    let first = repository.conversation(&id, 0, 500).unwrap();
    let receipts = first
        .events
        .iter()
        .filter(|event| event.kind == "tool_result")
        .collect::<Vec<_>>();
    assert_eq!(receipts.len(), 1);
    assert_eq!(receipts[0].payload["itemId"], "pending-question");
    assert_eq!(receipts[0].payload["result"]["requestId"], run.run_id);
    assert_eq!(
        receipts[0].payload["result"]["questions"][0]["question"],
        "Which style?"
    );
    assert_eq!(first.events.last().unwrap().kind, "run_waiting");
    let replay = repository.conversation(&id, 0, 500).unwrap();
    assert_eq!(first.cursor, replay.cursor);
    assert_eq!(first.events.len(), replay.events.len());
}

#[test]
fn chat_edit_commit_is_atomic_idempotent_and_revision_fenced() {
    let (path, repository, _) = setup();
    let id = ready_deck(&repository, "edit-transaction");
    let current = repository.read(&id).unwrap();
    let mut chat = action(Action::Chat, current.revision, "edit-chat");
    chat.expected_deck_revision = Some(1);
    chat.message = Some("Update the heading.".into());
    let launch = repository.action(&id, chat).unwrap().launch.unwrap();
    assert_eq!(launch.stage, projects::RunStage::Edit);
    repository.claim(&launch.run_id).unwrap();
    let mut edited = deck();
    edited["deck"]["slides"][0]["blocks"][0]["props"]["text"] = json!("Changed by chat");
    let history = json!([{"role":"tool","tool_call_id":"edit-call","content":"{\"status\":\"succeeded\",\"committed\":true,\"revision\":2}"}]);
    let saved = repository
        .commit_edit(&launch.run_id, 1, &edited, &history, "edit-call")
        .unwrap();
    assert_eq!(saved.schema_deck.unwrap().revision, 2);
    let replay = repository
        .commit_edit(&launch.run_id, 1, &edited, &history, "edit-call")
        .unwrap();
    assert_eq!(replay.schema_deck.unwrap().revision, 2);
    assert!(matches!(
        repository.commit_edit(&launch.run_id, 1, &deck(), &history, "edit-call"),
        Err(Error::Idempotency)
    ));
    assert!(matches!(
        repository.commit_edit(&launch.run_id, 1, &edited, &history, "another-call"),
        Err(Error::Conflict)
    ));
    let connection = rusqlite::Connection::open(path.join("yrkie.sqlite3")).unwrap();
    let persisted: String = connection
        .query_row(
            "SELECT history_json FROM generation_runs WHERE id=?1",
            [&launch.run_id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(serde_json::from_str::<Value>(&persisted).unwrap(), history);
    repository.finish_edit(&launch.run_id, &history).unwrap();
    assert_eq!(repository.read(&id).unwrap().status, "ready");
    let events = repository.conversation(&id, 0, 500).unwrap();
    assert_eq!(
        events
            .events
            .iter()
            .filter(|event| event.kind == "deck_committed"
                && event.run_id.as_deref() == Some(launch.run_id.as_str()))
            .count(),
        1
    );
}

#[test]
fn unicode_questions_and_user_answers_survive_failure_retry_and_confirmation() {
    let (_, repository, _) = setup();
    let created = create(&repository, "question-flow");
    let id = created.snapshot.id;
    let initial = created.launch.unwrap();
    let question = projects::Question {
        id: "style".into(),
        question: "风".repeat(500),
        options: vec!["简".repeat(450), "繁".repeat(450)],
    };
    repository
        .set_awaiting_answers(&initial.run_id, vec![question], &initial.history)
        .unwrap();
    let current = repository.read(&id).unwrap();
    let mut answered = action(Action::Answer, current.revision, "answer-style");
    answered.answers = Some(vec![projects::Answer {
        id: "style".into(),
        answer: format!("中文，低密度，蓝色品牌，37个数据点。{}", "文".repeat(3000)),
    }]);
    let resumed = repository.action(&id, answered).unwrap().launch.unwrap();
    assert!(resumed.history.to_string().contains("37个数据点"));
    repository
        .fail(
            &resumed.run_id,
            "network_unavailable",
            "The connection failed before the first turn.",
        )
        .unwrap();
    let failed = repository.read(&id).unwrap();
    let retry = repository
        .action(&id, action(Action::Retry, failed.revision, "retry-answers"))
        .unwrap()
        .launch
        .unwrap();
    assert!(retry.history.to_string().contains("37个数据点"));
    repository
        .set_outline(
            &retry.run_id,
            "# page\n## text\nAstronomy\n## text\nStars and planets",
            &outline(),
            &retry.history,
        )
        .unwrap();
    let ready = repository.read(&id).unwrap();
    let mut revise = action(Action::Revise, ready.revision, "revise-source");
    revise.message = Some("Apply these exact edits".into());
    revise.outline_markdown = Some("# page\n## text\nMy edited title".into());
    let revised = repository.action(&id, revise).unwrap().launch.unwrap();
    assert!(revised.history.to_string().contains("My edited title"));
    repository
        .set_outline(
            &revised.run_id,
            "# page\n## text\nAstronomy\n## text\nStars and planets",
            &outline(),
            &revised.history,
        )
        .unwrap();
    let ready = repository.read(&id).unwrap();
    let confirmed = repository
        .action(
            &id,
            action(Action::Confirm, ready.revision, "confirm-answers"),
        )
        .unwrap()
        .launch
        .unwrap();
    assert!(confirmed.history.to_string().contains("37个数据点"));
    assert!(confirmed.history.to_string().contains("My edited title"));
}

#[test]
fn outline_autosave_preserves_page_identity_visual_sources_and_revision_fences() {
    use doe_document::presentation::outline::{image_placeholder, markdown};
    let (_, repository, _) = setup();
    let created = create(&repository, "outline-autosave");
    let id = created.snapshot.id;
    let run = created.launch.unwrap();
    let source = "title=Astronomy\n# page\n## text\nThe solar system\n## generateimg\nratio=16:9\nA wide photograph of the planets.\n# page\n## text\nOur next exploration\n# page\n## text\nThree observations";
    let mut document = markdown::compile(source).unwrap().outline;
    document["visual_plan"] = json!({"pages":[
        {"page_number":1,"role":"subject","reason":"Show the planetary system."},
        {"page_number":2,"role":"subject","source_page":1,"reason":"Reuse the planetary image."},
        {"page_number":3,"role":"native","reason":"A text-only evidence page."}
    ]});
    repository
        .set_outline(&run.run_id, source, &document, &run.history)
        .unwrap();
    let before = repository.read(&id).unwrap();
    let original = before.outline.as_ref().unwrap();
    let first_id = original.document["body"][0]["id"].clone();
    let second_id = original.document["body"][1]["id"].clone();
    let mut edited = original.document.clone();
    edited.as_object_mut().unwrap().remove("visual_plan");
    edited["body"].as_array_mut().unwrap().swap(0, 1);
    edited["body"][0]["contents"][0] = json!("Our edited exploration");
    let save = || SaveOutline {
        expected_revision: before.revision,
        document: edited.clone(),
    };
    let saved = repository.save_outline(&id, save()).unwrap();
    let outline = saved.outline.as_ref().unwrap();
    assert_eq!(saved.revision, before.revision + 1);
    assert_eq!(outline.revision, original.revision + 1);
    assert_eq!(outline.document["body"][0]["id"], second_id);
    assert_eq!(outline.document["body"][1]["id"], first_id);
    assert_eq!(outline.document["body"][0]["index"], 1);
    assert_eq!(
        outline.document["visual_plan"]["pages"][0]["source_page"],
        2
    );
    assert_eq!(
        outline.document["visual_plan"]["pages"][1]["page_number"],
        2
    );
    assert_eq!(image_placeholder::scan(&outline.document).unwrap().len(), 1);
    assert_eq!(saved.run.as_ref().unwrap().id, run.run_id);

    let replayed = repository.save_outline(&id, save()).unwrap();
    assert_eq!(replayed.revision, saved.revision);
    assert_eq!(replayed.updated_at, saved.updated_at);
    let mut stale = save();
    stale.document["body"][0]["contents"][0] = json!("Another window's edit");
    assert!(matches!(
        repository.save_outline(&id, stale),
        Err(Error::Conflict)
    ));

    let mut missing_source = outline.document.clone();
    missing_source["body"].as_array_mut().unwrap().remove(1);
    assert!(matches!(repository.save_outline(&id, SaveOutline {
        expected_revision: saved.revision, document: missing_source,
    }), Err(Error::Invalid(message)) if message.contains("supplies an image")));
    assert_eq!(repository.read(&id).unwrap().revision, saved.revision);
    let mut missing_marker = outline.document.clone();
    missing_marker["body"][1]["contents"]
        .as_array_mut()
        .unwrap()
        .pop();
    assert!(matches!(repository.save_outline(&id, SaveOutline {
        expected_revision: saved.revision, document: missing_marker,
    }), Err(Error::Invalid(message)) if message.contains("planned image")));
    let mut unknown_id = outline.document.clone();
    unknown_id["body"][0]["id"] = json!("new-page-id");
    assert!(matches!(
        repository.save_outline(
            &id,
            SaveOutline {
                expected_revision: saved.revision,
                document: unknown_id,
            }
        ),
        Err(Error::Invalid(_))
    ));

    let mut shortened = outline.document.clone();
    shortened["body"].as_array_mut().unwrap().pop();
    let shortened = repository
        .save_outline(
            &id,
            SaveOutline {
                expected_revision: saved.revision,
                document: shortened,
            },
        )
        .unwrap();
    assert_eq!(
        shortened.outline.as_ref().unwrap().document["page_count"],
        2
    );
    assert_eq!(
        shortened.outline.as_ref().unwrap().document["visual_plan"]["pages"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    let mut revise = action(Action::Revise, shortened.revision, "outline-revise");
    revise.message = Some("Polish the wording".into());
    let active = repository.action(&id, revise).unwrap();
    assert!(matches!(
        repository.save_outline(
            &id,
            SaveOutline {
                expected_revision: active.snapshot.revision,
                document: shortened.outline.as_ref().unwrap().document.clone(),
            }
        ),
        Err(Error::Busy)
    ));
    let active_run = active.launch.unwrap();
    let current = shortened.outline.unwrap();
    repository
        .set_outline(
            &active_run.run_id,
            &current.markdown,
            &current.document,
            &active_run.history,
        )
        .unwrap();
    let ready = repository.read(&id).unwrap();
    let confirmed = repository
        .action(
            &id,
            action(Action::Confirm, ready.revision, "outline-confirm"),
        )
        .unwrap();
    assert!(matches!(repository.save_outline(&id, SaveOutline {
        expected_revision: confirmed.snapshot.revision,
        document: current.document,
    }), Err(Error::Invalid(message)) if message.contains("confirmed")));
}

#[test]
fn state_transitions_are_idempotent_and_confirmation_is_a_user_fence() {
    let (_, repository, _) = setup();
    let first = create(&repository, "create-1");
    let id = first.snapshot.id;
    let run = first.launch.expect("launch");
    assert!(repository.claim(&run.run_id).unwrap());
    assert!(!repository.claim(&run.run_id).unwrap());
    assert!(matches!(
        repository.action(&id, action(Action::Confirm, 1, "too-early")),
        Err(Error::Busy)
    ));
    let replay = create(&repository, "create-1");
    assert_eq!(replay.snapshot.id, id);
    assert!(replay.launch.is_none());
    assert!(matches!(
        repository.create(CreateProject {
            upload_ids: vec![],
            prompt: "Different prompt".into(),
            request_id: "create-1".into()
        }),
        Err(Error::Idempotency)
    ));
    assert!(matches!(
        repository.complete(&run.run_id, &deck()),
        Err(Error::Conflict)
    ));
    repository
        .set_outline(
            &run.run_id,
            "# page\n## text\nAstronomy\n## text\nStars and planets",
            &outline(),
            &json!([]),
        )
        .unwrap();
    let ready = repository.read(&id).unwrap();
    assert_eq!(ready.status, "outline_ready");
    assert!(!ready.outline.unwrap().confirmed);
    assert!(matches!(
        repository.action(&id, action(Action::Confirm, 1, "stale")),
        Err(Error::Conflict)
    ));
    let confirmed = repository
        .action(&id, action(Action::Confirm, ready.revision, "confirm-1"))
        .unwrap();
    assert!(confirmed.snapshot.outline.as_ref().unwrap().confirmed);
    let slides = confirmed.launch.unwrap();
    repository.claim(&slides.run_id).unwrap();
    let replay = repository
        .action(&id, action(Action::Confirm, ready.revision, "confirm-1"))
        .unwrap();
    assert!(replay.launch.is_none());
    repository.complete(&slides.run_id, &deck()).unwrap();
    let complete = repository.read(&id).unwrap();
    assert_eq!(complete.status, "ready");
    assert_eq!(complete.schema_deck.as_ref().unwrap().revision, 1);
    let saved = repository
        .save_deck(
            &id,
            SaveDeck {
                expected_revision: 1,
                deck: deck(),
            },
        )
        .unwrap();
    assert_eq!(saved.revision, 2);
    let project_revision = repository.read(&id).unwrap().revision;
    let replayed = repository
        .save_deck(
            &id,
            SaveDeck {
                expected_revision: 1,
                deck: deck(),
            },
        )
        .unwrap();
    assert_eq!(replayed.revision, saved.revision);
    assert_eq!(replayed.updated_at, saved.updated_at);
    assert_eq!(repository.read(&id).unwrap().revision, project_revision);
    let mut different = deck();
    different["deck"]["title"] = json!("An unsaved edit");
    assert!(matches!(
        repository.save_deck(
            &id,
            SaveDeck {
                expected_revision: 1,
                deck: different
            }
        ),
        Err(Error::Conflict)
    ));
}

#[test]
fn cancel_restart_and_concurrent_requests_cannot_commit_stale_work() {
    let (path, repository, _) = setup();
    let created = create(&repository, "cancel");
    let id = created.snapshot.id;
    let run = created.launch.unwrap();
    repository.claim(&run.run_id).unwrap();
    let cancelled = repository
        .action(&id, action(Action::Cancel, 1, "cancel-1"))
        .unwrap();
    assert_eq!(cancelled.snapshot.status, "cancelled");
    assert!(matches!(
        repository.set_outline(
            &run.run_id,
            "# page\n## text\nAstronomy",
            &outline(),
            &json!([])
        ),
        Err(Error::Inactive)
    ));
    let retry = repository
        .action(
            &id,
            action(Action::Retry, cancelled.snapshot.revision, "retry-1"),
        )
        .unwrap();
    repository.recover_interrupted().unwrap();
    let recovered = repository.read(&id).unwrap();
    assert_eq!(recovered.run.unwrap().status, "interrupted");
    assert!(!repository.is_active(&retry.launch.unwrap().run_id).unwrap());
    let barrier = Arc::new(Barrier::new(2));
    let threads = (0..2)
        .map(|_| {
            let path = path.clone();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                let repo = projects::Repository::open(&path).unwrap();
                barrier.wait();
                create(&repo, "same-concurrent").snapshot.id
            })
        })
        .collect::<Vec<_>>();
    let ids = threads
        .into_iter()
        .map(|thread| thread.join().unwrap())
        .collect::<Vec<_>>();
    assert_eq!(ids[0], ids[1]);
}

#[test]
fn assets_are_real_images_project_scoped_and_image_requests_are_not_replayed() {
    let (_, repository, assets) = setup();
    let a = create(&repository, "asset-a");
    let b = create(&repository, "asset-b");
    assert!(matches!(
        assets.store(&a.snapshot.id, "bad", b"fake image", "upload"),
        Err(Error::Invalid(_))
    ));
    let bytes = png();
    let uploaded = assets
        .store(&a.snapshot.id, "upload-1", &bytes, "upload")
        .unwrap();
    let asset = uploaded.asset_id.unwrap();
    assert_eq!(assets.read(&a.snapshot.id, &asset).unwrap().bytes, bytes);
    assert!(matches!(
        assets.read(&b.snapshot.id, &asset),
        Err(Error::NotFound)
    ));
    assert_eq!(
        assets.list(&a.snapshot.id).unwrap()[0].slide_reference,
        format!("yrkie-asset-data://{asset}")
    );
    let input = assets::GenerateInput {
        request_id: "generated-1".into(),
        prompt: "Planet".into(),
        ratio: "1:1".into(),
        remove_background: false,
    };
    assert!(assets.reserve_job(&a.snapshot.id, &input).unwrap().1);
    assert!(!assets.reserve_job(&a.snapshot.id, &input).unwrap().1);
    assets
        .fail_job(&a.snapshot.id, &input.request_id, "uncertain", true)
        .unwrap();
    assert!(!assets.reserve_job(&a.snapshot.id, &input).unwrap().1);
    let mut changed = input;
    changed.prompt = "Different planet".into();
    assert!(matches!(
        assets.reserve_job(&a.snapshot.id, &changed),
        Err(Error::Idempotency)
    ));
    let run = b.launch.unwrap();
    repository
        .set_outline(
            &run.run_id,
            "# page\n## text\nAstronomy",
            &outline(),
            &json!([]),
        )
        .unwrap();
    let current = repository.read(&b.snapshot.id).unwrap();
    let confirmed = repository
        .action(
            &b.snapshot.id,
            action(Action::Confirm, current.revision, "confirm-asset"),
        )
        .unwrap();
    let mut bad = deck();
    bad["deck"]["slides"][0]["blocks"].as_array_mut().unwrap().push(json!({"id":"image","type":"image","props":{"src":format!("yrkie-asset-data://{asset}")}}));
    assert!(matches!(
        repository.complete(&confirmed.launch.unwrap().run_id, &bad),
        Err(Error::Invalid(_))
    ));
}
