// Origin: app/backend/core/src/slide_agent_output_contract/contents.rs::validate
use super::*;


pub(in super::super) fn validate(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, PROPS, path)?;
    let presentation = required(props, "presentation", path)?
        .as_str()
        .filter(|v| PRESENTATIONS.contains(v) || *v == "bullets")
        .ok_or_else(|| format!("{SCHEMA_MISMATCH_ERROR}: {path}.presentation is unsupported"))?;
    let items = array(required(props, "items", path)?, &format!("{path}.items"))?;
    let (min, max) = match presentation {
        "shape:semicircle" | "shape:cycle-arrows" | "shape:full-circle" | "shape:ring" => (2, 6),
        "shape:petals" => (2, 8),
        "shape:stairs" | "shape:pyramid" | "shape:inverted-pyramid" => (2, 12),
        "numbered" => (2, 6),
        _ => (1, 12),
    };
    if !(min..=max).contains(&items.len()) {
        return mismatch(format!(
            "{path}.items does not match the presentation item count"
        ));
    }
    for key in ["title", "subtitle"] {
        optional_text(props, key, path)?;
        if present(props.get(key))
            && (key == "subtitle" || !(matches!(presentation, "capability" | "numbered" | "list:unordered" | "list:ordered") || presentation.starts_with("cards:")))
        {
            return mismatch(format!(
                "{path}.{key} cannot be displayed by this presentation"
            ));
        }
    }
    validate_authorable_optional_enum(props, "itemLayout", path, &["auto", "stack", "grid"])?;
    validate_authorable_optional_enum(props, "orientation", path, &["vertical", "horizontal"])?;
    for (key, values) in [
        ("imageSize", &["compact", "full"][..]),
        ("imageFit", &["contain", "cover"][..]),
        ("imageAspectRatio", &["1:1", "4:3", "3:4", "16:9"][..]),
        ("surface", &["none", "soft"][..]),
    ] {
        if props.contains_key(key) && presentation != "image-text" {
            return mismatch(format!("{path}.{key} requires presentation image-text"));
        }
        validate_authorable_optional_enum(props, key, path, values)?;
    }
    for key in ["staggered", "connectors"] {
        if props.get(key).is_some_and(|value| !value.is_boolean()) {
            return mismatch(format!("{path}.{key} must be boolean"));
        }
    }
    for key in ["itemColumns", "columnPreference"] {
        if props.get(key).is_some_and(|v| v.as_str() != Some("auto")) {
            validate_authorable_optional_integer_range(props, key, path, 1, if presentation == "metrics" { 12 } else { 5 })?;
        }
    }
    let max_columns = if presentation == "metrics" {
        12
    } else if presentation.starts_with("ascending-") {
        5
    } else if presentation == "columns" {
        4
    } else if presentation.starts_with("list:") {
        2
    } else if presentation == "alternating" || presentation.starts_with("timeline-") || presentation == "bullets" || presentation.starts_with("shape:") {
        1
    } else {
        4
    };
    if props
        .get("itemColumns")
        .and_then(Value::as_u64)
        .is_some_and(|n| n > max_columns)
    {
        return mismatch(format!("{path}.itemColumns exceeds presentation capacity"));
    }
    let mut ids = HashSet::new();
    for (index, value) in items.iter().enumerate() {
        let p = format!("{path}.items[{index}]");
        let item = object(value, &p)?;
        allowed_keys(item, ITEM, &p)?;
        required_text(item, "id", &p)?;
        if !ids.insert(item["id"].as_str().unwrap()) {
            return mismatch(format!("{p}.id must be unique within the contents"));
        }
        for key in ["title", "text", "icon", "src", "alt", "source"] {
            optional_text(item, key, &p)?;
        }
        if item
            .get("label")
            .is_some_and(|v| !v.is_string() && !v.is_number())
        {
            return mismatch(format!("{p}.label must be text or a number"));
        }
        if let Some(value) = item.get("bullets") {
            if !array(value, &format!("{p}.bullets"))?
                .iter()
                .all(Value::is_string)
            {
                return mismatch(format!("{p}.bullets must contain text"));
            }
        }
        for (key, allowed) in [
            ("src", presentation == "image-text"),
            ("alt", presentation == "image-text"),
            ("source", presentation == "quotation"),
            ("label", matches!(presentation, "question" | "metrics")),
            ("icon", presentation != "metrics"),
            ("bullets", presentation == "capability"),
            ("title", presentation != "quotation"),
        ] {
            if present(item.get(key)) && !allowed {
                return mismatch(format!(
                    "{p}.{key} cannot be displayed by this presentation"
                ));
            }
        }
        let required: &[&str] = match presentation {
            "image-text" => &["src"],
            "icon-horizontal" => &["icon"],
            "capability" => &["title", "icon"],
            "numbered" => &["title", "text", "icon"],
            "question" | "metrics" => &["title"],
            "quotation" => &["text"],
            v if v.starts_with("shape:") => &["title", "text"],
            _ => &[],
        };
        for key in required {
            if !present(item.get(*key)) && !(matches!(*key, "src" | "icon") && item.get(*key).and_then(Value::as_str) == Some("")) {
                return mismatch(format!("{p}.{key} is required by this presentation"));
            }
        }
        if presentation == "capability"
            && !present(item.get("text"))
            && !present(item.get("bullets"))
        {
            return mismatch(format!("{p} requires text or bullets"));
        }
    }
    Ok(())
}
