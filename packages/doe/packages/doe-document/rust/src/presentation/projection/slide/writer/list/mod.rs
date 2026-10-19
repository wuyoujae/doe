use super::*;

impl Writer<'_> {
pub(super) fn list(&mut self, items: &[Value], ordered: bool) -> Result<(), String> {
        for (i, item) in items.iter().enumerate() {
            let text = self.text(item)?;
            let prefix = if ordered {
                format!("{}. ", i + 1)
            } else {
                "- ".into()
            };
            let indent = " ".repeat(prefix.len());
            self.add(&format!(
                "{prefix}{}\n",
                text.replace('\n', &format!("\n{indent}"))
            ))?;
        }
        Ok(())
    }
}
