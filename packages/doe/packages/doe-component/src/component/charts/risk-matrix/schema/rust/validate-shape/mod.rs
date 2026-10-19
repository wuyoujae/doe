// Component contract from validate_authorable_component_shape: "risk-matrix"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_risk_matrix(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &["tooltip", "content", "subtitle"],
                &["items", "xLabel", "yLabel", "priorityZone"],
            )?;
            let content_path = format!("{path}.content");
            validate_authorable_object_items(
                content,
                "items",
                &content_path,
                &["label", "x", "y"],
            )?;
            validate_authorable_optional_object(
                content,
                "priorityZone",
                &content_path,
                &["x", "y", "width", "height", "label", "labelLines"],
            )
        }
}
