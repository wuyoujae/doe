// Origin: app/backend/core/src/json_syntax_repair.rs::parse_json_with_syntax_repair_ranked_source
use super::*;


pub fn parse_json_with_syntax_repair_ranked_source(
    raw: &str,
    rank: impl Fn(&Value) -> Option<usize>,
) -> Result<RepairedJsonSource, serde_json::Error> {
    let (candidate, mut wrapper_report) = prepare_candidate(raw);
    match serde_json::from_str::<Value>(&candidate) {
        Ok(value) => Ok(RepairedJsonSource {
            value,
            report: wrapper_report,
        }),
        Err(original_error) => {
            let Some(repaired) = search_minimal_repair(&candidate, rank) else {
                return Err(original_error);
            };
            let value = serde_json::from_str::<Value>(&repaired.text)
                .expect("JSON repair search returns only strictly parsed candidates");
            wrapper_report.edits.extend(repaired.edits);
            Ok(RepairedJsonSource {
                value,
                report: wrapper_report,
            })
        }
    }
}
