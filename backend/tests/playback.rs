use serde_json::{Value, json};
use std::path::PathBuf;
use yrkie_backend::playback::{SaveNote, Service, Start};

struct Fixture {
    dir: PathBuf,
    service: Service,
    project: String,
    token: String,
}
impl Fixture {
    fn new() -> Self {
        let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../test/20261019-original-core/playback")
            .join(uuid::Uuid::new_v4().to_string());
        let service = Service::open(&dir).unwrap();
        let project = format!("srv-{}", uuid::Uuid::new_v4());
        let deck = json!({"version":4,"pageNumber":{"enabled":true},"deck":{"title":"Original player","theme":"paper","slides":[
            {"id":"first","notes":"secret speaker note","blocks":[{"id":"heading","type":"heading","props":{"text":"First"}}],"presentation":{"cues":[{"id":"cue","target":"heading","effect":"fade","trigger":"click","duration":480,"delay":0}]}},
            {"id":"second","blocks":[{"id":"text","type":"text","props":{"text":"Second"}}]}
        ]}});
        let db = rusqlite::Connection::open(dir.join("yrkie.sqlite3")).unwrap();
        db.execute("INSERT INTO projects(id,title,prompt,status,deck_json,deck_revision) VALUES (?1,'Player','Player test','ready',?2,3)",rusqlite::params![project,deck.to_string()]).unwrap();
        let token = service
            .cookie_header()
            .split(';')
            .next()
            .unwrap()
            .split_once('=')
            .unwrap()
            .1
            .to_owned();
        Self {
            dir,
            service,
            project,
            token,
        }
    }
    fn start(&self) -> yrkie_backend::playback::Settings {
        self.service
            .start(
                &self.project,
                Some(&self.token),
                Start {
                    source_revision: 3,
                    motions: Value::Null,
                    restart: false,
                },
            )
            .unwrap()
    }
    fn command(&self, snapshot: &Value, action: &str) -> Value {
        json!({"action":action,"clientId":"a".repeat(64),"commandId":format!("{}{}",uuid::Uuid::new_v4().simple(),uuid::Uuid::new_v4().simple()),"epoch":snapshot["runtime"]["epoch"],"revision":snapshot["runtime"]["revision"],"index":snapshot["runtime"]["index"],"generation":snapshot["runtime"]["generations"][snapshot["runtime"]["index"].as_u64().unwrap().to_string()].as_u64().unwrap_or(0)})
    }
}

#[test]
fn exact_roles_private_notes_and_owner_identity() {
    let f = Fixture::new();
    let settings = f.start();
    assert_eq!(
        f.service
            .snapshot(&settings.presenter_link, None)
            .unwrap_err()
            .0,
        "playback_login"
    );
    assert_eq!(
        f.service
            .snapshot(&settings.audience_link, Some(&"b".repeat(64)))
            .unwrap_err()
            .0,
        "playback_forbidden"
    );
    let presenter = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    let audience = f
        .service
        .snapshot(&settings.audience_link, Some(&f.token))
        .unwrap();
    assert_eq!(presenter["capabilities"]["role"], "presenter");
    assert_eq!(audience["capabilities"]["role"], "audience");
    assert_eq!(presenter["notes"][0], "secret speaker note");
    assert!(audience.get("notes").is_none());
    assert!(!audience.to_string().contains("secret speaker note"));
    assert_eq!(
        f.service
            .note(&settings.audience_link, "first", Some(&f.token), None)
            .unwrap_err()
            .0,
        "playback_forbidden"
    );
}

#[test]
fn original_navigation_atomic_fences_and_broadcast() {
    let f = Fixture::new();
    let settings = f.start();
    let mut stream = f
        .service
        .subscribe(&settings.audience_link, Some(&f.token))
        .unwrap();
    assert_eq!(stream.initial["kind"], "sync");
    let snapshot = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    let command = f.command(&snapshot, "next");
    f.service
        .command(&settings.presenter_link, Some(&f.token), command.clone())
        .unwrap();
    let event = stream.receiver.try_recv().unwrap();
    assert_eq!(event["seq"], 1);
    assert_eq!(event["position"]["step"], 1);
    assert_eq!(event["position"]["index"], 0);
    // A genuine retry is idempotent even after the authoritative revision moved.
    f.service
        .command(&settings.presenter_link, Some(&f.token), command)
        .unwrap();
    assert!(stream.receiver.try_recv().is_err());
    let stale = f.command(&snapshot, "next");
    assert_eq!(
        f.service
            .command(&settings.presenter_link, Some(&f.token), stale)
            .unwrap_err()
            .0,
        "playback_conflict"
    );
    let snapshot = f
        .service
        .snapshot(&settings.audience_link, Some(&f.token))
        .unwrap();
    f.service
        .command(
            &settings.audience_link,
            Some(&f.token),
            f.command(&snapshot, "next"),
        )
        .unwrap();
    let event = stream.receiver.try_recv().unwrap();
    assert_eq!(event["position"]["index"], 1);
    assert_eq!(event["position"]["step"], 0);
    let snapshot = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    f.service
        .command(
            &settings.presenter_link,
            Some(&f.token),
            f.command(&snapshot, "previous"),
        )
        .unwrap();
    let event = stream.receiver.try_recv().unwrap();
    assert_eq!(event["position"]["index"], 0);
    assert_eq!(event["position"]["step"], 1);
    assert_eq!(event["position"]["at"], 0);
}

#[test]
fn original_ink_tombstones_clear_generation_and_volatile_laser() {
    let f = Fixture::new();
    let settings = f.start();
    let snapshot = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    let mut ink = f.command(&snapshot, "ink");
    ink["stroke"] = json!({"id":"c".repeat(64),"color":"#ef4444","tool":"pen","width":3,"points":[[0.2,0.3],[0.4,0.5]]});
    f.service
        .command(&settings.presenter_link, Some(&f.token), ink.clone())
        .unwrap();
    let snapshot = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    assert_eq!(snapshot["runtime"]["seq"], 1);
    assert_eq!(snapshot["runtime"]["revision"], 0);
    let mut erase = f.command(&snapshot, "erase");
    erase["strokeId"] = json!("c".repeat(64));
    f.service
        .command(&settings.presenter_link, Some(&f.token), erase)
        .unwrap();
    ink["commandId"] = json!("d".repeat(64));
    assert_eq!(
        f.service
            .command(&settings.presenter_link, Some(&f.token), ink)
            .unwrap_err()
            .0,
        "playback_conflict"
    );
    f.service
        .command(
            &settings.presenter_link,
            Some(&f.token),
            f.command(&snapshot, "clear"),
        )
        .unwrap();
    let snapshot = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    assert_eq!(snapshot["runtime"]["generations"]["0"], 1);
    let mut laser = f.command(&snapshot, "laser");
    laser["point"] = json!([0.5, 0.5]);
    f.service
        .command(&settings.presenter_link, Some(&f.token), laser)
        .unwrap();
    let after = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    assert_eq!(snapshot["runtime"], after["runtime"]);
}

#[test]
fn notes_cas_idempotency_restart_fence_and_persistence() {
    let f = Fixture::new();
    let settings = f.start();
    let snapshot = f
        .service
        .snapshot(&settings.presenter_link, Some(&f.token))
        .unwrap();
    let epoch = snapshot["runtime"]["epoch"].as_str().unwrap();
    let saved = f
        .service
        .note(
            &settings.presenter_link,
            "first",
            Some(&f.token),
            Some(SaveNote {
                content: "My revised note".into(),
                expected_revision: 0,
                epoch: epoch.into(),
            }),
        )
        .unwrap();
    assert_eq!(saved["revision"], 1);
    let retry = f
        .service
        .note(
            &settings.presenter_link,
            "first",
            Some(&f.token),
            Some(SaveNote {
                content: "My revised note".into(),
                expected_revision: 0,
                epoch: epoch.into(),
            }),
        )
        .unwrap();
    assert_eq!(retry["revision"], 1);
    assert_eq!(
        f.service
            .note(
                &settings.presenter_link,
                "first",
                Some(&f.token),
                Some(SaveNote {
                    content: "Another note".into(),
                    expected_revision: 0,
                    epoch: epoch.into()
                })
            )
            .unwrap_err()
            .0,
        "playback_conflict"
    );
    f.service
        .start(
            &f.project,
            Some(&f.token),
            Start {
                source_revision: 3,
                motions: Value::Null,
                restart: true,
            },
        )
        .unwrap();
    assert_eq!(
        f.service
            .note(
                &settings.presenter_link,
                "first",
                Some(&f.token),
                Some(SaveNote {
                    content: "Late update".into(),
                    expected_revision: 1,
                    epoch: epoch.into()
                })
            )
            .unwrap_err()
            .0,
        "playback_ended"
    );
    let reopened = Service::open(&f.dir).unwrap();
    assert_eq!(
        reopened
            .snapshot(&settings.presenter_link, Some(&f.token))
            .unwrap_err()
            .0,
        "playback_ended"
    );
    reopened
        .start(
            &f.project,
            Some(&f.token),
            Start {
                source_revision: 3,
                motions: Value::Null,
                restart: false,
            },
        )
        .unwrap();
    assert_eq!(
        reopened
            .note(&settings.presenter_link, "first", Some(&f.token), None)
            .unwrap()["content"],
        "My revised note"
    );
}
