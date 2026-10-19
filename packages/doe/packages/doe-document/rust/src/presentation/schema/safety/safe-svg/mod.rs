// Origin: app/backend/core/src/plugin_slide_validation.rs::safe_svg
use super::*;


pub(super) fn safe_svg(s: &str) -> bool {
    if s.len() > 65_536 || s.contains(['\\']) || s.contains("<!") || s.contains("<?") {
        return false;
    }
    let Ok(doc) = roxmltree::Document::parse_with_options(
        s,
        roxmltree::ParsingOptions {
            allow_dtd: false,
            nodes_limit: 512,
            ..Default::default()
        },
    ) else {
        return false;
    };
    if doc.root_element().tag_name().name() != "svg" {
        return false;
    }
    doc.descendants().all(|n| {
        if n.is_text() {
            return n.text().unwrap_or("").trim().is_empty();
        }
        if !n.is_element() {
            return n.is_root();
        }
        if n.ancestors().count() > 16
            || !matches!(
                n.tag_name().namespace(),
                None | Some("http://www.w3.org/2000/svg")
            )
            || !matches!(
                n.tag_name().name(),
                "svg"
                    | "g"
                    | "path"
                    | "circle"
                    | "ellipse"
                    | "rect"
                    | "line"
                    | "polyline"
                    | "polygon"
            )
        {
            return false;
        }
        n.attributes().all(|a| {
            a.namespace().is_none()
                && matches!(
                    a.name(),
                    "viewBox"
                        | "width"
                        | "height"
                        | "x"
                        | "y"
                        | "x1"
                        | "x2"
                        | "y1"
                        | "y2"
                        | "cx"
                        | "cy"
                        | "r"
                        | "rx"
                        | "ry"
                        | "d"
                        | "points"
                        | "fill"
                        | "stroke"
                        | "stroke-width"
                        | "stroke-linecap"
                        | "stroke-linejoin"
                        | "stroke-miterlimit"
                        | "fill-rule"
                        | "clip-rule"
                        | "opacity"
                        | "fill-opacity"
                        | "stroke-opacity"
                        | "stroke-dasharray"
                        | "stroke-dashoffset"
                        | "transform"
                        | "class"
                        | "aria-hidden"
                        | "focusable"
                )
                && !ACTIVE.is_match(a.value())
                && a.value()
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b" #.,-+()%\t\n".contains(&b))
        })
    })
}
