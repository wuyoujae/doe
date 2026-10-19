use super::*;
use crate::db;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::{fs, io::Write, path::Path};

impl Service {
    pub fn open(data_dir: &Path) -> Result<Self> {
        fs::create_dir_all(data_dir)?;
        let path = data_dir.join("yrkie.sqlite3");
        let mut db = db::connect(&path)?;
        db::migrate(&mut db).map_err(unavailable)?;
        let cookie = data_dir.join("playback-owner-token");
        let owner = match fs::read_to_string(&cookie) {
            Ok(value) if valid_link(value.trim()) => value.trim().to_owned(),
            Ok(_) => return Err(Error("playback_unavailable")),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                let value = random_id();
                let mut options = fs::OpenOptions::new();
                options.write(true).create_new(true);
                #[cfg(unix)]
                {
                    use std::os::unix::fs::OpenOptionsExt;
                    options.mode(0o600);
                }
                let mut file = options.open(cookie)?;
                file.write_all(value.as_bytes())?;
                file.sync_all()?;
                value
            }
            Err(e) => return Err(e.into()),
        };
        Ok(Self {
            path,
            owner,
            lives: Mutex::new(HashMap::new()),
        })
    }
    /// Only the same-origin settings entry point may establish the local owner's HttpOnly cookie.
    pub fn cookie_header(&self) -> String {
        format!(
            "{OWNER_COOKIE}={}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000",
            self.owner
        )
    }
    fn authorize(&self, token: Option<&str>) -> Result<()> {
        let Some(token) = token else {
            return Err(Error("playback_login"));
        };
        if token.len() != self.owner.len()
            || token
                .bytes()
                .zip(self.owner.bytes())
                .fold(0u8, |x, (a, b)| x | (a ^ b))
                != 0
        {
            return Err(Error("playback_forbidden"));
        }
        Ok(())
    }
    pub fn settings(&self, project: &str) -> Result<Settings> {
        let mut db = db::connect(&self.path)?;
        let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let exists: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM projects WHERE id=?1 AND deck_json IS NOT NULL)",
            [project],
            |r| r.get(0),
        )?;
        if !exists {
            return Err(Error("playback_not_found"));
        }
        tx.execute("INSERT OR IGNORE INTO playbacks(project_id,presenter_link,audience_link) VALUES (?1,?2,?3)",params![project,random_id(),random_id()])?;
        let result = read_settings(&tx, project)?;
        tx.commit()?;
        Ok(result)
    }
    pub fn save_access(
        &self,
        project: &str,
        token: Option<&str>,
        input: SaveAccess,
    ) -> Result<Settings> {
        self.authorize(token)?;
        if [
            &input.presenter.access,
            &input.presenter.operate,
            &input.audience.access,
            &input.audience.operate,
        ]
        .iter()
        .any(|v| v.as_str() != "owner")
        {
            return Err(Error("playback_invalid"));
        }
        let settings = self.settings(project)?;
        if settings.revision != input.expected_revision {
            return Err(Error("playback_conflict"));
        }
        Ok(settings)
    }
    pub(super) fn grant(&self, db: &Connection, link: &str, token: Option<&str>) -> Result<Grant> {
        self.authorize(token)?;
        if !valid_link(link) {
            return Err(Error("playback_not_found"));
        }
        let row=db.query_row("SELECT p.project_id,p.source_revision,p.snapshot_json,p.presenter_link FROM playbacks p JOIN projects d ON d.id=p.project_id WHERE p.presenter_link=?1 OR p.audience_link=?1",[link],|r|Ok((r.get::<_,String>(0)?,r.get::<_,u64>(1)?,r.get::<_,Option<String>>(2)?,r.get::<_,String>(3)?))).optional()?.ok_or(Error("playback_not_found"))?;
        let settings = read_settings(db, &row.0)?;
        Ok(Grant {
            project: row.0,
            key: row.3.clone(),
            role: if link == row.3 {
                "presenter"
            } else {
                "audience"
            },
            settings,
            snapshot: serde_json::from_str(&row.2.ok_or(Error("playback_ended"))?)?,
            source_revision: row.1,
        })
    }
    pub fn start(&self, project: &str, token: Option<&str>, input: Start) -> Result<Settings> {
        self.authorize(token)?;
        let settings = self.settings(project)?;
        let mut lives = self.lives.lock().map_err(unavailable)?;
        lives.retain(|_, live| live.expires > now());
        let mut db = db::connect(&self.path)?;
        let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let (revision, raw) = tx
            .query_row(
                "SELECT deck_revision,deck_json FROM projects WHERE id=?1",
                [project],
                |r| Ok((r.get::<_, u64>(0)?, r.get::<_, String>(1)?)),
            )
            .optional()?
            .ok_or(Error("playback_not_found"))?;
        if revision != input.source_revision {
            return Err(Error("playback_conflict"));
        }
        if lives.contains_key(&settings.presenter_link) && !input.restart {
            tx.commit()?;
            return Ok(settings);
        }
        if lives.len() >= 256 && !lives.contains_key(&settings.presenter_link) {
            return Err(Error("playback_capacity"));
        }
        let deck: Value = serde_json::from_str(&raw)?;
        let (show, notes) =
            projection::make_show(&deck, &input.motions).map_err(|_| Error("playback_invalid"))?;
        let snapshot = json!({"show":show,"notes":notes,"token":random_id()});
        tx.execute(
            "UPDATE playbacks SET snapshot_json=?2,source_revision=?3 WHERE project_id=?1",
            params![project, snapshot.to_string(), revision],
        )?;
        let counts: Vec<usize> = snapshot["show"]["motion"]
            .as_array()
            .ok_or(Error("playback_invalid"))?
            .iter()
            .map(|m| {
                m["cues"]
                    .as_array()
                    .map(|c| c.iter().filter(|c| c["trigger"] == "click").count())
                    .unwrap_or(0)
            })
            .collect();
        let time = now();
        let state = json!({"epoch":random_id(),"snapshotToken":snapshot["token"],"index":0,"step":0,"at":time,"black":false,"revision":0,"seq":0,"startedAt":time,"counts":counts,"ink":{},"generations":{},"erased":{}});
        tx.commit()?;
        if let Some(previous) = lives.remove(&settings.presenter_link) {
            let _ = previous.sender.send(json!({"kind":"restart"}));
        }
        let (sender, _) = broadcast::channel(256);
        lives.insert(
            settings.presenter_link.clone(),
            Live {
                state,
                sender,
                expires: time + LIVE_TTL_MS,
                commands: VecDeque::new(),
                rate: VecDeque::new(),
            },
        );
        Ok(settings)
    }
    pub fn snapshot(&self, link: &str, token: Option<&str>) -> Result<Value> {
        let lives = self.lives.lock().map_err(unavailable)?;
        let db = db::connect(&self.path)?;
        let grant = self.grant(&db, link, token)?;
        let live = active(&lives, &grant.key)?;
        let mut value = json!({"capabilities":capability(&grant),"runtime":public_runtime(live),"show":grant.snapshot["show"],"sourceRevision":grant.source_revision,"serverTime":now()});
        if grant.role == "presenter" {
            value["notes"] = json!(snapshot_notes(&db, &grant)?);
        }
        Ok(value)
    }
    pub fn subscribe(&self, link: &str, token: Option<&str>) -> Result<Subscription> {
        let lives = self.lives.lock().map_err(unavailable)?;
        let db = db::connect(&self.path)?;
        let grant = self.grant(&db, link, token)?;
        let live = active(&lives, &grant.key)?;
        // Under the same reducer lock, subscribe before capturing the initial state.
        let receiver = live.sender.subscribe();
        Ok(Subscription {
            receiver,
            initial: json!({"kind":"sync","runtime":public_runtime(live),"epoch":live.state["epoch"],"capabilities":capability(&grant)}),
        })
    }
    pub fn heartbeat(&self, link: &str, token: Option<&str>) -> Result<Value> {
        let lives = self.lives.lock().map_err(unavailable)?;
        let db = db::connect(&self.path)?;
        let grant = self.grant(&db, link, token)?;
        active(&lives, &grant.key)?;
        Ok(json!({"kind":"heartbeat","capabilities":capability(&grant)}))
    }
    pub fn asset_project(&self, link: &str, asset: &str, token: Option<&str>) -> Result<String> {
        if !valid_link(asset) {
            return Err(Error("playback_not_found"));
        }
        let lives = self.lives.lock().map_err(unavailable)?;
        let db = db::connect(&self.path)?;
        let grant = self.grant(&db, link, token)?;
        active(&lives, &grant.key)?;
        fn has(node: &Value, reference: &str) -> bool {
            match node {
                Value::String(v) => v == reference,
                Value::Array(v) => v.iter().any(|v| has(v, reference)),
                Value::Object(v) => v.values().any(|v| has(v, reference)),
                _ => false,
            }
        }
        if !has(
            &grant.snapshot["show"],
            &format!("yrkie-asset-data://{asset}"),
        ) {
            return Err(Error("playback_not_found"));
        }
        Ok(grant.project)
    }
    pub fn note(
        &self,
        link: &str,
        slide: &str,
        token: Option<&str>,
        input: Option<SaveNote>,
    ) -> Result<Value> {
        let lives = self.lives.lock().map_err(unavailable)?;
        let mut db = db::connect(&self.path)?;
        let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let grant = self.grant(&tx, link, token)?;
        let live = active(&lives, &grant.key)?;
        if grant.role != "presenter" {
            return Err(Error("playback_forbidden"));
        }
        if slide.is_empty() || slide.len() > 512 {
            return Err(Error("playback_invalid"));
        }
        let (index, page) = grant.snapshot["show"]["slides"]
            .as_array()
            .ok_or(Error("playback_invalid"))?
            .iter()
            .enumerate()
            .find(|(_, v)| v["id"].as_str() == Some(slide))
            .ok_or(Error("playback_not_found"))?;
        let hash = format!("{:x}", Sha256::digest(serde_json::to_vec(page)?));
        let row=tx.query_row("SELECT content,revision,source_slide_sha256 FROM playback_notes WHERE project_id=?1 AND slide_id=?2",params![grant.project,slide],|r|Ok((r.get::<_,String>(0)?,r.get::<_,u64>(1)?,r.get::<_,String>(2)?))).optional()?;
        let (mut content, mut revision, mut changed) =
            row.map(|(c, r, h)| (c, r, h != hash)).unwrap_or_else(|| {
                (
                    grant.snapshot["notes"][index]
                        .as_str()
                        .unwrap_or("")
                        .to_owned(),
                    0,
                    false,
                )
            });
        if let Some(input) = input {
            if input.content.len() > 60000
                || input.content.contains('\0')
                || !valid_link(&input.epoch)
            {
                return Err(Error("playback_invalid"));
            }
            if live.state["epoch"].as_str() != Some(input.epoch.as_str()) {
                return Err(Error("playback_ended"));
            }
            let same = revision > 0 && content == input.content && !changed;
            if revision != input.expected_revision && !same {
                return Err(Error("playback_conflict"));
            }
            if !same {
                tx.execute("INSERT INTO playback_notes(project_id,slide_id,content,revision,source_revision,source_slide_sha256) VALUES (?1,?2,?3,1,?4,?5) ON CONFLICT(project_id,slide_id) DO UPDATE SET content=excluded.content,revision=playback_notes.revision+1,source_revision=excluded.source_revision,source_slide_sha256=excluded.source_slide_sha256",params![grant.project,slide,input.content,grant.source_revision,hash])?;
                content = input.content;
                revision += 1;
                changed = false;
            }
        }
        tx.commit()?;
        Ok(
            json!({"slideId":slide,"content":content,"revision":revision,"canEdit":true,"sourceChanged":changed}),
        )
    }
}
fn read_settings(db: &Connection, project: &str) -> Result<Settings> {
    Ok(db
        .query_row(
            "SELECT revision,presenter_link,audience_link FROM playbacks WHERE project_id=?1",
            [project],
            |r| {
                Ok(Settings {
                    revision: r.get(0)?,
                    presenter_link: r.get(1)?,
                    audience_link: r.get(2)?,
                    presenter: Access {
                        access: "owner",
                        operate: "owner",
                    },
                    audience: Access {
                        access: "owner",
                        operate: "owner",
                    },
                })
            },
        )
        .optional()?
        .ok_or(Error("playback_not_found"))?)
}
fn snapshot_notes(db: &Connection, grant: &Grant) -> Result<Vec<String>> {
    let mut query =
        db.prepare("SELECT slide_id,content FROM playback_notes WHERE project_id=?1")?;
    let notes = query
        .query_map([&grant.project], |r| {
            Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
        })?
        .collect::<std::result::Result<HashMap<_, _>, _>>()?;
    Ok(grant.snapshot["show"]["slides"]
        .as_array()
        .ok_or(Error("playback_invalid"))?
        .iter()
        .enumerate()
        .map(|(i, s)| {
            notes
                .get(s["id"].as_str().unwrap_or(""))
                .cloned()
                .unwrap_or_else(|| grant.snapshot["notes"][i].as_str().unwrap_or("").into())
        })
        .collect())
}
pub(super) fn active<'a>(lives: &'a HashMap<String, Live>, key: &str) -> Result<&'a Live> {
    lives
        .get(key)
        .filter(|v| v.expires > now())
        .ok_or(Error("playback_ended"))
}
pub(super) fn public_runtime(live: &Live) -> Value {
    let mut state = live.state.clone();
    if let Some(map) = state.as_object_mut() {
        map.remove("erased");
        map.remove("snapshotToken");
        map.remove("counts");
    }
    state
}
