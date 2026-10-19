use super::*;

impl Writer<'_> {
pub(super) fn heading(&mut self, title: &str, depth: usize) -> Result<(), String> {
        self.add(&format!("\n{} {}\n", "#".repeat(depth.min(6)), title))
    }
}
