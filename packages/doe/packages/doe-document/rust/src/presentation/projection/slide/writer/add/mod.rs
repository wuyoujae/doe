use super::*;

impl Writer<'_> {
pub(super) fn add(&mut self, value: &str) -> Result<(), String> {
        if self.out.len() + value.len() > MAX_OUTPUT {
            return Err(TOO_LARGE.into());
        }
        self.out.push_str(value);
        Ok(())
    }
}
