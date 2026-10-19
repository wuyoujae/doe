use super::*;

impl Writer<'_> {
pub(super) fn series(
        &mut self,
        c: &Value,
        axis_key: &str,
        series_key: &str,
        values_key: &str,
        radar: bool,
    ) -> Result<(), String> {
        let axes = array(&c[axis_key])?;
        let series = array(&c[series_key])?;
        let mut header = vec!["类别".into()];
        if radar {
            header.push("轴上限".into());
        }
        for item in series {
            if array(&item[values_key])?.len() != axes.len() {
                return Err(UNAVAILABLE.into());
            }
            header.push(self.text(&item["name"])?);
        }
        self.table_header(header)?;
        for (i, axis) in axes.iter().enumerate() {
            let mut row = vec![self.text(if radar { &axis["label"] } else { axis })?];
            if radar {
                row.push(self.text(&axis["max"])?);
            }
            for item in series {
                row.push(self.text(&item[values_key][i])?);
            }
            self.row(row)?;
        }
        Ok(())
    }
}
