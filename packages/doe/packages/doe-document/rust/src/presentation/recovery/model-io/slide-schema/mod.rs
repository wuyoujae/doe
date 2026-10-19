// Origin: app/backend/core/src/slide_recovery/model_io.rs::slide_schema
use super::*;


pub(super) fn slide_schema(expectations: SlideDeckExpectations) -> Value {
    slide_agent_output_contract::response_format(expectations)["json_schema"]["schema"]
        ["properties"]["deck"]["properties"]["slides"]["items"]
        .clone()
}
