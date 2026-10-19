// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::recovers_one_to_one_hundred_homogeneous_boundary_omissions
use super::*;


#[test]
pub(super) fn recovers_one_to_one_hundred_homogeneous_boundary_omissions() {
    for missing_closer_count in 1..=100usize {
        let slides = (0..missing_closer_count)
            .map(|index| {
                format!(
                    r#"{{"page":{},"contents":{{"message":"业务文本-{index}"}}"#,
                    index + 1
                )
            })
            .collect::<Vec<_>>()
            .join(",");
        let raw = format!(r#"{{"slides":[{slides}]}}"#);
        let compiled = compile_json(&raw, |_| Some(0)).expect("linear repeated repair");
        assert_eq!(compiled.proof.edits.len(), missing_closer_count);
        assert_eq!(
            compiled.value["slides"].as_array().map(Vec::len),
            Some(missing_closer_count)
        );
        assert!(compiled.proof.business_string_invariant_passed);
        assert!(compiled.proof.canonicalization_idempotent);
    }
}
