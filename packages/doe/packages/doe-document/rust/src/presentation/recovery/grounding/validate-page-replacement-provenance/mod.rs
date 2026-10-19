// Origin: app/backend/core/src/slide_recovery/grounding.rs::validate_page_replacement_provenance
use super::*;


pub fn validate_page_replacement_provenance(
    plan: &SlidePageRepairPlan,
    replacements: &[SlidePageReplacement],
    provider_context: &Value,
    mode: ReplacementProvenanceMode,
) -> Result<(), String> {
    let outline_pages = provider_context
        .get("confirmed_outline")
        .and_then(|value| value.get("outline"))
        .and_then(|value| value.get("slides"))
        .and_then(Value::as_array)
        .ok_or_else(|| "slide_recovery_provenance_outline_missing".to_string())?;
    if replacements.len() != plan.targets.len() {
        return Err("slide_recovery_provenance_scope_mismatch".to_string());
    }
    for replacement in replacements {
        let target = plan
            .targets
            .iter()
            .find(|target| target.page_index == replacement.page_index)
            .ok_or_else(|| "slide_recovery_provenance_target_mismatch".to_string())?;
        let outline_page = outline_pages
            .get(replacement.page_index)
            .ok_or_else(|| "slide_recovery_provenance_outline_page_missing".to_string())?;
        let mut authoritative = GuardedFacts::default();
        collect_outline_guarded_facts(outline_page, &mut authoritative);
        if let Some(delegation) = provider_context.get("delegation") {
            collect_delegation_guarded_facts(delegation, &mut authoritative);
        }
        let mut allowed_strings = authoritative.strings.clone();
        let synthetic_allowed = synthetic_data_allowed(provider_context);
        if synthetic_allowed {
            add_synthetic_labels(&mut allowed_strings);
        }
        if mode == ReplacementProvenanceMode::Targeted {
            let mut damaged = GuardedFacts::default();
            collect_slide_guarded_facts(&target.slide, &mut damaged);
            allowed_strings.extend(damaged.strings);
        }
        let mut candidate = GuardedFacts::default();
        collect_slide_guarded_facts(&replacement.slide, &mut candidate);
        if !candidate.numbers.is_subset(&authoritative.numbers)
            && !(synthetic_allowed && has_synthetic_label(&candidate))
        {
            return Err(format!(
                "slide_recovery_provenance_number_unsupported: page {}",
                replacement.page_index
            ));
        }
        if !candidate.urls.is_subset(&authoritative.urls) {
            return Err(format!(
                "slide_recovery_provenance_url_unsupported: page {}",
                replacement.page_index
            ));
        }
        if candidate.attributions.iter().any(|value| {
            !authoritative
                .strings
                .iter()
                .any(|source| source.contains(value) || value.contains(source))
        }) {
            return Err(format!(
                "slide_recovery_provenance_attribution_unsupported: page {}",
                replacement.page_index
            ));
        }
        if candidate.strings.iter().any(|value| {
            !text_is_composed_from_sources(
                value,
                &allowed_strings,
                synthetic_allowed && has_synthetic_label(&candidate),
            )
        }) {
            return Err(format!(
                "slide_recovery_provenance_text_unsupported: page {}",
                replacement.page_index
            ));
        }
    }
    Ok(())
}
