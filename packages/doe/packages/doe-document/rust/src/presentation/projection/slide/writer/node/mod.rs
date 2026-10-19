use super::*;

impl Writer<'_> {
pub(super) fn node(&mut self, node: &Value, depth: usize) -> Result<(), String> {
        let kind = node["type"].as_str().ok_or(UNAVAILABLE)?;
        if kind == "layout-group" {
            self.heading("分组", depth)?;
            for (i, child) in array(&node["children"])?.iter().enumerate() {
                self.heading(&format!("分组项 {}", i + 1), depth + 1)?;
                self.node(child, depth + 2)?;
            }
            return Ok(());
        }
        let Some(label) = component_label(kind) else {
            return self.add("\n[该组件内容暂不支持读取，已省略]\n");
        };
        let p = node
            .get("props")
            .filter(|v| v.is_object())
            .ok_or(UNAVAILABLE)?;
        let c = &p["content"];
        self.heading(label, depth)?;
        // Only components whose contracts contain these fields call field().
        match kind {
            "hero" => {
                self.field(p, "eyebrow", "")?;
                self.required(p, "title")?;
                self.field(p, "subtitle", "")?;
            }
            "heading" => {
                self.field(p, "kicker", "")?;
                self.required(p, "text")?;
            }
            "text-panel" | "text" | "notice" => self.required(p, "text")?,
            "quote" => {
                self.required(p, "text")?;
                self.field(p, "source", "来源：")?;
            }
            "image-text" | "icon-text" => {
                self.required(p, "title")?; self.required(p, "text")?;
                if kind == "image-text" { self.field(p, "alt", "图片说明：")?; }
            }
            "stat" => {
                self.field(p, "label", "")?;
                self.required(p, "value")?;
                self.field(p, "description", "")?;
            }
            "question-card" => {
                self.field(p, "index", "编号：")?;
                self.required(p, "title")?;
                self.field(p, "text", "")?;
            }
            "media" => {
                self.field(p, "alt", "图片说明：")?;
                self.add("\n[图片；未提取图内文字，素材地址已省略]\n")?;
            }
            "code-block" => {
                let lang = p.get("language").and_then(Value::as_str).unwrap_or("text");
                let lang = if [
                    "python",
                    "javascript",
                    "typescript",
                    "json",
                    "html",
                    "css",
                    "sql",
                    "shell",
                    "text",
                ]
                .contains(&lang)
                {
                    lang
                } else {
                    "text"
                };
                self.fence(&p["code"], lang)?;
            }
            "vertical-progress" | "badge-cards" => { for item in array(&p["items"])? { self.field(item,"title","")?; self.field(item,"value","数值：")?; self.required(item,"text")?; self.field(item,"icon","图标：")?; } }
            "mind-map" => { for item in array(&c["items"])? { self.field(item,"level","层级：")?; self.required(item,"title")?; self.required(item,"text")?; self.field(item,"icon","图标：")?; } }
            "math-formula" => self.fence(&c["formula"], "latex")?,
            "list" | "ordered-list" => {
                self.field(p, "title", "")?;
                self.list(array(&p["items"])?, kind == "ordered-list")?;
            }
            "todo-list" => {
                self.field(p, "title", "")?;
                for item in array(&p["items"])? {
                    let check = if item["checked"].as_bool().ok_or(UNAVAILABLE)? {
                        "x"
                    } else {
                        " "
                    };
                    self.add(&format!(
                        "- [{check}] {}\n",
                        self.text(&item["text"])?.replace('\n', "\n      ")
                    ))?;
                }
            }
            "contents" => {
                self.field(p, "presentation", "样式：")?;
                self.field(p, "title", "")?;
                for item in array(&p["items"])? {
                    for (key, label) in [("title", ""), ("text", ""), ("icon", "图标："), ("src", "图片："), ("alt", "图片说明："), ("source", "来源：")] {
                        self.field(item, key, label)?;
                    }
                    if let Some(label) = item.get("label") {
                        if label.is_number() { self.add(&format!("\n标签：{label}\n"))?; }
                        else { self.field(item, "label", "标签：")?; }
                    }
                    if let Some(bullets) = item.get("bullets") { self.list(array(bullets)?, false)?; }
                }
            }
            "3d-funnel" | "concentric-circles" | "layered-funnel" | "folded-arrow" | "wave-arrow" | "layered-cube" | "double-ring" | "droplet-process" | "serpentine-process" | "recycling-arrows" | "icon-columns" | "item-cards" | "shape-contents" | "capability-cards" | "numbered-icon-cards" => {
                self.field(p, "title", "")?;
                let items = if matches!(kind, "3d-funnel" | "concentric-circles" | "layered-funnel" | "folded-arrow" | "wave-arrow" | "layered-cube" | "double-ring" | "droplet-process" | "serpentine-process" | "recycling-arrows" | "icon-columns" | "item-cards" | "shape-contents") {
                    &p["items"]
                } else {
                    &c["items"]
                };
                self.objects(array(items)?, &[("title", ""), ("text", "")], 2, depth + 1)?;
            }


            "table" => {
                self.field(p, "ariaLabel", "")?;
                let headers = array(&c["columns"])?;
                self.table_header(
                    headers
                        .iter()
                        .map(|v| self.text(&v["header"]))
                        .collect::<Result<_, _>>()?,
                )?;
                for row in array(&c["rows"])? {
                    let cells = array(&row["cells"])?;
                    if cells.len() != headers.len() {
                        return Err(UNAVAILABLE.into());
                    }
                    self.row(
                        cells
                            .iter()
                            .map(|v| self.text(if v.is_object() { &v["text"] } else { v }))
                            .collect::<Result<_, _>>()?,
                    )?;
                }
            }
            "grouped-bar-chart" | "line-chart" | "stacked-bar-chart" => {
                if kind != "line-chart" {
                    self.field(p, "subtitle", "")?;
                }
                self.units(c)?;
                self.series(c, "categories", "series", "data", false)?;
                if kind == "line-chart" {
                    for series in array(&c["series"])? {
                        if let Some(labels) = series.get("labels") {
                            self.field(series, "name", "数据标注系列：")?;
                            for label in array(labels)? {
                                self.annotation(label, c, "categories", "index", "标注类别：")?;
                                self.field(label, "text", "标注：")?;
                            }
                        }
                    }
                }
                if kind == "stacked-bar-chart" {
                    if let Some(a) = c.get("annotation") {
                        self.field(a, "label", "标注：")?;
                        for (key, label) in [("from", "起始类别："), ("to", "结束类别：")]
                        {
                            if a.get(key).is_some() {
                                self.annotation(a, c, "categories", key, label)?;
                            }
                        }
                    }
                }
            }
            "radar-chart" => {
                self.field(p, "subtitle", "")?;
                self.series(c, "axes", "datasets", "values", true)?;
            }
            "donut-chart" => {
                self.units(c)?;
                self.objects(
                    array(&c["items"])?,
                    &[
                        ("label", ""),
                        ("value", "数值："),
                        ("percentLabel", "比例："),
                        ("badge", "标记："),
                        ("detailLabel", "说明："),
                    ],
                    2,
                    depth + 1,
                )?;
                for (i, item) in array(&c["items"])?.iter().enumerate() {
                    if item.get("valueLabel").is_some_and(Value::is_string) {
                        self.add(&format!(
                            "\n条目 {} 显示数值：{}\n",
                            i + 1,
                            self.text(&item["valueLabel"])?
                        ))?;
                    }
                }
                if let Some(center) = c.get("center") {
                    self.heading("中心说明", depth + 1)?;
                    for key in ["eyebrow", "title", "value", "subtitle"] {
                        self.field(center, key, "")?;
                    }
                }
                self.field(c, "tag", "标签：")?;
                self.field(c, "footerLines", "")?;
                if let Some(notes) = c.get("footnotes") {
                    for n in array(notes)? {
                        self.field(n, "text", "注：")?;
                        self.field(n, "lines", "注：")?;
                    }
                }
            }
            "risk-matrix" => {
                self.field(p, "subtitle", "")?;
                self.field(c, "xLabel", "X 轴：")?;
                self.field(c, "yLabel", "Y 轴：")?;
                self.table_header(vec!["项目".into(), "X（0–1）".into(), "Y（0–1）".into()])?;
                for item in array(&c["items"])? {
                    self.row(
                        ["label", "x", "y"]
                            .iter()
                            .map(|k| self.text(&item[k]))
                            .collect::<Result<_, _>>()?,
                    )?;
                }
                if let Some(zone) = c.get("priorityZone") {
                    self.heading("优先区域", depth + 1)?;
                    for (k, l) in [
                        ("label", ""),
                        ("labelLines", ""),
                        ("x", "X："),
                        ("y", "Y："),
                        ("width", "X 范围宽度："),
                        ("height", "Y 范围高度："),
                    ] {
                        self.field(zone, k, l)?;
                    }
                }
            }
            "waterfall-chart" => {
                self.field(p, "subtitle", "")?;
                self.units(c)?;
                self.table_header(vec!["项目".into(), "数值".into(), "含义".into()])?;
                for item in array(&c["items"])? {
                    let kind = match item.get("type").and_then(Value::as_str).unwrap_or("change") {
                        "change" => "变化量",
                        "total" => "合计",
                        _ => return Err(UNAVAILABLE.into()),
                    };
                    self.row(vec![
                        self.text(&item["label"])?,
                        self.text(&item["value"])?,
                        kind.into(),
                    ])?;
                }
                if let Some(callouts) = c.get("callouts") {
                    for a in array(callouts)? {
                        self.annotation(a, c, "items", "index", "标注项目：")?;
                        self.field(a, "text", "")?;
                    }
                }
                if let Some(comparisons) = c.get("comparisons") {
                    for a in array(comparisons)? {
                        self.annotation(a, c, "items", "from", "比较起点：")?;
                        self.annotation(a, c, "items", "to", "比较终点：")?;
                        self.field(a, "label", "比较说明：")?;
                    }
                }
                self.field(c, "footnote", "注：")?;
            }

            _ => unreachable!("component_label and converter are kept in sync"),
        }
        Ok(())
    }
}
