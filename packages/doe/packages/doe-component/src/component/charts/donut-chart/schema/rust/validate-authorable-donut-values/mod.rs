// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_donut_values
use crate::schema::*;


pub fn validate_authorable_donut_values(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    validate_authorable_optional_enum(
        content,
        "variant",
        &content_path,
        &["standard", "compact", "hero"],
    )?;
    validate_authorable_optional_bool(content, "showLegend", &content_path)?;
    for key in ["tag", "valuePrefix", "valueSuffix"] {
        validate_authorable_optional_text(content, key, &content_path)?;
    }
    validate_authorable_optional_string_array(content, "footerLines", &content_path)?;
    validate_authorable_optional_integer_range(
        content,
        "maximumFractionDigits",
        &content_path,
        0,
        3,
    )?;
    if let Some(center) = content.get("center") {
        let center_path = format!("{content_path}.center");
        let center = object(center, &center_path)?;
        for key in ["title", "subtitle"] {
            if let Some(value) = center.get(key) {
                validate_authorable_string_or_string_array(value, &format!("{center_path}.{key}"))?;
            }
        }
        validate_authorable_optional_string_or_number(center, "value", &center_path)?;
        validate_authorable_optional_text(center, "eyebrow", &center_path)?;
    }
    if let Some(footnotes) = content.get("footnotes") {
        for (index, footnote) in array(footnotes, &format!("{content_path}.footnotes"))?
            .iter()
            .enumerate()
        {
            let footnote_path = format!("{content_path}.footnotes[{index}]");
            let footnote = object(footnote, &footnote_path)?;
            validate_authorable_optional_enum(
                footnote,
                "align",
                &footnote_path,
                &["left", "right"],
            )?;
            validate_authorable_optional_text(footnote, "text", &footnote_path)?;
            validate_authorable_optional_string_array(footnote, "lines", &footnote_path)?;
        }
    }

    let mut has_positive = false;
    for (index, item) in content["items"]
        .as_array()
        .expect("validated Donut items")
        .iter()
        .enumerate()
    {
        let item_path = format!("{content_path}.items[{index}]");
        let item = object(item, &item_path)?;
        for key in ["percentLabel", "badge", "detailLabel"] {
            validate_authorable_optional_text(item, key, &item_path)?;
        }
        validate_authorable_optional_bool(item, "primary", &item_path)?;
        if let Some(value_label) = item.get("valueLabel") {
            if value_label != &Value::Bool(false) {
                nonempty_text(value_label, &format!("{item_path}.valueLabel"))?;
            }
        }
        let value = finite_number(
            required(item, "value", &item_path)?,
            &format!("{item_path}.value"),
        )?;
        if value < 0.0 {
            return mismatch(format!("{item_path}.value must be non-negative"));
        }
        has_positive |= value > 0.0;
    }
    if !has_positive {
        return mismatch(format!(
            "{content_path}.items must contain at least one positive value"
        ));
    }
    Ok(())
}
