// Component contract from validate_authorable_component_shape: "radar-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_radar_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &["tooltip", "content", "subtitle", "showLegend"],
                &["axes", "datasets"],
            )?;
            let content_path = format!("{path}.content");
            validate_authorable_object_items(content, "axes", &content_path, &["label", "max"])?;
            validate_authorable_object_items(
                content,
                "datasets",
                &content_path,
                &["name", "values"],
            )
        }
}
