use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::presentation::repair::canonical_value_sha256 as hash;


#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub slide_id: String,
    pub page_number: i64,
    pub slide_count: i64,
    pub revision: i64,
    pub slide: Value,
    pub shared: Value,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub authoring_markdown: Option<String>,
}


impl Snapshot {
    pub fn authoring_source(&self) -> Result<String, String> {
        match &self.authoring_markdown {
            Some(source) => Ok(source.clone()),
            None => crate::presentation::schema::markdown::serialize_with_layout_overrides(&self.slide),
        }
    }
    pub fn envelope(&self, slide: Value) -> Value {
        json!({"version":4,"pageNumber":self.shared["pageNumber"],"deck":{
            "title":self.shared["title"],"theme":crate::presentation::schema::contract::registered_theme_id(self.shared["theme"].as_str()),"slides":[slide]}})
    }
    pub fn fingerprint(&self) -> String {
        hash(&json!([self.slide, self.shared]))
    }
}
