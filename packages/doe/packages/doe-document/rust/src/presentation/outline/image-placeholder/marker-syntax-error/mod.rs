// Origin: app/backend/core/src/doe_outline_image_plugin.rs::marker_syntax_error


pub(super) fn marker_syntax_error() -> String {
    "Generated image content must be a complete GENRATEIMG(prompt), GENRATEIMG[ratio=1:1](prompt), or GENRATEIMG[type=content,ratio=1:1](prompt) expression."
        .to_string()
}
