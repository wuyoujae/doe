use super::*;

impl Writer<'_> {
pub(super) fn units(&mut self, c: &Value) -> Result<(), String> {
        self.field(c, "valuePrefix", "数值前缀：")?;
        self.field(c, "valueSuffix", "数值后缀：")
    }
}
