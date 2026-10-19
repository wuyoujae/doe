use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::MemoryError;

pub const HEADLESS_POINT_ID: &str = "headless";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryPointKind {
    Headless,
    Root,
    Point,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryPointStatus {
    Active,
    Deactivated,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MemoryPoint {
    pub point_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub kind: MemoryPointKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub storage: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub types: Option<String>,
    pub status: MemoryPointStatus,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "serde_json::Map::is_empty")]
    pub attributes: serde_json::Map<String, serde_json::Value>,
}

impl MemoryPoint {
    pub fn headless() -> Self {
        let now = current_time();
        Self {
            point_id: HEADLESS_POINT_ID.to_string(),
            parent_id: None,
            kind: MemoryPointKind::Headless,
            storage: None,
            types: None,
            status: MemoryPointStatus::Active,
            created_at: now.clone(),
            updated_at: now,
            attributes: serde_json::Map::new(),
        }
    }

    pub fn new_root(
        storage: impl Into<String>,
        types: impl Into<String>,
    ) -> Result<Self, MemoryError> {
        Self::new_with_parent(
            Some(HEADLESS_POINT_ID.to_string()),
            MemoryPointKind::Root,
            storage,
            types,
        )
    }

    pub fn new_child(
        parent_id: impl Into<String>,
        storage: impl Into<String>,
        types: impl Into<String>,
    ) -> Result<Self, MemoryError> {
        Self::new_with_parent(
            Some(parent_id.into()),
            MemoryPointKind::Point,
            storage,
            types,
        )
    }

    pub fn update_types(&mut self, new_types: impl Into<String>) -> Result<(), MemoryError> {
        self.ensure_not_headless("update_types")?;
        let new_types = normalize_required(new_types.into(), "types")?;
        self.types = Some(new_types);
        self.touch();
        Ok(())
    }

    pub fn update_storage(&mut self, new_storage: impl Into<String>) -> Result<(), MemoryError> {
        self.ensure_not_headless("update_storage")?;
        let new_storage = normalize_required(new_storage.into(), "storage")?;
        self.storage = Some(new_storage);
        self.touch();
        Ok(())
    }

    pub fn set_parent(&mut self, parent_id: impl Into<String>) -> Result<(), MemoryError> {
        self.ensure_not_headless("set_parent")?;
        let parent_id = normalize_required(parent_id.into(), "parent_id")?;
        self.parent_id = Some(parent_id);
        self.kind = if self.parent_id.as_deref() == Some(HEADLESS_POINT_ID) {
            MemoryPointKind::Root
        } else {
            MemoryPointKind::Point
        };
        self.touch();
        Ok(())
    }

    pub fn deactivate(&mut self) -> Result<(), MemoryError> {
        self.ensure_not_headless("deactivate")?;
        self.status = MemoryPointStatus::Deactivated;
        self.touch();
        Ok(())
    }

    pub fn reactivate(&mut self) -> Result<(), MemoryError> {
        self.ensure_not_headless("reactivate")?;
        self.status = MemoryPointStatus::Active;
        self.touch();
        Ok(())
    }

    pub fn set_attribute(
        &mut self,
        key: impl Into<String>,
        value: serde_json::Value,
    ) -> Result<(), MemoryError> {
        let key = normalize_required(key.into(), "attribute_key")?;
        self.attributes.insert(key, value);
        self.touch();
        Ok(())
    }

    pub fn remove_attribute(&mut self, key: &str) -> Option<serde_json::Value> {
        let removed = self.attributes.remove(key);
        if removed.is_some() {
            self.touch();
        }
        removed
    }

    pub fn is_headless(&self) -> bool {
        self.kind == MemoryPointKind::Headless
    }

    pub fn is_active(&self) -> bool {
        self.status == MemoryPointStatus::Active
    }

    pub fn validate(&self) -> Result<(), MemoryError> {
        if self.is_headless() {
            if self.point_id != HEADLESS_POINT_ID
                || self.parent_id.is_some()
                || self.storage.is_some()
                || self.types.is_some()
            {
                return Err(MemoryError::InvalidHeadlessPoint);
            }
            return Ok(());
        }

        if self.parent_id.as_deref().unwrap_or("").trim().is_empty() {
            return Err(MemoryError::MissingParent);
        }
        if self.storage.as_deref().unwrap_or("").trim().is_empty() {
            return Err(MemoryError::EmptyField { field: "storage" });
        }
        if self.types.as_deref().unwrap_or("").trim().is_empty() {
            return Err(MemoryError::EmptyField { field: "types" });
        }

        Ok(())
    }

    fn new_with_parent(
        parent_id: Option<String>,
        kind: MemoryPointKind,
        storage: impl Into<String>,
        types: impl Into<String>,
    ) -> Result<Self, MemoryError> {
        let storage = normalize_required(storage.into(), "storage")?;
        let types = normalize_required(types.into(), "types")?;
        let parent_id = parent_id
            .map(|id| normalize_required(id, "parent_id"))
            .transpose()?
            .ok_or(MemoryError::MissingParent)?;
        let now = current_time();

        let point = Self {
            point_id: Uuid::new_v4().to_string(),
            parent_id: Some(parent_id),
            kind,
            storage: Some(storage),
            types: Some(types),
            status: MemoryPointStatus::Active,
            created_at: now.clone(),
            updated_at: now,
            attributes: serde_json::Map::new(),
        };
        point.validate()?;
        Ok(point)
    }

    fn ensure_not_headless(&self, operation: &'static str) -> Result<(), MemoryError> {
        if self.is_headless() {
            return Err(MemoryError::HeadlessModification { operation });
        }
        Ok(())
    }

    fn touch(&mut self) {
        self.updated_at = current_time();
    }
}

fn normalize_required(value: String, field: &'static str) -> Result<String, MemoryError> {
    let value = value.trim().to_string();
    if value.is_empty() {
        return Err(MemoryError::EmptyField { field });
    }
    Ok(value)
}

fn current_time() -> String {
    Utc::now().to_rfc3339()
}
