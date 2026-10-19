// 作用：MongoDB 数据库存储模块
use futures::TryStreamExt;
use mongodb::bson::{doc, Document};
use mongodb::{Client, Collection};
use uuid::Uuid;

use crate::error::StorageError;
use crate::types::{Entry, RuntimeContext, Session, SessionData};

pub struct MongoClient {
    client: Client,
    db_name: String,
}

impl MongoClient {
    pub async fn new(connection_string: &str, db_name: &str) -> Result<Self, StorageError> {
        let client = Client::with_uri_str(connection_string)
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?;
        Ok(MongoClient {
            client,
            db_name: db_name.to_string(),
        })
    }
    fn sc(&self) -> Collection<Document> {
        self.client
            .database(&self.db_name)
            .collection("otherone_sessions")
    }
    fn ec(&self) -> Collection<Document> {
        self.client
            .database(&self.db_name)
            .collection("otherone_entries")
    }

    pub async fn create_session(&self) -> Result<String, StorageError> {
        let sid = Uuid::new_v4().to_string();
        self.sc()
            .insert_one(
                doc! {"session_id":&sid,"status":0i32,"create_at":chrono::Utc::now().to_rfc3339()},
            )
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?;
        Ok(sid)
    }

    pub async fn write_entry(
        &self,
        runtime_context: &RuntimeContext,
        session_id: &str,
        role: &str,
        content: &str,
        _tools: Option<&serde_json::Value>,
        token_consumption: Option<u32>,
    ) -> Result<(), StorageError> {
        runtime_context
            .validate()
            .map_err(StorageError::ConfigError)?;
        let eid = Uuid::new_v4().to_string();
        self.ec()
            .insert_one(doc! {
                "partition_key": &runtime_context.partition_key,
                "attributes_json": serde_json::to_string(&runtime_context.attributes).unwrap_or_default(),
                "entry_id":&eid,"session_id":session_id,"role":role,"content":content,
                "token_consumption":token_consumption.map(|t| t as i32).unwrap_or(0),
                "status":0i32,"create_at":chrono::Utc::now().to_rfc3339(),"is_compaction":1i32
            })
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?;
        Ok(())
    }

    pub async fn get_all_sessions(&self) -> Result<Vec<Session>, StorageError> {
        let mut cursor = self
            .sc()
            .find(doc! {"status":0i32})
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?;
        let mut sessions = vec![];
        while let Some(d) = cursor
            .try_next()
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?
        {
            sessions.push(Session {
                partition_key: d.get_str("partition_key").ok().map(ToString::to_string),
                session_id: d.get_str("session_id").unwrap_or("").into(),
                status: d.get_i32("status").unwrap_or(0) as i16,
                create_at: d.get_str("create_at").unwrap_or("").into(),
                attributes: Default::default(),
                metadata: Default::default(),
            });
        }
        Ok(sessions)
    }

    pub async fn read_session(&self, session_id: &str) -> Result<SessionData, StorageError> {
        let s_opt = self
            .sc()
            .find_one(doc! {"session_id":session_id,"status":0i32})
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?;
        let session = match s_opt {
            None => {
                return Ok(SessionData {
                    session: None,
                    entries: vec![],
                    compacted_entries: vec![],
                })
            }
            Some(d) => Session {
                partition_key: d.get_str("partition_key").ok().map(ToString::to_string),
                session_id: d.get_str("session_id").unwrap_or("").into(),
                status: d.get_i32("status").unwrap_or(0) as i16,
                create_at: d.get_str("create_at").unwrap_or("").into(),
                attributes: Default::default(),
                metadata: Default::default(),
            },
        };
        let mut cursor = self
            .ec()
            .find(doc! {"session_id":session_id,"status":0i32})
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?;
        let mut entries = vec![];
        while let Some(d) = cursor
            .try_next()
            .await
            .map_err(|e| StorageError::ConfigError(format!("MongoDB: {}", e)))?
        {
            entries.push(Entry {
                partition_key: d.get_str("partition_key").ok().map(ToString::to_string),
                entry_id: d.get_str("entry_id").unwrap_or("").into(),
                session_id: d.get_str("session_id").unwrap_or("").into(),
                content: d.get_str("content").unwrap_or("").into(),
                role: d.get_str("role").unwrap_or("").into(),
                token_consumption: d.get_i32("token_consumption").ok().map(|v| v as u32),
                status: d.get_i32("status").unwrap_or(0) as i16,
                tools: None,
                create_at: d.get_str("create_at").unwrap_or("").into(),
                is_compaction: d.get_i32("is_compaction").unwrap_or(1) as i16,
                attributes: Default::default(),
                metadata: Default::default(),
            });
        }
        Ok(SessionData {
            session: Some(session),
            entries,
            compacted_entries: vec![],
        })
    }
}
