use super::*;

fn syntax() -> &'static Value {
    static SYNTAX: OnceLock<Value> = OnceLock::new();
    SYNTAX.get_or_init(|| serde_json::from_str(include_str!("../../../../../../doe-core/src/text/inline-markdown/syntax.json")).expect("inline syntax"))
}
#[derive(Default)]
struct Frame { marker: String, children: Vec<Part> }
enum Part { Text(String), Frame(Frame) }
fn append(frame: &mut Frame, part: Part) {
    if let Part::Text(text)=part { if let Some(Part::Text(last))=frame.children.last_mut(){last.push_str(&text);}else{frame.children.push(Part::Text(text));} }
    else {frame.children.push(part);}
}

pub(super) fn parse(source: &str) -> (String, Vec<Value>) {
    let chars: Vec<char> = source.chars().collect();
    let delimiters = ["**", "__", "*", "_", "++", "==", "~~"];
    let mut stack = vec![Frame::default()];
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '\\' && i + 1 < chars.len() && (chars[i+1] == 'n' || "\\*_+=~".contains(chars[i+1])) {
            append(stack.last_mut().unwrap(),Part::Text(if chars[i+1]=='n' { "\n".into() } else { chars[i+1].to_string() })); i += 2; continue;
        }
        let top = &stack.last().unwrap().marker;
        let matches = |s: &str| chars[i..].iter().copied().take(s.len()).eq(s.chars());
        let marker = if !top.is_empty() && matches(top) { Some(top.clone()) } else { delimiters.iter().find(|d|matches(d)).map(|s|s.to_string()) };
        if let Some(marker) = marker {
            let before = i.checked_sub(1).and_then(|j| chars.get(j)).copied();
            let after = chars.get(i+marker.len()).copied();
            let word = marker.contains('_') && before.is_some_and(char::is_alphanumeric) && after.is_some_and(char::is_alphanumeric);
            if !word && top == &marker && !stack.last().unwrap().children.is_empty() && before.is_some_and(|c|!c.is_whitespace()) {
                let frame = stack.pop().unwrap(); append(stack.last_mut().unwrap(),Part::Frame(frame)); i += marker.len(); continue;
            }
            if !word && after.is_some_and(|c|!c.is_whitespace()) && stack.len() < 64 {
                i += marker.len(); stack.push(Frame { marker, children: vec![] }); continue;
            }
            i += marker.len(); append(stack.last_mut().unwrap(),Part::Text(marker)); continue;
        }
        append(stack.last_mut().unwrap(),Part::Text(chars[i].to_string())); i += 1;
    }
    while stack.len()>1 {
        let frame=stack.pop().unwrap(); let parent=stack.last_mut().unwrap();
        append(parent,Part::Text(frame.marker)); for child in frame.children {append(parent,child);}
    }
    fn visit(parts: Vec<Part>, marks: &Map<String,Value>, text: &mut String, length: &mut usize, runs: &mut Vec<Value>) {
        for part in parts {
            match part {
                Part::Frame(frame) => {
                    let mut next=marks.clone(); for key in syntax()["delimiters"][&frame.marker].as_array().unwrap() { next.insert(key.as_str().unwrap().into(),json!(true)); }
                    visit(frame.children,&next,text,length,runs);
                },
                Part::Text(value) => {
                    let start=*length; *length+=value.encode_utf16().count(); text.push_str(&value);
                    if value.is_empty() || marks.is_empty() { continue; }
                    if let Some(last)=runs.last_mut().filter(|r|r["end"]==start && syntax()["canonical"].as_object().unwrap().keys().all(|k|r.get(k)==marks.get(k))) { last["end"]=json!(*length); }
                    else { let mut run=marks.clone(); run.insert("start".into(),json!(start));run.insert("end".into(),json!(*length));runs.push(Value::Object(run)); }
                }
            }
        }
    }
    let (mut text,mut length,mut runs)=(String::new(),0,vec![]);
    visit(stack.pop().unwrap().children,&Map::new(),&mut text,&mut length,&mut runs);
    (text,runs)
}

fn encode(text: &str, runs: &[Value]) -> String {
    let units:Vec<u16>=text.encode_utf16().collect();
    let keys=["bold","italic","underline","mark","strike"];
    let mut points=vec![0,units.len()];
    for run in runs { if let (Some(a),Some(b))=(run["start"].as_u64(),run["end"].as_u64()) { if a<b && b as usize<=units.len() {points.extend([a as usize,b as usize]);} } }
    points.sort_unstable();points.dedup();
    let mut output=String::new();let mut active:Vec<&str>=vec![];
    for pair in points.windows(2) {
        let run=runs.iter().find(|r|r["start"].as_u64().is_some_and(|v|v<=pair[0] as u64)&&r["end"].as_u64().is_some_and(|v|v>=pair[1] as u64));
        let next:Vec<&str>=keys.into_iter().filter(|k|run.is_some_and(|r|r[*k]==true)).collect();
        let common=active.iter().zip(&next).take_while(|(a,b)|a==b).count();
        for key in active[common..].iter().rev().chain(next[common..].iter()) {output.push_str(syntax()["canonical"][*key].as_str().unwrap());}
        for ch in String::from_utf16_lossy(&units[pair[0]..pair[1]]).chars() { if "\\*_+=~".contains(ch) {output.push('\\');} output.push(ch); }
        active=next;
    }
    for key in active.iter().rev(){output.push_str(syntax()["canonical"][*key].as_str().unwrap());}
    output
}

fn map_fields(kind: &str, props: &mut Value, transform: &mut impl FnMut(&str,&[Value])->String) {
    fn walk(value: &mut Value, keys: &[&str], path: &mut Vec<Value>, f: &mut impl FnMut(&str,&[Value])->String) {
        if keys.is_empty() { if let Some(text)=value.as_str(){*value=json!(f(text,path));} return; }
        if keys[0]=="*" { if let Some(items)=value.as_array_mut(){for (i,item) in items.iter_mut().enumerate(){path.push(json!(i));walk(item,&keys[1..],path,f);path.pop();}} }
        else if let Some(child)=value.get_mut(keys[0]){path.push(json!(keys[0]));walk(child,&keys[1..],path,f);path.pop();}
    }
    if let Some(patterns)=syntax()["fields"][kind].as_array(){for pattern in patterns {walk(props,&pattern.as_str().unwrap().split('.').collect::<Vec<_>>(),&mut vec![],transform);}}
}
pub(super) fn compile(node: &mut Value) {
    let kind=node["type"].as_str().unwrap_or("").to_owned();let mut entries=vec![];
    map_fields(&kind,&mut node["props"],&mut |source,path| {let (text,runs)=parse(source);if !runs.is_empty(){entries.push(json!({"path":path,"text":text,"runs":runs}));}text});
    if !entries.is_empty(){node["textOverrides"]=json!(entries);}
}
pub(super) fn author_props(node: &Value) -> Value {
    let mut props=node["props"].clone();
    map_fields(node["type"].as_str().unwrap_or(""),&mut props,&mut |text,path| {
        let runs=node["textOverrides"].as_array().and_then(|a|a.iter().find(|e|e["text"]==text&&e["path"]==json!(path))).and_then(|e|e["runs"].as_array());
        encode(text,runs.map(Vec::as_slice).unwrap_or(&[]))
    });props
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn shared_inline_fixtures_and_roundtrips() {
        let cases:Value=serde_json::from_str(include_str!("../../../../../../doe-core/src/text/inline-markdown/fixtures.json")).unwrap();
        for case in cases.as_array().unwrap(){
            let (text,runs)=parse(case["source"].as_str().unwrap());
            assert_eq!(json!({"text":text,"runs":runs}),json!({"text":case["text"],"runs":case["runs"]}),"{}",case["source"]);
            assert_eq!(parse(&encode(&text,&runs)),(text,runs));
        }
    }
    #[test]
    fn inline_compilation_and_storage_roundtrip() {
        let raw="# slide\n## cards=icons\nitems=<[title=\"**标题**\";text=\"第一行\\n==标记==\";icon=User]>\n## image\nsrc=https://example.com/__image__.png\n## code\ncode=**literal**";
        let parsed=super::super::compile(raw,&[]).unwrap().value;
        assert_eq!(parsed["deck"]["slides"][0]["blocks"][0]["props"]["items"][0]["text"],"第一行\n标记");
        assert_eq!(super::super::compile(&super::super::serialize(&parsed).unwrap(),&[]).unwrap().value,parsed);
    }
}
