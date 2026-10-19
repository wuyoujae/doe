// Origin: app/backend/core/src/slide_recovery/model_io.rs::output_error_allows_clean_retry


pub fn output_error_allows_clean_retry(error: &str) -> bool {
    matches!(
        error,
        "slide_recovery_model_output_empty"
            | "slide_recovery_model_output_invalid_json"
            | "slide_recovery_model_output_duplicate_key"
            | "slide_recovery_model_output_page repair_type"
            | "slide_recovery_model_output_page repair_shape"
            | "slide_recovery_model_output_page_index"
            | "slide_recovery_model_output_page_hash"
            | "slide_recovery_model_output_slide"
    )
}
