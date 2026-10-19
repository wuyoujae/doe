// Origin: app/backend/core/src/outline_agent_output_contract.rs::canonicalize_outline
use super::*;


pub(super) fn canonicalize_outline(
    value: Value,
) -> Result<
    (
        Value,
        Value,
        JsonSyntaxRepairReport,
        Vec<outline_recovery::diagnostics::RepairEdit>,
        usize,
        usize,
        usize,
        usize,
    ),
    String,
> {
    let outline = value
        .as_object()
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: outline must be an object"))?;
    let mut ignored_unknown_field_count = validate_unknown_fields(outline, &["slides"], "outline")?;
    let slides = outline
        .get("slides")
        .and_then(Value::as_array)
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: outline.slides must be an array"))?;
    let mut canonical_slides = Vec::with_capacity(slides.len());
    let mut semantic_source_slides = Vec::with_capacity(slides.len());
    let mut syntax_repair_report = JsonSyntaxRepairReport::default();
    let mut nested_repair_edits = Vec::new();
    let mut image_type_repair_count = 0usize;
    let mut missing_generated_image_type_repair_count = 0usize;
    let mut blank_paragraph_repair_count = 0usize;
    for (index, slide) in slides.iter().enumerate() {
        let slide = slide.as_object().ok_or_else(|| {
            format!("{SCHEMA_MISMATCH_ERROR}: outline.slides[{index}] must be an object")
        })?;
        ignored_unknown_field_count =
            ignored_unknown_field_count.saturating_add(validate_unknown_fields(
                slide,
                &["page_number", "contents", "contents_json"],
                &format!("outline.slides[{index}]"),
            )?);
        let expected_page_number = index as i64 + 1;
        let page_number = slide
            .get("page_number")
            .and_then(Value::as_i64)
            .filter(|page_number| *page_number == expected_page_number)
            .unwrap_or(expected_page_number);
        let mut contents = match (slide.get("contents"), slide.get("contents_json")) {
            (Some(contents), None) => contents.clone(),
            (None, Some(Value::String(contents_json))) => {
                let (contents, mut repairs, mut edits) =
                    parse_outline_contents_with_report(contents_json).map_err(|error| {
                        format!(
                            "{INVALID_JSON_ERROR}: outline.slides[{index}].contents_json is invalid JSON: {error}"
                        )
                    })?;
                repairs.set_scope(format!("outline.slides[{index}].contents_json"));
                syntax_repair_report.extend(repairs);
                for edit in &mut edits {
                    edit.operation = format!("nested_{}", edit.operation);
                    edit.target_pointer = format!(
                        "/outline/slides/{index}/contents{}",
                        edit.target_pointer
                    );
                }
                nested_repair_edits.extend(edits);
                if syntax_repair_report.count() > MAX_JSON_SYNTAX_REPAIRS_PER_OUTLINE {
                    return Err(format!(
                        "{SCHEMA_MISMATCH_ERROR}: JSON syntax repair count exceeded {MAX_JSON_SYNTAX_REPAIRS_PER_OUTLINE}"
                    ));
                }
                contents
            }
            _ => {
                return Err(format!(
                    "{SCHEMA_MISMATCH_ERROR}: outline.slides[{index}] must contain page_number and exactly one of contents_json or canonical contents"
                ))
            }
        };
        if !contents.is_object() {
            return Err(format!(
                "{SCHEMA_MISMATCH_ERROR}: outline.slides[{index}] contents must be an object"
            ));
        }
        let mut semantic_source_slide = slide.clone();
        semantic_source_slide.remove("contents_json");
        semantic_source_slide.insert("contents".to_string(), contents.clone());
        semantic_source_slides.push(Value::Object(semantic_source_slide));
        missing_generated_image_type_repair_count =
            missing_generated_image_type_repair_count
                .checked_add(normalize_missing_generated_image_types(&mut contents))
                .ok_or_else(|| {
                    format!(
                        "{OUTPUT_CONTRACT_VIOLATION_ERROR}: semantic repair count exceeded {MAX_SEMANTIC_REPAIRS_PER_OUTLINE}"
                    )
                })?;
        image_type_repair_count = image_type_repair_count
            .checked_add(normalize_generated_image_types(&mut contents))
            .filter(|count| {
                count.saturating_add(missing_generated_image_type_repair_count)
                    <= doe_core::asset::generated::MAX_OUTLINE_GENERATED_IMAGES
            })
            .ok_or_else(|| {
                format!(
                    "{OUTPUT_CONTRACT_VIOLATION_ERROR}: Outline cannot contain more than {} generated images",
                    doe_core::asset::generated::MAX_OUTLINE_GENERATED_IMAGES
                )
            })?;
        blank_paragraph_repair_count = blank_paragraph_repair_count
            .checked_add(normalize_blank_text_block_paragraphs(&mut contents))
            .filter(|count| {
                count
                    .saturating_add(image_type_repair_count)
                    .saturating_add(missing_generated_image_type_repair_count)
                    <= MAX_SEMANTIC_REPAIRS_PER_OUTLINE
            })
            .ok_or_else(|| {
                format!(
                    "{OUTPUT_CONTRACT_VIOLATION_ERROR}: semantic repair count exceeded {MAX_SEMANTIC_REPAIRS_PER_OUTLINE}"
                )
            })?;
        canonical_slides.push(json!({
            "page_number": page_number,
            "contents": contents,
        }));
    }
    Ok((
        json!({"slides": canonical_slides}),
        {
            let mut semantic_source_outline = outline.clone();
            semantic_source_outline
                .insert("slides".to_string(), Value::Array(semantic_source_slides));
            Value::Object(semantic_source_outline)
        },
        syntax_repair_report,
        nested_repair_edits,
        image_type_repair_count,
        missing_generated_image_type_repair_count,
        blank_paragraph_repair_count,
        ignored_unknown_field_count,
    ))
}
