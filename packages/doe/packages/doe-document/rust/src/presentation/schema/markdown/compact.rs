use super::*;

pub(super) fn starts(value: &str) -> bool {
    let value=value.trim_start();
    value.starts_with('<') || value.strip_prefix('[').is_some_and(|s| {
        let s=s.trim_start();
        s.starts_with(']') || s.split_once('=').is_some_and(|(key,_)| valid_key(key.trim()))
    })
}
fn valid_key(key:&str)->bool {
    !key.is_empty() && (key.as_bytes()[0].is_ascii_alphabetic() || key.starts_with('_'))
        && key.bytes().all(|b|b.is_ascii_alphanumeric()||b==b'_'||b==b'-')
}
pub(super) fn collect(lines:&[&str],index:usize,value:&str)->(String,usize){
    let mut parts=Vec::new();let mut depth=0i32;let mut quote=false;let mut escape=false;let mut done=false;
    for (i,line) in lines.iter().enumerate().skip(index){
        let line=if i==index {value} else {*line};
        let trimmed=line.trim_start_matches(' ');let level=trimmed.bytes().take_while(|b|*b==b'#').count();
        if i>index && line.len()-trimmed.len()<=3 && (1..=32).contains(&level) && trimmed[level..].starts_with(char::is_whitespace){break;}
        parts.push(line);
        for ch in line.chars(){
            if escape {escape=false;continue;}
            if ch=='\\' {escape=true;continue;}
            if ch=='"' {quote=!quote;continue;}
            if quote {continue;}
            if ch=='<'||ch=='[' {depth+=1;}
            else if ch=='>'||ch==']' {depth-=1;if depth<=0 {done=true;}}
        }
        escape=false;if done {break;}
    }
    let end=index+parts.len()-1;(parts.join("\n"),end)
}
struct Reader {chars:Vec<char>,index:usize,line:usize,count:usize}
impl Reader {
    fn peek(&self)->Option<char>{self.chars.get(self.index).copied()}
    fn take(&mut self)->Result<char,String>{let ch=self.peek().ok_or("invalid_compact")?;self.index+=1;if ch=='\n'{self.line+=1;}Ok(ch)}
    fn space(&mut self){while self.peek().is_some_and(char::is_whitespace){let _=self.take();}}
    fn escaped(&mut self)->Result<String,String>{
        let ch=self.take()?;
        Ok(match ch {'n'=>"\n".into(),'r'=>"\r".into(),'t'=>"\t".into(),c if "\\\";[],<>=".contains(c)=>c.to_string(),c=>format!("\\{c}")})
    }
    fn read(&mut self,tag:&str,depth:usize)->Result<Node,String>{
        self.count+=1;if depth>32||self.count>100000{return Err("doe_markdown_compact_limit".into());}
        self.space();let mut node=Node::new(tag,self.line);
        if let Some(open @ ('<'|'['))=self.peek(){
            self.take()?;let array=open=='<';node.kind=Some(if array {"array"} else {"object"}.into());
            let close=if array {'>'} else {']'};self.space();
            while self.peek().is_some_and(|c|c!=close){
                if array {node.children.push(self.read("item",depth+1)?);}
                else {
                    let mut key=String::new();while self.peek().is_some_and(|c|c.is_ascii_alphanumeric()||c=='_'||c=='-'){key.push(self.take()?);}
                    self.space();if !valid_key(&key)||self.take()?!='=' {return Err("invalid_compact".into());}
                    node.children.push(self.read(&key,depth+1)?);
                }
                self.space();if self.peek()==Some(close){break;}
                let expected=if array {','} else {';'};
                let actual=self.take()?;
                if actual!=expected{return Err(format!("Expected '{expected}' between {}, found '{actual}'.",if array {"collection entries"} else {"object properties"}));}self.space();
            }
            if self.take()?!=close{return Err("invalid_compact".into());}return Ok(node);
        }
        let mut value=String::new();
        if self.peek()==Some('"'){
            self.take()?;
            loop {let ch=self.take()?;if ch=='"'{break;}if ch=='\\'{value.push_str(&self.escaped()?);}else{value.push(ch);}}
        } else {
            while self.peek().is_some_and(|c|!";,]>".contains(c)){
                let ch=self.take()?;if "<[\"".contains(ch){return Err("invalid_compact".into());}
                if ch=='\\'{value.push_str(&self.escaped()?);}else{value.push(ch);}
            }
            value=value.trim().into();
        }
        node.value=Some(value);Ok(node)
    }
}
pub(super) fn parse(raw:&str,tag:&str,line:usize)->Result<Node,String>{
    let mut reader=Reader {chars:raw.chars().collect(),index:0,line,count:0};
    let result=reader.read(tag,0).and_then(|node|{reader.space();if reader.peek().is_some(){Err("invalid_compact".into())}else{Ok(node)}});
    match result {Err(e) if e=="doe_markdown_compact_limit"=>Err(e),Err(_)=>Ok(Node{kind:Some("invalid".into()),..Node::new(tag,line)}),other=>other}
}

pub(super) fn explain(raw: &str, line: usize) -> Option<Value> {
    let mut reader = Reader { chars: raw.chars().collect(), index: 0, line, count: 0 };
    let message = match reader.read("value", 0) {
        Err(error) => error,
        Ok(_) => {
            reader.space();
            if reader.peek().is_none() { return None; }
            "Unexpected content after the closed collection/object.".into()
        }
    };
    Some(json!({"line":reader.line,"message":message,
        "hint":"Use <...> for collections, commas between entries, and semicolons between properties inside [..]. Quote text containing delimiters. Close quotes and all brackets.",
        "example":"items=<[title=\"Title\";text=\"Body\"],[title=\"Next\";text=\"Body\"]>"}))
}
pub(super) fn value(v:&Value,s:&Value)->String{
    let s=if s["type"]=="union" {
        let kind=if v.is_array(){"array"}else if v.is_object(){"object"}else if v.is_string(){"string"}else if v.is_boolean(){"boolean"}else{"number"};
        s["choices"].as_array().and_then(|a|a.iter().find(|s|s["type"]==kind)).unwrap_or(s)
    }else{s};
    match v {
        Value::Array(items)=>format!("<{}>",items.iter().map(|v|value(v,&s["item"])).collect::<Vec<_>>().join(",")),
        Value::Object(fields)=>format!("[{}]",fields.iter().filter(|(k,v)|s["fields"].get(*k).is_some()&&!v.is_null()&&s["fields"][*k].get("default")!=Some(*v)).map(|(k,v)|format!("{k}={}",value(v,&s["fields"][k]))).collect::<Vec<_>>().join(";")),
        Value::String(text)=>format!("\"{}\"",text.replace('\\',"\\\\").replace('"',"\\\"").replace('\n',"\\n").replace('\r',"\\r").replace('\t',"\\t")),
        _=>v.to_string(),
    }
}
