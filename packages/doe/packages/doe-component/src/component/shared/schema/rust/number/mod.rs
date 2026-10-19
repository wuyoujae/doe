// Origin: app/backend/core/src/slide_agent_output_contract.rs::number
use crate::schema::*;


pub fn number(value: &Value, path: &str) -> Result<(), String> {
    finite_number(value, path).map(|_| ())
}
