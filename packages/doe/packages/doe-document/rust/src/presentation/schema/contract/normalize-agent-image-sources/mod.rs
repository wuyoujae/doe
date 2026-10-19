// Origin: app/backend/core/src/slide_agent_output_contract.rs::normalize_agent_image_sources
use super::*;


pub(super) fn normalize_agent_image_sources(
    value: &mut Value,
    allowed_image_sources: &[String],
) -> Result<usize, String> {
    let mut seen = HashSet::new();
    let allowed = allowed_image_sources
        .iter()
        .filter(|source| is_authoritative_image_source(source))
        .filter(|source| seen.insert(source.as_str()))
        .map(String::as_str)
        .collect::<Vec<_>>();

    fn normalize_source(
        source: &mut String,
        allowed: &[&str],
        image_source_field: bool,
    ) -> Result<usize, String> {
        // Empty Contents media slots are not asset references. Component
        // validation still rejects empty required media/background/logo URLs.
        if source.is_empty() || source == "/yrkie-doe/brand/logo-text.webp" || allowed.contains(&source.as_str()) {
            return Ok(0);
        }
        if !image_source_field && !looks_like_managed_asset_reference(source) {
            return Ok(0);
        }

        let mut best_distance = MAX_ASSET_REFERENCE_EDIT_DISTANCE + 1;
        let mut best_match: Option<&str> = None;
        let mut ambiguous = false;
        for candidate in allowed {
            if !image_source_field && !is_canonical_stable_asset_reference(candidate) {
                continue;
            }
            let Some(distance) = bounded_edit_distance(
                source.as_bytes(),
                candidate.as_bytes(),
                MAX_ASSET_REFERENCE_EDIT_DISTANCE,
            ) else {
                continue;
            };
            if distance < best_distance {
                best_distance = distance;
                best_match = Some(candidate);
                ambiguous = false;
            } else if distance == best_distance {
                ambiguous = true;
            }
        }

        if ambiguous {
            return Err(asset_reference_mismatch());
        }
        let Some(candidate) = best_match else {
            return Err(asset_reference_mismatch());
        };
        *source = candidate.to_string();
        Ok(1)
    }

    fn normalize(
        value: &mut Value,
        allowed: &[&str],
        image_source_field: bool,
    ) -> Result<usize, String> {
        match value {
            Value::String(source) => normalize_source(source, allowed, image_source_field),
            Value::Array(items) => items.iter_mut().try_fold(0usize, |count, item| {
                normalize(item, allowed, false).map(|repairs| count + repairs)
            }),
            Value::Object(object) => object.iter_mut().try_fold(0usize, |count, (key, item)| {
                normalize(item, allowed, key == "src").map(|repairs| count + repairs)
            }),
            _ => Ok(0),
        }
    }

    normalize(value, &allowed, false)
}
