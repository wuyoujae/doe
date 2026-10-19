// Component contract from validate_authorable_component_shape: "donut-chart"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_donut_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &["tooltip", "content"],
                &[
                    "items",
                    "variant",
                    "showLegend",
                    "center",
                    "tag",
                    "footerLines",
                    "footnotes",
                    "valuePrefix",
                    "valueSuffix",
                    "maximumFractionDigits",
                ],
            )?;
            let content_path = format!("{path}.content");
            validate_authorable_object_items(
                content,
                "items",
                &content_path,
                &[
                    "label",
                    "value",
                    "percentLabel",
                    "badge",
                    "primary",
                    "valueLabel",
                    "detailLabel",
                ],
            )?;
            validate_authorable_optional_object(
                content,
                "center",
                &content_path,
                &["title", "value", "eyebrow", "subtitle"],
            )?;
            validate_authorable_object_items(
                content,
                "footnotes",
                &content_path,
                &["align", "text", "lines"],
            )
        }
}
