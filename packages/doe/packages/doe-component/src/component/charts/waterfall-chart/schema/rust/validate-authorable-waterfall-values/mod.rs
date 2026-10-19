// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_waterfall_values
use crate::schema::*;


pub fn validate_authorable_waterfall_values(
    props: &Map<String, Value>,
    path: &str,
) -> Result<(), String> {
    validate_authorable_optional_text(props, "subtitle", path)?;
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    if content["items"].as_array().expect("validated items").len() < 2 {
        return mismatch(format!(
            "{content_path}.items must contain between 2 and 100 items"
        ));
    }
    for key in ["valuePrefix", "valueSuffix", "footnote"] {
        validate_authorable_optional_text(content, key, &content_path)?;
    }
    validate_authorable_optional_bool(content, "includeZero", &content_path)?;
    for key in ["minValue", "maxValue"] {
        validate_authorable_optional_number(content, key, &content_path)?;
    }
    for key in [
        "showYAxis",
        "showValues",
        "showChangeSigns",
        "staggerLabels",
    ] {
        validate_authorable_optional_bool(content, key, &content_path)?;
    }
    for (index, item) in content["items"]
        .as_array()
        .expect("validated Waterfall items")
        .iter()
        .enumerate()
    {
        let item_path = format!("{content_path}.items[{index}]");
        let item = object(item, &item_path)?;
        validate_authorable_optional_enum(item, "type", &item_path, &["change", "total"])?;
        validate_authorable_optional_bool(item, "connectToNext", &item_path)?;
        validate_authorable_optional_bool(item, "showValue", &item_path)?;
        validate_authorable_optional_enum(
            item,
            "valuePosition",
            &item_path,
            &["inside", "above", "badge"],
        )?;
    }
    if let Some(callouts) = content.get("callouts") {
        for (index, callout) in array(callouts, &format!("{content_path}.callouts"))?
            .iter()
            .enumerate()
        {
            let callout_path = format!("{content_path}.callouts[{index}]");
            let callout = object(callout, &callout_path)?;
            validate_authorable_optional_enum(
                callout,
                "position",
                &callout_path,
                &["above", "below"],
            )?;
        }
    }
    validate_waterfall_cross_fields(props, path)
}
