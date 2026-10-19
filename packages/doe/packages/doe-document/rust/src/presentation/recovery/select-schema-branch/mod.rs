// Origin: app/backend/core/src/slide_recovery/mod.rs::select_schema_branch
use super::*;


pub(super) fn select_schema_branch<'a>(schema: &'a Value, value: &Value) -> Option<&'a Value> {
    let branches = schema.get("anyOf")?.as_array()?;
    let mut best_score = None;
    let mut best = None;
    let mut ambiguous = false;
    for branch in branches {
        let Some(score) = schema_match_score(branch, value) else {
            continue;
        };
        match best_score {
            None => {
                best_score = Some(score);
                best = Some(branch);
                ambiguous = false;
            }
            Some(current) if score > current => {
                best_score = Some(score);
                best = Some(branch);
                ambiguous = false;
            }
            Some(current) if score == current => ambiguous = true,
            _ => {}
        }
    }
    (!ambiguous).then_some(best).flatten()
}
