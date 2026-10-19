//! Strict external author input. Never repair, execute or echo submitted data.
use serde::de::{self, DeserializeSeed, MapAccess, SeqAccess, Visitor};

use serde::Serialize;

use serde_json::{Map, Value};

use std::fmt;


pub const MAX_REQUEST_BYTES: usize = 2 * 1024 * 1024;

pub const MAX_DOCUMENT_BYTES: usize = 1024 * 1024;

pub const MAX_ISSUES: usize = 50;


#[derive(Debug, Serialize)]
pub struct Issue {
    pub path: String,
    pub code: String,
    pub message: String,
    pub hint: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Failure {
    pub error: String,
    pub message: String,
    pub issues: Vec<Issue>,
    pub truncated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<usize>,
}

impl From<String> for Failure {
    fn from(code: String) -> Self {
        Self::from(code.as_str())
    }
}

impl From<&str> for Failure {
    fn from(code: &str) -> Self {
        let message = match code {
            "outline_not_confirmed" => "Confirm this project's outline before writing slides.",
            "outline_images_not_ready" => "Wait for outline images and their credit settlement to finish. Read outline_image_status before retrying.",
            "slide_revision_conflict" => "The saved deck changed. Read the latest deck state and affected pages, obtain approval for the new content and use a new requestId.",
            "slides_not_found" => "This project has no saved deck. Create the complete approved deck first.",
            "slide_page_out_of_range" => "This page is unavailable. Read current project information and page numbers.",
            "slide_unavailable" => "The saved deck state cannot be edited safely. Open it in the application before retrying.",
            "last_slide_required" => "Keep at least one slide, as required by the DOE editor.",
            "asset_unavailable" => "This image is expired or unavailable to this project. Upload the approved image again with a new requestId.",
            "asset_metadata_conflict" => "The same image has a different role or ratio in this project. Reuse its original metadata.",
            "image_capacity_reached" => "Too many unbound images. Save approved images in an outline or wait for unused uploads to expire.",
            "upload_in_progress" => "An image upload is still being processed. Retry the identical request after it completes or its lease expires.",
            "outline_not_found" => "This project has no selected outline. Save a draft before confirming it.",
            "images_not_failed" => "Only a failed image job can be retried. Read image status first.",
            "confirmation_expired" => "Prepare this action again and show the current review before confirming.",
            "confirmation_changed" => "The prepared content, entitlements or image job changed. Prepare again and obtain approval for the current action.",
            "paid_generation_not_approved" => "The user must approve the disclosed image charges before generation can start.",
            "insufficient_credits" => "Image generation requires a positive credit balance. No new confirmation or generation was committed.",
            "image_service_unavailable" => "Platform image generation is not configured for this action. Save the draft and retry preparation after service recovery.",
            "confirmation_preview_too_large" => "The confirmation review is too large. Reduce the image plan descriptions or number of placements and save an approved new draft.",

            "validation_failed" => "The request was rejected. Fix the listed fields and resubmit; nothing was saved.",
            "invalid_json" => "Invalid JSON, duplicate object keys, or nesting beyond the endpoint limit. Send one strict JSON object without fences, comments or trailing data.",
            "request_too_large" => "The request exceeds this endpoint's size limit. Reduce content before resubmitting.",
            "outline_conflict" => "The current outline changed. Read project information and the current outline before deciding whether to replace it; use its version and revision.",
            "outline_confirmed" => "This project already has a confirmed outline. The application does not allow replacing it. Create a new project for a new draft.",
            "idempotency_conflict" => "This requestId was used for a different operation or input. Reuse it only for an identical retry; use a new UUID for a new operation.",
            "project_format_unsupported" => "Creation is currently supported only for DOE inventor projects using slide-schema-v4 / schema-v4.",
            "insufficient_scope" => "This connection lacks creation permission. Reconnect through browser authorization; existing read permissions are unchanged.",
            "project_reference_expired_or_unavailable" => "The project reference expired or is unavailable for this connection. Find the project again.",
            "invalid_token" => "The account connection expired or was revoked. Reconnect to continue.",
            "rate_limited" => "The write rate limit was reached. Wait before retrying the identical request with the same requestId.",
            "reference_capacity_reached" => "The connection has too many active project references. Wait for references to expire.",
            _ => "The operation could not complete. Retry the identical request with the same requestId after the service recovers.",
        };
        let error = match code {
            "outline_not_confirmed"
            | "outline_images_not_ready" | "slide_revision_conflict" | "slides_not_found" | "slide_page_out_of_range" | "slide_unavailable" | "last_slide_required"
            | "asset_unavailable"
            | "asset_metadata_conflict"
            | "image_capacity_reached"
            | "upload_in_progress"
            | "outline_not_found"
            | "images_not_failed"
            | "confirmation_expired"
            | "confirmation_changed"
            | "paid_generation_not_approved"
            | "insufficient_credits"
            | "image_service_unavailable"
            | "confirmation_preview_too_large"
            | "validation_failed"
            | "invalid_json"
            | "request_too_large"
            | "outline_conflict"
            | "outline_confirmed"
            | "idempotency_conflict"
            | "project_format_unsupported"
            | "insufficient_scope"
            | "project_reference_expired_or_unavailable"
            | "invalid_token"
            | "rate_limited"
            | "reference_capacity_reached" => code,
            _ => "temporarily_unavailable",
        };
        Self {
            error: error.into(),
            message: message.into(),
            issues: vec![],
            truncated: false,
            line: None,
            column: None,
        }
    }
}

impl Failure {
    pub fn issue(&mut self, path: &str, code: &str, message: &str, hint: &str) {
        if self.issues.len() == MAX_ISSUES {
            self.truncated = true;
            return;
        }
        self.issues.push(Issue {
            path: path.into(),
            code: code.into(),
            message: message.into(),
            hint: hint.into(),
        });
    }
    pub fn finish(self) -> Result<(), Self> {
        if self.issues.is_empty() {
            Ok(())
        } else {
            Err(self)
        }
    }
}


struct StrictValue(usize, usize);

impl<'de> DeserializeSeed<'de> for StrictValue {
    type Value = Value;
    fn deserialize<D: de::Deserializer<'de>>(self, d: D) -> Result<Value, D::Error> {
        if self.0 > self.1 {
            return Err(de::Error::custom("nesting limit"));
        }
        d.deserialize_any(self)
    }
}

impl<'de> Visitor<'de> for StrictValue {
    type Value = Value;
    fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("strict JSON")
    }
    fn visit_bool<E: de::Error>(self, v: bool) -> Result<Value, E> {
        Ok(v.into())
    }
    fn visit_i64<E: de::Error>(self, v: i64) -> Result<Value, E> {
        Ok(v.into())
    }
    fn visit_u64<E: de::Error>(self, v: u64) -> Result<Value, E> {
        Ok(v.into())
    }
    fn visit_f64<E: de::Error>(self, v: f64) -> Result<Value, E> {
        serde_json::Number::from_f64(v)
            .map(Value::Number)
            .ok_or_else(|| de::Error::custom("nonfinite number"))
    }
    fn visit_str<E: de::Error>(self, v: &str) -> Result<Value, E> {
        Ok(v.into())
    }
    fn visit_string<E: de::Error>(self, v: String) -> Result<Value, E> {
        Ok(v.into())
    }
    fn visit_unit<E: de::Error>(self) -> Result<Value, E> {
        Ok(Value::Null)
    }
    fn visit_seq<A: SeqAccess<'de>>(self, mut seq: A) -> Result<Value, A::Error> {
        let mut values = vec![];
        while let Some(v) = seq.next_element_seed(StrictValue(self.0 + 1, self.1))? {
            values.push(v);
        }
        Ok(Value::Array(values))
    }
    fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<Value, A::Error> {
        let mut values = Map::new();
        while let Some(key) = map.next_key::<String>()? {
            if values.contains_key(&key) {
                return Err(de::Error::custom("duplicate key"));
            }
            values.insert(key, map.next_value_seed(StrictValue(self.0 + 1, self.1))?);
        }
        Ok(Value::Object(values))
    }
}
#[path = "parse/mod.rs"]
mod function_parse;
pub use function_parse::parse;

#[path = "parse-with-limit/mod.rs"]
mod function_parse_with_limit;
pub use function_parse_with_limit::parse_with_limit;

#[path = "parse-bounded/mod.rs"]
mod function_parse_bounded;
 use function_parse_bounded::parse_bounded;

