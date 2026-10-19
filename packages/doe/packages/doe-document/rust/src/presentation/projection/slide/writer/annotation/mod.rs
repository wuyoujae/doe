use super::*;

impl Writer<'_> {
pub(super) fn annotation(
        &mut self,
        a: &Value,
        c: &Value,
        items_key: &str,
        index_key: &str,
        label: &str,
    ) -> Result<(), String> {
        let items = array(&c[items_key])?;
        let i = a[index_key]
            .as_u64()
            .and_then(|v| usize::try_from(v).ok())
            .ok_or(UNAVAILABLE)?;
        let item = items.get(i).ok_or(UNAVAILABLE)?;
        self.add(&format!(
            "\n{label}{}\n",
            self.text(if item.is_object() {
                &item["label"]
            } else {
                item
            })?
        ))
    }
}
