use super::*;

impl Writer<'_> {
pub(super) fn required(&mut self, v: &Value, key: &str) -> Result<(), String> {
        let text = self.text(v.get(key).ok_or(UNAVAILABLE)?)?;
        self.add(&format!("\n{text}\n"))
    }
}
