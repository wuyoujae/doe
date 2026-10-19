// Origin: app/backend/core/src/slide_agent_output_contract.rs::is_theme_managed_component_style_key
use crate::schema::*;


pub fn is_theme_managed_component_style_key(key: &str) -> bool {
    if THEME_MANAGED_COMPONENT_STYLE_KEYS.contains(&key) {
        return true;
    }
    let normalized = key
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect::<String>();
    normalized.contains("font")
        || normalized.ends_with("color")
        || normalized.starts_with("stroke")
        || (normalized.starts_with("border") && normalized != "borderstyle")
        || normalized.ends_with("radius")
        || normalized.contains("shadow")
        || normalized.starts_with("padding")
        || normalized.starts_with("margin")
        || normalized.ends_with("opacity")
        || normalized.starts_with("mask")
        || matches!(
            normalized.as_str(),
            "style"
                | "styles"
                | "class"
                | "classname"
                | "css"
                | "csstext"
                | "theme"
                | "typography"
                | "textstyle"
                | "textalign"
                | "textdecoration"
                | "bold"
                | "textfit"
                | "allowemergency8pt"
        )
}
