use super::*;

impl Writer<'_> {
pub(super) fn table_header(&mut self, values: Vec<String>) -> Result<(), String> {
        let count = values.len();
        if count == 0 {
            return Err(UNAVAILABLE.into());
        }
        self.add("\n")?;
        self.row(values)?;
        self.row(vec!["---".into(); count])
    }
}
