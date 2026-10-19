// Origin: app/backend/core/src/slide_auto_repair_v2/tests.rs::valid_deck


pub(super) fn valid_deck(body: &str) -> String {
    format!(
        r#"{{"version":4,"pageNumber":{{"enabled":true,"format":"number"}},"deck":{{"title":"Deck","theme":"yrkie-theme","slides":[{{"id":"slide-1","size":{{"width":960,"height":540,"unit":"pt"}},"blocks":[{{"id":"body","type":"text","props":{{"text":{body}}}}}]}}]}}}}"#
    )
}
