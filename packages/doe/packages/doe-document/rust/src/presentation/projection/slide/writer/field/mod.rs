use super::*;

impl Writer<'_> {
pub(super) fn field(&mut self, value: &Value, key: &str, label: &str) -> Result<(), String> {
        if let Some(v) = value.get(key) {
            let items = if v.is_array() {
                array(v)?.as_slice()
            } else {
                std::slice::from_ref(v)
            };
            for item in items {
                let text = self.text(item)?;
                self.add(&format!("\n{label}{text}\n"))?;
            }
        }
        Ok(())
    }
}
