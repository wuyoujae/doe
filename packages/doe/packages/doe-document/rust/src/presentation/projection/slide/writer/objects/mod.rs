use super::*;

impl Writer<'_> {
pub(super) fn objects(
        &mut self,
        items: &[Value],
        fields: &[(&str, &str)],
        required: usize,
        depth: usize,
    ) -> Result<(), String> {
        for (i, item) in items.iter().enumerate() {
            if !item.is_object() {
                return Err(UNAVAILABLE.into());
            }
            self.heading(&format!("条目 {}", i + 1), depth)?;
            for (index, (key, label)) in fields.iter().enumerate() {
                if index < required && item.get(key).is_none() {
                    return Err(UNAVAILABLE.into());
                }
                self.field(item, key, label)?;
            }
        }
        Ok(())
    }
}
