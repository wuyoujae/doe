use super::*;

impl Writer<'_> {
pub(super) fn row(&mut self, values: Vec<String>) -> Result<(), String> {
        self.cells += values.len();
        if self.cells > 20_000 {
            return Err(TOO_LARGE.into());
        }
        // Newlines remain within the cell; raw HTML from the source has already been escaped.
        let cells = values
            .into_iter()
            .map(|v| v.replace('\n', "<br>"))
            .collect::<Vec<_>>();
        self.add(&format!("| {} |\n", cells.join(" | ")))
    }
}
