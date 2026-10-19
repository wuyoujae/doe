use super::*;

impl Writer<'_> {
pub(super) fn fence(&mut self, value: &Value, language: &str) -> Result<(), String> {
        let raw = redact_text(&scalar(value)?, self.ids);
        let longest = raw.split(|c| c != '`').map(str::len).max().unwrap_or(0);
        let fence = "`".repeat(3.max(longest + 1));
        self.add(&format!("\n{fence}{language}\n{raw}\n{fence}\n"))
    }
}
