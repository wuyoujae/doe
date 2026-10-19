// Origin: app/backend/core/src/slide_agent_output_contract/validation/tests.rs::cases
use super::*;


pub(super) fn cases() -> Value {
    serde_json::from_str(include_str!("../../../../../../../../src/document/presentation/schema/authoring/schemas/doe-slide-v4.examples.json")).unwrap()
}
