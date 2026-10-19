// Origin: app/backend/core/src/slide_agent_output_contract.rs::content_object
use crate::schema::*;


pub fn content_object<'a>(
    props: &'a Map<String, Value>,
    path: &str,
) -> Result<&'a Map<String, Value>, String> {
    object(
        required(props, "content", path)?,
        &format!("{path}.content"),
    )
}
