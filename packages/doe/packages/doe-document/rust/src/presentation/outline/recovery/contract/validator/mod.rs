use std::collections::HashSet;


use serde_json::{json, Map, Value};


use super::{
    ComponentContract, OutlineContractGraph, MAX_OUTLINE_CONTENT_ITEMS, MAX_OUTLINE_CONTENT_LEN,
    MAX_OUTLINE_DOCUMENT_BYTES, MAX_OUTLINE_SLIDES, MAX_OUTLINE_VALUE_DEPTH,
};


impl OutlineContractGraph {
    pub fn validate_canonical_outline(
        &self,
        outline: crate::presentation::outline::input::OutlineInput,
    ) -> Result<(), String> {
        if !outline.title.trim().is_empty()
            || outline.page_count.is_some()
            || !outline.body.is_empty()
        {
            return Err("outline V2 only allows the top-level slides property.".to_string());
        }
        let slides = outline.slides.ok_or_else(|| {
            "Structured Outline Agent output must use Outline Schema V2.".to_string()
        })?;
        self.validate_slides(&slides)
    }

    pub fn validate_slides(
        &self,
        slides: &[crate::presentation::outline::input::OutlineSlideV2],
    ) -> Result<(), String> {
        if slides.is_empty() {
            return Err("outline.slides must contain at least one slide.".to_string());
        }
        if slides.len() > MAX_OUTLINE_SLIDES {
            return Err(format!(
                "outline.slides cannot contain more than {MAX_OUTLINE_SLIDES} slides."
            ));
        }

        for (position, slide) in slides.iter().enumerate() {
            let expected_page = position as i64 + 1;
            if slide.page_number != expected_page {
                return Err(format!(
                    "outline.slides[{position}].page_number must be {expected_page}."
                ));
            }
            if slide.contents.is_empty() {
                return Err(format!(
                    "outline.slides[{position}].contents must contain at least one content item."
                ));
            }
            if slide.contents.len() > MAX_OUTLINE_CONTENT_ITEMS {
                return Err(format!(
                    "outline.slides[{position}].contents cannot contain more than {MAX_OUTLINE_CONTENT_ITEMS} items."
                ));
            }
            for (node_name, content_value) in &slide.contents {
                let field = format!("outline.slides[{position}].contents.{node_name}");
                validate_semantic_name(node_name, &field)?;
                let content = content_value
                    .as_object()
                    .ok_or_else(|| format!("{field} must be an object."))?;
                require_exact_keys(content, &["body", "describe"], &field)?;
                let describe = required_string(content, "describe", &field)?.trim();
                validate_non_empty_string(describe, &format!("{field}.describe"))?;
                self.validate_body(
                    content.get("body").expect("required body"),
                    &format!("{field}.body"),
                )?;
            }
        }

        let serialized =
            serde_json::to_vec(&json!({ "slides": slides })).map_err(|error| error.to_string())?;
        if serialized.len() > MAX_OUTLINE_DOCUMENT_BYTES {
            return Err(format!(
                "outline document cannot exceed {MAX_OUTLINE_DOCUMENT_BYTES} bytes."
            ));
        }
        Ok(())
    }

    fn validate_body(&self, value: &Value, field: &str) -> Result<(), String> {
        match value {
            Value::String(text) => validate_non_empty_string(text, field),
            Value::Number(number) if number.as_f64().is_some_and(f64::is_finite) => Ok(()),
            Value::Object(object) => self.validate_component(object, field),
            _ => Err(format!(
                "{field} must be a string, number, or structured component."
            )),
        }
    }

    fn validate_component(&self, object: &Map<String, Value>, field: &str) -> Result<(), String> {
        let component_type = required_string(object, "type", field)?;
        validate_semantic_name(component_type, &format!("{field}.type"))?;
        let Some(contract) = self
            .components
            .iter()
            .find(|component| component.discriminator == component_type)
        else {
            if object.len() < 2 {
                return Err(format!(
                    "{field} custom component requires at least one content property."
                ));
            }
            return validate_json_value(&Value::Object(object.clone()), field, 0);
        };
        require_component_keys(object, contract, field)?;
        match component_type {
            "text_block" => validate_string_array(
                required_array(object, "paragraphs", field)?,
                &format!("{field}.paragraphs"),
                1,
                MAX_OUTLINE_CONTENT_ITEMS,
            ),
            "metric" => validate_metric_like(object, field),
            "metrics" => {
                for (index, item) in required_non_empty_object_array(object, "items", field)? {
                    let item_field = format!("{field}.items[{index}]");
                    require_allowed_keys(
                        item,
                        &["label", "value", "unit", "period", "comparison"],
                        &item_field,
                    )?;
                    validate_metric_like(item, &item_field)?;
                }
                Ok(())
            }
            "timeline" => {
                for (index, event) in required_non_empty_object_array(object, "events", field)? {
                    let item_field = format!("{field}.events[{index}]");
                    require_exact_keys(event, &["time", "title", "detail"], &item_field)?;
                    validate_string_or_number(event.get("time"), &format!("{item_field}.time"))?;
                    validate_required_strings(event, &["title", "detail"], &item_field)?;
                }
                Ok(())
            }
            "process" => {
                for (index, step) in required_non_empty_object_array(object, "steps", field)? {
                    let item_field = format!("{field}.steps[{index}]");
                    require_exact_keys(step, &["order", "title", "detail"], &item_field)?;
                    let order = step
                        .get("order")
                        .and_then(Value::as_i64)
                        .ok_or_else(|| format!("{item_field}.order must be a positive integer."))?;
                    if order < 1 {
                        return Err(format!("{item_field}.order must be a positive integer."));
                    }
                    validate_required_strings(step, &["title", "detail"], &item_field)?;
                }
                Ok(())
            }
            "strengths" => {
                for (index, item) in required_non_empty_object_array(object, "items", field)? {
                    let item_field = format!("{field}.items[{index}]");
                    require_exact_keys(item, &["title", "text"], &item_field)?;
                    validate_required_strings(item, &["title", "text"], &item_field)?;
                }
                Ok(())
            }
            "comparison" => validate_comparison(object, field),
            "table" => validate_table(object, field),
            "illustrated_items" => self.validate_illustrated_items(object, field),
            "image" | "generated_image" => validate_image_component(object, field),
            _ => unreachable!("component contract and validator must stay exhaustive"),
        }
    }

    fn validate_illustrated_items(
        &self,
        object: &Map<String, Value>,
        field: &str,
    ) -> Result<(), String> {
        let items = required_non_empty_object_array(object, "items", field)?;
        if !(2..=4).contains(&items.len()) {
            return Err(format!(
                "{field}.items must contain between two and four items."
            ));
        }
        for (index, item) in items {
            let item_field = format!("{field}.items[{index}]");
            require_exact_keys(item, &["title", "text", "image"], &item_field)?;
            validate_required_strings(item, &["title", "text"], &item_field)?;
            let image = item
                .get("image")
                .and_then(Value::as_object)
                .ok_or_else(|| format!("{item_field}.image must be an image component."))?;
            let image_type = image.get("type").and_then(Value::as_str);
            if !matches!(image_type, Some("image" | "generated_image")) {
                return Err(format!("{item_field}.image must be an image component."));
            }
            self.validate_component(image, &format!("{item_field}.image"))?;
        }
        Ok(())
    }
}
#[path = "require-component-keys/mod.rs"]
mod function_require_component_keys;
 use function_require_component_keys::require_component_keys;

#[path = "validate-semantic-name/mod.rs"]
mod function_validate_semantic_name;
 use function_validate_semantic_name::validate_semantic_name;

#[path = "validate-metric-like/mod.rs"]
mod function_validate_metric_like;
 use function_validate_metric_like::validate_metric_like;

#[path = "validate-comparison/mod.rs"]
mod function_validate_comparison;
 use function_validate_comparison::validate_comparison;

#[path = "validate-table/mod.rs"]
mod function_validate_table;
 use function_validate_table::validate_table;

#[path = "validate-image-component/mod.rs"]
mod function_validate_image_component;
 use function_validate_image_component::validate_image_component;

#[path = "validate-json-value/mod.rs"]
mod function_validate_json_value;
 use function_validate_json_value::validate_json_value;

#[path = "required-string/mod.rs"]
mod function_required_string;
 use function_required_string::required_string;

#[path = "required-array/mod.rs"]
mod function_required_array;
 use function_required_array::required_array;

#[path = "required-non-empty-object-array/mod.rs"]
mod function_required_non_empty_object_array;
 use function_required_non_empty_object_array::required_non_empty_object_array;

#[path = "validate-non-empty-string/mod.rs"]
mod function_validate_non_empty_string;
 use function_validate_non_empty_string::validate_non_empty_string;

#[path = "validate-string-or-number/mod.rs"]
mod function_validate_string_or_number;
 use function_validate_string_or_number::validate_string_or_number;

#[path = "validate-string-array/mod.rs"]
mod function_validate_string_array;
 use function_validate_string_array::validate_string_array;

#[path = "validate-required-strings/mod.rs"]
mod function_validate_required_strings;
 use function_validate_required_strings::validate_required_strings;

#[path = "require-exact-keys/mod.rs"]
mod function_require_exact_keys;
 use function_require_exact_keys::require_exact_keys;

#[path = "require-allowed-keys/mod.rs"]
mod function_require_allowed_keys;
 use function_require_allowed_keys::require_allowed_keys;

