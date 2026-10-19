use super::*;

impl Writer<'_> {
pub(super) fn text(&self, value: &Value) -> Result<String, String> {
        Ok(safe_text(&scalar(value)?, self.ids))
    }
}
