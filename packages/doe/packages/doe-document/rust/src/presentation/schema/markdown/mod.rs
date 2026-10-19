//! DOE 2.1 authoring compiler. The browser and server consume the same field contract.
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::sync::OnceLock;
mod serialize;
mod compact;
mod inline;
pub mod feedback;
pub use serialize::{serialize, serialize_with_layout_overrides};
mod bind;
pub use bind::compile_bound_slide;
pub mod preview;
pub use preview::{process as process_output, prepare_edit};
pub const AUTHORING_PROMPT: &str =
    include_str!("../../../../../src/document/presentation/schema/markdown/authoring.md");

fn contract() -> &'static Value {
    static CONTRACT: OnceLock<Value> = OnceLock::new();
    CONTRACT.get_or_init(|| {
        serde_json::from_str(include_str!(
            "../../../../../src/document/presentation/schema/markdown/contract.json"
        ))
        .expect("checked Markdown contract")
    })
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Attribute {
    pub key: String,
    pub value: String,
    pub line: usize,
}
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Node {
    pub tag: String,
    pub line: usize,
    pub value: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
    pub attributes: Vec<Attribute>,
    pub text: Vec<String>,
    pub children: Vec<Node>,
    #[serde(rename = "literalLines", default)]
    pub literal_lines: Vec<usize>,
}
impl Node {
    fn new(tag: &str, line: usize) -> Self {
        Self {
            tag: tag.into(),
            line,
            ..Self::default()
        }
    }
    fn literal(tag: &str, value: &str, line: usize) -> Self {
        Self {
            value: Some(value.into()),
            ..Self::new(tag, line)
        }
    }
    pub(crate) fn body(&self) -> String {
        self.value.clone().unwrap_or_else(|| self.text_body())
    }
    fn text_body(&self) -> String {
            let mut start = 0;
            let mut end = self.text.len();
            while start < end && self.text[start].is_empty() && !self.literal_lines.contains(&start)
            {
                start += 1
            }
            while end > start
                && self.text[end - 1].is_empty()
                && !self.literal_lines.contains(&(end - 1))
            {
                end -= 1
            }
            self.text[start..end].join("\n")
    }
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Diagnostic {
    pub line: usize,
    pub path: String,
    pub code: String,
    pub level: String,
    #[serde(skip)]
    pub expected: Option<Value>,
    #[serde(skip)]
    pub actual: Option<Value>,
}
pub struct Compilation {
    pub tree: Node,
    pub value: Value,
    pub diagnostics: Vec<Diagnostic>,
}

fn heading(line: &str) -> Option<(usize, &str, Option<&str>)> {
    let spaces = line.len() - line.trim_start_matches(' ').len();
    if spaces > 3 {
        return None;
    }
    let line = &line[spaces..];
    let level = line.bytes().take_while(|b| *b == b'#').count();
    if !(1..=32).contains(&level) || !line[level..].starts_with(' ') {
        return None;
    }
    let rest = line[level..].trim();
    let (tag, value) = rest
        .split_once('=')
        .map_or((rest, None), |(a, b)| (a, Some(b)));
    if tag.is_empty() || tag.chars().any(char::is_whitespace) {
        return None;
    }
    Some((level, tag, value))
}
fn attribute(line: &str) -> Option<(&str, &str)> {
    let (key, value) = line.split_once('=')?;
    if key.is_empty()
        || !(key.as_bytes()[0].is_ascii_alphabetic() || key.starts_with('_'))
        || !key
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
    {
        None
    } else {
        Some((key, value))
    }
}
fn fence(line: &str) -> Option<(char, usize, &str)> {
    if line.len() - line.trim_start_matches(' ').len() > 3 {
        return None;
    }
    let line = line.trim_start_matches(' ');
    let ch = line.chars().next()?;
    if ch != '`' && ch != '~' {
        return None;
    }
    let count = line.chars().take_while(|c| *c == ch).count();
    if count < 3 {
        None
    } else {
        Some((ch, count, &line[count..]))
    }
}
pub fn is_markdown(raw: &str) -> bool {
    let raw = raw.trim_start_matches('\u{feff}').trim_start();
    if raw.starts_with('{') || raw.starts_with('[') {
        return false;
    }
    raw.lines().take(32).any(|line| {
        heading(line).is_some_and(|(l, t, v)| {
            l == 1
                && (t == "slide" || t == "presentation" || t == "type" && v == Some("presentation"))
        })
    })
}
pub fn parse_tree(raw: &str) -> Result<Node, String> {
    if raw.len() > 8 * 1024 * 1024 {
        return Err("doe_markdown_too_large".into());
    }
    let normalized = raw
        .trim_start_matches('\u{feff}')
        .replace("\r\n", "\n")
        .replace('\r', "\n");
    let trimmed = normalized.trim();
    let source = if let Some((first, body)) = trimmed.split_once('\n') {
        if let Some(('`', count, lang)) = fence(first) {
            let end = "`".repeat(count);
            if matches!(lang, "markdown" | "md" | "doe") && body.ends_with(&format!("\n{end}")) {
                &body[..body.len() - end.len() - 1]
            } else {
                &normalized
            }
        } else {
            &normalized
        }
    } else {
        &normalized
    };
    let mut stack = vec![(0, Node::new("document", 1))];
    let mut active_fence = None;
    let mut count = 0;
    let lines=source.split('\n').collect::<Vec<_>>();
    let mut consumed=None;
    for (index, line) in lines.iter().copied().enumerate() {
        if consumed.is_some_and(|end|index<=end){continue;}
        let marker = fence(line);
        if let Some((ch, len)) = active_fence {
            if marker.is_some_and(|(c, n, s)| c == ch && n >= len && s.trim().is_empty()) {
                active_fence = None
            } else {
                let node = &mut stack.last_mut().unwrap().1;
                node.literal_lines.push(node.text.len());
                node.text.push(line.into())
            }
            continue;
        }
        if let Some((ch, len, _)) = marker {
            active_fence = Some((ch, len));
            continue;
        }
        if let Some((level, tag, value)) = heading(line) {
            count += 1;
            if count > 100000 {
                return Err("doe_markdown_too_many_nodes".into());
            }
            while stack.last().unwrap().0 >= level {
                let (_, node) = stack.pop().unwrap();
                stack.last_mut().unwrap().1.children.push(node)
            }
            let mut node = Node::new(tag, index + 1);
            node.value = value.map(str::to_owned);
            stack.push((level, node));
        } else if let Some((key, value)) = attribute(line) {
            if compact::starts(value){
                let (raw,end)=compact::collect(&lines,index,value);consumed=Some(end);
                let parsed=compact::parse(&raw,key,index+1)?;let mut pending=vec![&parsed];
                while let Some(node)=pending.pop(){count+=1;if count>100000{return Err("doe_markdown_too_many_nodes".into());}pending.extend(&node.children);}
                stack.last_mut().unwrap().1.children.push(parsed);
                continue;
            }
            stack.last_mut().unwrap().1.attributes.push(Attribute {
                key: key.into(),
                value: value.into(),
                line: index + 1,
            });
        } else {
            let escaped = line
                .strip_prefix('\\')
                .filter(|s| heading(s).is_some() || attribute(s).is_some() || fence(s).is_some())
                .unwrap_or(line);
            stack.last_mut().unwrap().1.text.push(escaped.into());
        }
    }
    if active_fence.is_some() {
        return Err("doe_markdown_unclosed_fence".into());
    }
    while stack.len() > 1 {
        let (_, node) = stack.pop().unwrap();
        stack.last_mut().unwrap().1.children.push(node)
    }
    Ok(stack.pop().unwrap().1)
}
fn numeric(raw: &str) -> Option<f64> {
    static NUMBER: OnceLock<regex::Regex> = OnceLock::new();
    if !NUMBER
        .get_or_init(|| {
            regex::Regex::new(r"^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$").unwrap()
        })
        .is_match(raw)
    {
        return None;
    }
    raw.parse::<f64>().ok().filter(|n| n.is_finite())
}
fn scalar(raw: &str, s: &Value) -> Option<Value> {
    match s["type"].as_str()? {
        "union" => s["choices"].as_array()?.iter().find_map(|s| scalar(raw, s)),
        "string" => Some(json!(raw)),
        "scalar" => Some(numeric(raw).map_or_else(
            || json!(raw),
            |n| {
                if n.fract() == 0.0 && n.abs() <= 9007199254740991.0 {
                    json!(n as i64)
                } else {
                    json!(n)
                }
            },
        )),
        "boolean" => match raw {
            "true" => Some(json!(true)),
            "false" => Some(json!(false)),
            _ => None,
        },
        "enum" => s["values"]
            .as_array()?
            .iter()
            .find(|v| {
                v.as_str()
                    .map(str::to_owned)
                    .unwrap_or_else(|| v.to_string())
                    == raw
            })
            .cloned(),
        "position" => {
            let parts = raw.split(' ').collect::<Vec<_>>();
            (parts.len() == 2
                && parts.iter().all(|p| {
                    p.strip_suffix('%')
                        .and_then(numeric)
                        .is_some_and(|n| (0.0..=100.0).contains(&n))
                }))
            .then(|| json!(raw))
        }
        "number" | "integer" => {
            let n = numeric(raw)?;
            if s["type"] == "integer" && n.fract() != 0.0
                || s["min"].as_f64().is_some_and(|v| n < v)
                || s["max"].as_f64().is_some_and(|v| n > v)
                || s["minExclusive"].as_f64().is_some_and(|v| n <= v)
            {
                None
            } else {
                Some(if n.fract() == 0.0 && n.abs() <= 9007199254740991.0 {
                    json!(n as i64)
                } else {
                    json!(n)
                })
            }
        }
        _ => None,
    }
}
fn split_cells(raw: &str) -> Vec<String> {
    let mut cells = Vec::new();
    let mut cell = String::new();
    let mut chars = raw.chars().peekable();
    while let Some(ch) = chars.next() {
        if ch == '\\' && chars.peek().is_some_and(|c| *c == '|' || *c == '\\') {
            cell.push(chars.next().unwrap())
        } else if ch == '|' {
            cells.push(cell.trim().into());
            cell.clear()
        } else {
            cell.push(ch)
        }
    }
    cells.push(cell.trim().into());
    cells
}
struct Compiler {
    diagnostics: Vec<Diagnostic>,
}
impl Compiler {
    fn issue(&mut self, node: &Node, path: &str, code: &str, error: bool) {
        self.diagnostics.push(Diagnostic {
            line: node.line,
            path: path.into(),
            code: code.into(),
            level: if error { "error" } else { "warning" }.into(),
            expected: None,
            actual: None,
        })
    }
    fn field_issue(&mut self, node: &Node, path: &str, code: &str, error: bool, schema: &Value, actual: Value) {
        self.issue(node, path, code, error);
        let diagnostic = self.diagnostics.last_mut().unwrap();
        let expected: Map<String, Value> = ["type", "min", "max", "values", "enum", "required"]
            .into_iter().filter_map(|key| schema.get(key).map(|value| (key.into(), value.clone()))).collect();
        diagnostic.expected = Some(Value::Object(expected));
        diagnostic.actual = Some(actual);
    }
    fn assign(
        &mut self,
        result: &mut Map<String, Value>,
        key: &str,
        node: &Node,
        schema: &Value,
        path: &str,
        assigned: &mut std::collections::HashMap<String, (Option<Value>, usize)>,
    ) {
        let next = format!("{path}/{key}");
        let Some(field) = schema["fields"].get(key) else {
            let misplaced = matches!(key, "theme" | "pageNumber" | "pageNumberFormat")
                || key == "title" && schema == &contract()["slide"];
            self.issue(node, &next, if misplaced { "misplaced_field" } else { "unknown_field" }, misplaced);
            return;
        };
        let required = schema["required"]
            .as_array()
            .is_some_and(|a| a.iter().any(|v| v == key));
        let start = self.diagnostics.len();
        let mut value = if !required
            && field.get("default").is_none()
            && !matches!(field["type"].as_str(), Some("object" | "array" | "union"))
            && scalar(&node.body(), field).is_none()
        {
            self.field_issue(node, &next, "invalid_value", false, field, json!(node.body().chars().take(320).collect::<String>()));
            None
        } else {
            self.convert(node, field, &next, None)
        };
        if !required && self.diagnostics[start..].iter().any(|d| d.level == "error")
            && !self.diagnostics[start..].iter().any(|d| matches!(d.code.as_str(), "conflicting_field_content" | "misplaced_field")) {
            for d in &mut self.diagnostics[start..] {
                d.level = "warning".into()
            }
            value = field.get("default").cloned();
        }
        if !self.diagnostics[start..].iter().any(|d| d.code == "invalid_value" && d.path == next) {
            if let Some((previous, line)) = assigned.get(key) {
                if previous != &value {
                    self.issue(&Node::new(key, node.line.max(*line)), &next, "conflicting_field_content", true);
                    return;
                }
            }
            assigned.insert(key.into(), (value.clone(), node.line));
        }
        match value {
            Some(v) => {
                result.insert(key.into(), v);
            }
            None => {
                result.remove(key);
            }
        }
    }
    fn convert(&mut self, node: &Node, s: &Value, path: &str, body: Option<&str>) -> Option<Value> {
        let direct_text = node.text_body();
        if node.value.as_ref().is_some_and(|value| !direct_text.is_empty() && value != &direct_text) {
            let path = body.map(|key| format!("{path}/{key}")).unwrap_or_else(|| path.into());
            self.issue(node, &path, "conflicting_field_content", true);
        }
        if node.kind.is_none() && matches!(s["type"].as_str(),Some("array"|"object")) && node.value.as_ref().is_some_and(|v|v.trim_start().starts_with(['[','{'])){
            self.field_issue(node,path,"invalid_value",true,s,json!(node.body().chars().take(320).collect::<String>()));return s.get("default").cloned();
        }
        if node.kind.as_deref().is_some_and(|k|k=="invalid" || s["type"]!="union" && s["type"]!=k){
            self.field_issue(node,path,"invalid_value",true,s,json!(node.body().chars().take(320).collect::<String>()));return s.get("default").cloned();
        }
        match s["type"].as_str()? {
            "union" => {
                let compound = !node.children.is_empty() || !node.attributes.is_empty();
                let choice = s["choices"].as_array()?.iter().find(|s| {
                    if let Some(kind)=&node.kind {s["type"]==*kind} else if compound {
                        matches!(s["type"].as_str(), Some("object" | "array"))
                    } else {
                        scalar(&node.body(), s).is_some()
                    }
                })?;
                self.convert(node, choice, path, body)
            }
            "array" => {
                let entries = if !node.children.is_empty() || node.kind.as_deref()==Some("array") {
                    node.children.clone()
                } else {
                    let body = node
                        .body()
                        .lines()
                        .map(|s| {
                            s.strip_prefix("- ")
                                .or_else(|| s.strip_prefix("* "))
                                .unwrap_or(s)
                        })
                        .collect::<Vec<_>>()
                        .join("|");
                    split_cells(&body)
                        .iter()
                        .filter(|s| !s.is_empty())
                        .map(|s| Node::literal("item", s, node.line))
                        .collect()
                };
                let result = entries
                    .iter()
                    .enumerate()
                    .map(|(i, n)| {
                        self.convert(n, &s["item"], &format!("{path}/{i}"), None)
                            .unwrap_or(Value::Null)
                    })
                    .collect::<Vec<_>>();
                if result.len() < (s["min"].as_u64().unwrap_or(0) as usize)
                    || result.len() > s["max"].as_u64().unwrap_or(100) as usize
                {
                    self.field_issue(node, path, "item_count", true, s, json!(result.len()))
                }
                Some(json!(result))
            }
            "object" => {
                let fields = s["fields"].as_object()?;
                let mut result = Map::new();
                let mut assigned = std::collections::HashMap::new();
                for (key, field) in fields {
                    if let Some(default) = field.get("default") {
                        result.insert(key.clone(), default.clone());
                    }
                }
                for attr in &node.attributes {
                    self.assign(
                        &mut result,
                        &attr.key,
                        &Node::literal(&attr.key, &attr.value, attr.line),
                        s,
                        path,
                        &mut assigned,
                    )
                }
                let mut grouped: Vec<(String, Vec<Node>)> = Vec::new();
                for child in &node.children {
                    let key = if fields.contains_key(&child.tag) {
                        child.tag.as_str()
                    } else {
                        contract()["aliases"][&child.tag]
                            .as_str()
                            .unwrap_or(&child.tag)
                    };
                    if fields.get(key).is_some_and(|f| f["type"] == "array") && child.kind.is_none() {
                        let i = grouped
                            .iter()
                            .position(|(k, _)| k == key)
                            .unwrap_or_else(|| {
                                grouped.push((key.into(), vec![]));
                                grouped.len() - 1
                            });
                        if child.tag == key
                            && !child.children.is_empty()
                            && child
                                .children
                                .iter()
                                .all(|c| c.tag == "item" || contract()["aliases"][&c.tag] == key)
                        {
                            grouped[i].1.extend(child.children.clone())
                        } else {
                            grouped[i].1.push(child.clone())
                        }
                    } else {
                        self.assign(&mut result, key, child, s, path, &mut assigned)
                    }
                }
                for (key, children) in grouped {
                    self.assign(
                        &mut result,
                        &key,
                        &Node {
                            children,
                            ..Node::new(&key, node.line)
                        },
                        s,
                        path,
                        &mut assigned,
                    )
                }
                let body_key = body.or_else(|| {
                    [
                        "title", "text", "label", "name", "header", "formula", "value",
                    ]
                    .into_iter()
                    .find(|k| fields.contains_key(*k))
                });
                if let Some(key) = body_key {
                    let text = node.body();
                    if !text.is_empty() {
                        self.assign(
                            &mut result,
                            key,
                            &Node::literal(key, &text, node.line),
                            s,
                            path,
                            &mut assigned,
                        )
                    }
                }
                if let Some(required) = s["required"].as_array() {
                    for key in required.iter().filter_map(Value::as_str) {
                        if result.get(key).is_none_or(|v| v == "") {
                            self.field_issue(node, &format!("{path}/{key}"), "missing_content", true, &fields[key], Value::Null)
                        }
                    }
                }
                Some(Value::Object(result))
            }
            _ => {
                let v = scalar(&node.body(), s);
                if v.is_some() {
                    v
                } else {
                    self.field_issue(node, path, "invalid_value", s.get("default").is_none(), s, json!(node.body().chars().take(320).collect::<String>()));
                    s.get("default").cloned()
                }
            }
        }
    }
    fn component(&mut self, node: &Node, id: &str, depth: usize) -> Option<Value> {
        if matches!(node.tag.as_str(), "theme" | "pageNumber" | "pageNumberFormat") {
            self.issue(node, id, "misplaced_field", true);
            return None;
        }
        let mut resolved = node.clone();
        let preset = &contract()["authoring"]["presets"][&node.tag];
        let group = contract()["authoring"]["groups"][&node.tag].as_str();
        if let Some((kind, _)) = contract()["authoring"]["names"].as_object()?.iter().find(|(_, name)| *name == &node.tag) {
            resolved.tag = kind.clone();
        } else if let Some(kind) = contract()["authoring"]["legacyNames"][&node.tag].as_str() {
            resolved.tag = kind.into();
        }
        if let Some(kind) = preset["type"].as_str() { resolved.tag = kind.into(); }
        if group.is_some() { resolved.tag = "group".into(); }
        if let Some(fixed) = preset["presentation"].as_str().or(group) {
            let selector = if group.is_some() { "variant" } else { "presentation" };
            if node.value.as_deref().is_some_and(|v| v != fixed)
                || node.attributes.iter().any(|a| a.key == selector && a.value != fixed)
                || node.children.iter().any(|c| c.tag == selector && c.body() != fixed) {
                self.issue(node, id, "conflicting_component_style", true);
            }
            resolved.value = Some(fixed.into());
        }
        let styles = &contract()["authoring"]["styles"][&resolved.tag];
        if let Some(value) = resolved.value.as_ref().and_then(|v| styles.get(v)).and_then(Value::as_str) {
            resolved.value = Some(value.into());
        }
        let short = contract()["components"][&resolved.tag]["shorthand"].as_str();
        for attr in &mut resolved.attributes {
            if Some(attr.key.as_str()) == short {
                if let Some(value) = styles.get(&attr.value).and_then(Value::as_str) { attr.value = value.into(); }
            }
        }
        let node = &resolved;
        if depth > 3 {
            self.issue(node, id, "group_depth", true);
            return None;
        }
        if node.tag == "group" || node.tag == "layout-group" {
            let mut input = Node {
                attributes: node.attributes.clone(),
                ..Node::new("group", node.line)
            };
            if let Some(v) = &node.value {
                input.attributes.push(Attribute {
                    key: "variant".into(),
                    value: v.clone(),
                    line: node.line,
                })
            }
            let mut layout =
                self.convert(&input, &contract()["group"], &format!("{id}/layout"), None)?;
            if layout["variant"] == "edge-media" { layout["contentAlign"] = json!("center"); }
            if layout["variant"] != "edge-media" {
                for k in ["mediaPosition", "mediaRatio", "mediaShape", "contentAlign"] {
                    layout.as_object_mut()?.remove(k);
                }
            }
            if layout["variant"] == "composition" {
                layout["direction"] = json!("row");
                if layout.get("ratio").is_none() {
                    layout["ratio"] = json!("balanced")
                }
            }
            if layout["variant"] == "edge-media"
                && layout["mediaRatio"].as_f64().is_some_and(|n| {
                    n > if matches!(layout["mediaPosition"].as_str(), Some("left" | "right")) {
                        0.52
                    } else {
                        0.58
                    }
                })
            {
                layout.as_object_mut()?.remove("mediaRatio");
            }
            let mut children = node
                .children
                .iter()
                .enumerate()
                .filter_map(|(i, c)| self.component(c, &format!("{id}-{}", i + 1), depth + 1))
                .collect::<Vec<_>>();
            if children.is_empty() {
                self.issue(node, id, "missing_content", true)
            }
            if layout["variant"] == "edge-media" {
                for c in &mut children {
                    if !c["layout"].is_object() {
                        c["layout"] = json!({})
                    }
                    c["layout"]["region"] = json!(if c["type"] == "media" {
                        "media"
                    } else {
                        "content"
                    });
                }
            }
            return Some(json!({"id":id,"type":"layout-group","layout":layout,"children":children}));
        }
        let Some(def) = contract()["components"].get(&node.tag) else {
            self.issue(node, id, "unknown_component", true);
            return None;
        };
        let mut schema = def["schema"].clone();
        let content = schema["fields"]["content"].clone();
        if content["type"] == "object" {
            schema["fields"].as_object_mut()?.remove("content");
            schema["fields"]
                .as_object_mut()?
                .extend(content["fields"].as_object()?.clone());
            schema["required"]
                .as_array_mut()?
                .retain(|v| v != "content");
            schema["required"]
                .as_array_mut()?
                .extend(content["required"].as_array()?.clone());
        }
        let mut input = node.clone();
        input.value = None;
        input.children = node
            .children
            .iter()
            .flat_map(|c| {
                if c.tag == "content" {
                    c.children.clone()
                } else {
                    vec![c.clone()]
                }
            })
            .collect();
        for c in &node.children {
            if c.tag == "content" {
                input.attributes.extend(c.attributes.clone())
            }
        }
        if let (Some(key), Some(value)) = (def["shorthand"].as_str(), &node.value) {
            input.attributes.push(Attribute {
                key: key.into(),
                value: value.clone(),
                line: node.line,
            })
        } else if def["body"].is_string() {
            input.value = node.value.clone()
        }
        let (layout_attrs, attrs): (Vec<_>, Vec<_>) = input
            .attributes
            .into_iter()
            .partition(|a| contract()["leafLayout"]["fields"].get(&a.key).is_some());
        input.attributes = attrs;
        let mut props = self.convert(
            &input,
            &schema,
            &format!("{id}/props"),
            def["body"].as_str(),
        )?;
        if let Some(fields) = content["fields"].as_object() {
            let mut wrapped = Map::new();
            for key in fields.keys() {
                if let Some(v) = props.as_object_mut()?.remove(key) {
                    wrapped.insert(key.clone(), v);
                }
            }
            props["content"] = Value::Object(wrapped);
        }
        if node.tag == "contents" {
            let p = props["presentation"].as_str().unwrap_or("cards:filled");
            if p != "image-text" {
                for key in ["imageSize", "imageFit", "imageAspectRatio", "surface"] {
                    if props.get(key).is_some() {
                        self.issue(node, &format!("{id}/props/{key}"), "image_options_presentation", true);
                    }
                }
            }
            let max = if p == "metrics" {
                12
            } else if p.starts_with("ascending-") {
                5
            } else if p.starts_with("shape:") || p.starts_with("timeline-") || p == "alternating" {
                1
            } else if p.starts_with("list:") {
                2
            } else {
                4
            };
            for key in ["itemColumns", "columnPreference"] {
                if props[key].as_i64().is_some_and(|n| n > max) {
                    props[key] = json!("auto");
                    self.issue(node, &format!("{id}/props/{key}"), "invalid_value", false)
                }
            }
            if let Some(items) = props["items"].as_array_mut() {
                for (i, item) in items.iter_mut().enumerate() {
                    if item.is_object() {
                        item["id"] = json!(format!("{id}-item-{}", i + 1));
                    }
                }
            }
        }
        if node.tag == "item-cards" {
            for key in ["itemColumns", "columnPreference"] {
                if props[key] == 5 {
                    props[key] = json!("auto")
                }
            }
        }
        if node.tag != "contents" {
            for key in ["itemColumns", "columnPreference"] {
                if props[key] == "auto" {
                    props.as_object_mut()?.remove(key);
                }
            }
        }
        if props["itemColumns"].is_number()
            && !node.attributes.iter().any(|a| a.key == "itemLayout")
        {
            props["itemLayout"] = json!(if props["itemColumns"] == 1 {
                "stack"
            } else {
                "grid"
            })
        }
        if node.tag == "mind-map" && doe_component::schema::mind_map_validate(props.as_object().unwrap(),"props").is_err() { self.issue(node,id,"mind_map_structure",true); }
        if node.tag == "double-ring" {
            if let Some(items) = props["items"].as_array() {
                let left = items.iter().enumerate().filter(|(i,item)| item["side"].as_str().unwrap_or(if i % 2 == 0 {"left"} else {"right"}) == "left").count();
                if !(1..=3).contains(&left) || !(1..=3).contains(&(items.len()-left)) { self.issue(node,id,"side_item_count",true); }
            }
        }
        let shape = if node.tag == "shape-contents" {
            props["variant"].as_str()
        } else if node.tag == "contents" {
            props["presentation"]
                .as_str()
                .and_then(|p| p.strip_prefix("shape:"))
        } else {
            None
        };
        if let Some(shape) = shape {
            let count = props["items"].as_array().map_or(0, Vec::len);
            let max = if shape == "petals" {
                8
            } else if matches!(shape, "stairs" | "pyramid" | "inverted-pyramid") {
                12
            } else {
                6
            };
            if count < 2 || count > max {
                self.field_issue(node, &format!("{id}/props/items"), "shape_item_count", true, &json!({"type":"array","min":2,"max":max}), json!(count))
            }
        }
        if node.tag == "contents"
            && props["presentation"] == "numbered"
            && props["items"]
                .as_array()
                .is_none_or(|a| !(2..=6).contains(&a.len()))
        {
            self.field_issue(node, &format!("{id}/props/items"), "item_count", true, &json!({"type":"array","min":2,"max":6}), json!(props["items"].as_array().map_or(0,Vec::len)))
        }
        let chart = &props["content"];
        for (a, b, values, code) in [
            ("categories", "series", "data", "series_length"),
            ("columns", "rows", "cells", "row_length"),
            ("axes", "datasets", "values", "dataset_length"),
        ] {
            if let (Some(categories), Some(series)) = (chart[a].as_array(), chart[b].as_array()) {
                if series.iter().any(|s| {
                    s[values]
                        .as_array()
                        .is_none_or(|v| v.len() != categories.len())
                }) {
                    self.issue(node, id, code, true)
                }
            }
        }
        if let (Some(axes), Some(datasets)) =
            (chart["axes"].as_array(), chart["datasets"].as_array())
        {
            if datasets.iter().any(|s| {
                s["values"].as_array().is_some_and(|a| {
                    a.iter().enumerate().any(|(i, v)| {
                        v.as_f64().is_some_and(|v| {
                            v < 0.0
                                || axes
                                    .get(i)
                                    .and_then(|a| a["max"].as_f64())
                                    .is_some_and(|max| v > max)
                        })
                    })
                })
            }) {
                self.issue(node, id, "radar_range", true)
            }
        }
        if matches!(node.tag.as_str(), "grouped-bar-chart" | "stacked-bar-chart")
            && chart["series"].as_array().is_some_and(|s| {
                s.iter().any(|s| {
                    s["data"]
                        .as_array()
                        .is_some_and(|a| a.iter().any(|v| v.as_f64().is_some_and(|n| n < 0.0)))
                })
            })
        {
            self.issue(node, id, "negative_data", true)
        }
        if node.tag == "donut-chart"
            && chart["items"].as_array().is_none_or(|a| {
                !a.iter()
                    .any(|i| i["value"].as_f64().is_some_and(|n| n > 0.0))
            })
        {
            self.issue(node, id, "empty_donut", true)
        }
        let mut result = json!({"id":id,"type":node.tag,"props":props});
        inline::compile(&mut result);
        if !layout_attrs.is_empty() {
            result["layout"] = self.convert(
                &Node {
                    attributes: layout_attrs,
                    ..Node::new("layout", node.line)
                },
                &contract()["leafLayout"],
                &format!("{id}/layout"),
                None,
            )?
        }
        Some(result)
    }
}

pub fn compile(raw: &str, slide_ids: &[String]) -> Result<Compilation, String> {
    compile_detailed(raw, slide_ids).map_err(|failure| failure.message)
}

pub struct CompilationFailure {
    pub message: String,
    pub diagnostics: Vec<Diagnostic>,
}

impl From<String> for CompilationFailure {
    fn from(message: String) -> Self {
        Self { message, diagnostics: vec![] }
    }
}

pub fn compile_detailed(raw: &str, slide_ids: &[String]) -> Result<Compilation, CompilationFailure> {
    let tree = parse_tree(raw)?;
    let mut c = Compiler {
        diagnostics: vec![],
    };
    let project = tree
        .children
        .iter()
        .find(|n| n.tag == "presentation" || n.tag == "type");
    let pages = tree
        .children
        .iter()
        .flat_map(|n| {
            if Some(n as *const Node) == project.map(|p| p as *const Node) {
                n.children
                    .iter()
                    .filter(|c| c.tag == "slide")
                    .collect::<Vec<_>>()
            } else if n.tag == "slide" {
                vec![n]
            } else {
                vec![]
            }
        })
        .collect::<Vec<_>>();
    if pages.is_empty() || pages.len() > 200 {
        return Err("doe_markdown_slide_count".to_string().into());
    }
    let mut deck_input = Node {
        attributes: tree.attributes.clone(),
        children: tree.children.iter().chain(project.into_iter().flat_map(|p| p.children.iter()))
            .filter(|n| contract()["deck"]["fields"].get(&n.tag).is_some()).cloned().collect(),
        ..Node::new("deck", 1)
    };
    if let Some(project) = project {
        deck_input.attributes.extend(project.attributes.clone())
    }
    let metadata = c
        .convert(&deck_input, &contract()["deck"], "deck", None)
        .unwrap();
    let mut slides = Vec::new();
    for (index, page) in pages.iter().enumerate() {
        let id = slide_ids
            .get(index)
            .cloned()
            .unwrap_or_else(|| format!("slide-{}", index + 1));
        let settings = Node {
            attributes: page.attributes.clone(),
            children: page
                .children
                .iter()
                .filter(|n| contract()["slide"]["fields"].get(&n.tag).is_some())
                .cloned()
                .collect(),
            ..Node::new("slide", page.line)
        };
        let props = c
            .convert(&settings, &contract()["slide"], &id, None)
            .unwrap();
        let blocks = page
            .children
            .iter()
            .filter(|n| contract()["slide"]["fields"].get(&n.tag).is_none())
            .enumerate()
            .filter_map(|(i, n)| c.component(n, &format!("{id}-{}", i + 1), 0))
            .collect::<Vec<_>>();
        if blocks.is_empty() || blocks.len() > 2048 {
            c.issue(page, &id, "block_count", true)
        }
        let preset = if blocks
            .iter()
            .any(|b| b["type"] == "layout-group" && b["layout"]["variant"] == "edge-media")
        {
            json!("edge-media")
        } else {
            props["preset"].clone()
        };
        let mut slide =
            json!({"id":id,"size":{"width":960,"height":540,"unit":"pt"},"blocks":blocks});
        if let Some(logo) = props.get("logo") {
            slide["logo"] = if logo == "none" { Value::Null } else { json!({"src":logo}) };
        }
        if let Some(background) = props.get("background") {
            slide["background"] = background.clone()
        }
        if preset != "flow" {
            slide["layout"] = json!({"preset":preset})
        }
        slides.push(slide);
    }
    let errors = c
        .diagnostics
        .iter()
        .filter(|d| d.level == "error")
        .map(|d| format!("{}:{}:{}", d.line, d.path, d.code))
        .collect::<Vec<_>>();
    if !errors.is_empty() {
        return Err(CompilationFailure { message: format!(
            "doe_markdown_invalid_content: {}",
            errors.join("; ")
        ), diagnostics: c.diagnostics });
    }
    let title = metadata["title"]
        .as_str()
        .filter(|s| !s.is_empty())
        .unwrap_or("Yrkie 幻灯片");
    let mut value = json!({"version":4,"pageNumber":{"enabled":metadata["pageNumber"],"format":metadata["pageNumberFormat"]},"deck":{"title":title,"theme":metadata["theme"],"slides":slides}});
    if let Some(logo) = metadata.get("logo") {
        value["logo"] = if logo == "none" { Value::Null } else { json!({"src":logo}) };
    }
    Ok(Compilation {
        tree,
        value,
        diagnostics: c.diagnostics,
    })
}

#[cfg(test)]
mod tests;
