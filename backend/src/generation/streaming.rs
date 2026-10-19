//! Display-only provider stream projection. Never execute or persist a partial document.
use crate::ai::text::StreamEvent;
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    time::{Duration, Instant},
};

#[derive(Default)]
struct Call {
    display_id: String,
    id: String,
    name: String,
    arguments: String,
    sent: usize,
    started: bool,
    last_draft: String,
    last_previewed: Option<Instant>,
}

pub struct Projection {
    run: String,
    round: usize,
    calls: BTreeMap<usize, Call>,
    draft_bytes: usize,
}

impl Projection {
    pub fn new(run: &str, round: usize) -> Self {
        Self {
            run: run.into(),
            round,
            calls: BTreeMap::new(),
            draft_bytes: 0,
        }
    }

    pub fn accept(&mut self, events: Vec<StreamEvent>) -> Vec<(&'static str, Value)> {
        let mut output = Vec::new();
        for event in events {
            match event {
                StreamEvent::Text(delta) | StreamEvent::Reasoning(delta) if delta.is_empty() => {}
                StreamEvent::Text(delta) => {
                    for part in pieces(&delta) {
                        output.push(("assistant_delta", json!({"messageId":self.run,"itemId":format!("{}:{}:text",self.run,self.round),"delta":part})));
                    }
                }
                StreamEvent::Reasoning(delta) => {
                    for part in pieces(&delta) {
                        output.push(("reasoning_delta", json!({"messageId":self.run,"itemId":format!("{}:{}:reasoning",self.run,self.round),"delta":part})));
                    }
                }
                StreamEvent::Tool {
                    index,
                    id,
                    name,
                    arguments,
                } => {
                    let call = self.calls.entry(index).or_default();
                    if call.display_id.is_empty() {
                        call.display_id = format!("{}:{}:tool:{index}", self.run, self.round);
                    }
                    if call.started && (call.id != id || call.name != name) {
                        output.push(("tool_identity", json!({"messageId":self.run,"previousItemId":call.display_id,"itemId":call.display_id,"callId":id,"name":name})));
                    }
                    call.id = id;
                    call.name = name;
                    call.arguments.push_str(&arguments);
                    if call.id.is_empty() || call.name.is_empty() {
                        continue;
                    }
                    if !call.started {
                        output.push(("tool_start", json!({"messageId":self.run,"itemId":call.display_id,"callId":call.id,"name":call.name})));
                        call.started = true;
                    }
                    if call.sent < call.arguments.len() {
                        for part in pieces(&call.arguments[call.sent..]) {
                            output.push((
                                "tool_arguments_delta",
                                json!({"messageId":self.run,"itemId":call.display_id,"delta":part}),
                            ));
                        }
                        call.sent = call.arguments.len();
                    }
                }
            }
        }
        output.extend(self.drafts(false));
        output
    }

    pub fn finish(&mut self) -> Vec<(&'static str, Value)> {
        let mut output = self.drafts(true);
        for call in self
            .calls
            .values()
            .filter(|call| call.started && !call.id.is_empty())
        {
            output.push(("tool_identity", json!({"messageId":self.run,"previousItemId":call.display_id,"itemId":call.id,"callId":call.id,"name":call.name})));
        }
        output.push((
            "assistant_done",
            json!({"messageId":self.run,"itemId":format!("{}:{}:text",self.run,self.round)}),
        ));
        output
    }

    fn drafts(&mut self, force: bool) -> Vec<(&'static str, Value)> {
        let mut output = Vec::new();
        for call in self.calls.values_mut() {
            if !matches!(
                call.name.as_str(),
                "CreateOutline" | "ReplaceOutline" | "EditOutline"
            ) || call.id.is_empty()
            {
                continue;
            }
            if !force
                && call
                    .last_previewed
                    .is_some_and(|time| time.elapsed() < Duration::from_millis(200))
            {
                continue;
            }
            if !force && self.draft_bytes >= 1024 * 1024 {
                continue;
            }
            // Throttle attempts too: an unfinished line must not repeatedly tokenize
            // the entire accumulated argument while its preview remains unchanged.
            call.last_previewed = Some(Instant::now());
            let Some(markdown) = partial_markdown_argument(&call.arguments) else {
                continue;
            };
            let Some(document) = doe_document::presentation::outline::markdown::preview(&markdown)
            else {
                continue;
            };
            // Emit complete-line changes, at most five per second. Do not duplicate all source
            // text: the ordered tool argument deltas already retain it without truncation.
            let serialized = document.to_string();
            if serialized == call.last_draft || serialized.len() > 512 * 1024 {
                continue;
            }
            call.last_draft = serialized;
            self.draft_bytes += call.last_draft.len();
            output.push((
                "outline_draft",
                json!({"messageId":self.run,"itemId":call.display_id,"document":document}),
            ));
        }
        output
    }
}

fn pieces(mut text: &str) -> Vec<&str> {
    let mut result = Vec::new();
    while !text.is_empty() {
        let mut end = text.len().min(8 * 1024);
        while !text.is_char_boundary(end) {
            end -= 1;
        }
        result.push(&text[..end]);
        text = &text[end..];
    }
    result
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Token {
    LeftBrace,
    RightBrace,
    LeftBracket,
    RightBracket,
    Colon,
    Comma,
    String { value: String, complete: bool },
    Number(i64),
}
pub(crate) fn partial_markdown_argument(input: &str) -> Option<String> {
    input.trim_start().strip_prefix('{')?;
    let tokens = tokenize(input);
    let mut depth = 0usize;
    for (index, token) in tokens.iter().enumerate() {
        match token {
            Token::LeftBrace | Token::LeftBracket => depth += 1,
            Token::RightBrace | Token::RightBracket => depth = depth.saturating_sub(1),
            Token::String {
                value: key,
                complete: true,
            } if depth == 1 && key == "markdown" => {
                if let [Token::Colon, Token::String { value, .. }, ..] = &tokens[index + 1..] {
                    return Some(value.clone());
                }
            }
            _ => {}
        }
    }
    None
}

fn tokenize(input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut chars = input.chars().peekable();
    while let Some(ch) = chars.next() {
        match ch {
            '{' => tokens.push(Token::LeftBrace),
            '}' => tokens.push(Token::RightBrace),
            '[' => tokens.push(Token::LeftBracket),
            ']' => tokens.push(Token::RightBracket),
            ':' => tokens.push(Token::Colon),
            ',' => tokens.push(Token::Comma),
            '"' => tokens.push(read_string(&mut chars)),
            '-' | '0'..='9' => {
                let mut raw = String::from(ch);
                while chars.peek().is_some_and(|next| next.is_ascii_digit()) {
                    raw.push(chars.next().expect("peeked digit"));
                }
                if let Ok(value) = raw.parse::<i64>() {
                    tokens.push(Token::Number(value));
                }
            }
            _ => {}
        }
    }
    tokens
}

fn read_string(chars: &mut std::iter::Peekable<std::str::Chars<'_>>) -> Token {
    let mut value = String::new();
    let mut complete = false;
    while let Some(ch) = chars.next() {
        match ch {
            '"' => {
                complete = true;
                break;
            }
            '\\' => {
                let Some(escaped) = chars.next() else { break };
                match escaped {
                    '"' => value.push('"'),
                    '\\' => value.push('\\'),
                    '/' => value.push('/'),
                    'b' => value.push('\u{0008}'),
                    'f' => value.push('\u{000c}'),
                    'n' => value.push('\n'),
                    'r' => value.push('\r'),
                    't' => value.push('\t'),
                    'u' => {
                        let mut raw = String::new();
                        for _ in 0..4 {
                            let Some(hex) =
                                chars.peek().copied().filter(|ch| ch.is_ascii_hexdigit())
                            else {
                                break;
                            };
                            raw.push(hex);
                            chars.next();
                        }
                        if raw.len() == 4 {
                            if let Ok(mut code) = u32::from_str_radix(&raw, 16) {
                                if (0xd800..=0xdbff).contains(&code) {
                                    let mut lookahead = chars.clone();
                                    if lookahead.next() == Some('\\')
                                        && lookahead.next() == Some('u')
                                    {
                                        let low: String = lookahead.by_ref().take(4).collect();
                                        if let Ok(low) = u32::from_str_radix(&low, 16) {
                                            if (0xdc00..=0xdfff).contains(&low) {
                                                code = 0x10000 + ((code - 0xd800) << 10) + low
                                                    - 0xdc00;
                                                *chars = lookahead;
                                            }
                                        }
                                    }
                                }
                                if let Some(decoded) = char::from_u32(code) {
                                    value.push(decoded);
                                }
                            }
                        }
                    }
                    _ => value.push(escaped),
                }
            }
            other => value.push(other),
        }
    }
    Token::String { value, complete }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn original_partial_decoder_handles_nested_keys_and_surrogate_pairs() {
        assert_eq!(
            partial_markdown_argument(
                r#"{"nested":{"markdown":"wrong"},"markdown":"\ud83d\ude00\npartial"#
            )
            .as_deref(),
            Some("😀\npartial")
        );
        assert!(partial_markdown_argument(r#"{"nested":{"markdown":"wrong"}}"#).is_none());
    }

    #[test]
    fn streamed_outline_is_display_only_and_lossless_tool_fragments_are_ordered() {
        let mut projection = Projection::new("run", 0);
        let raw = json!({"markdown":"title=Live\n# page\n## text\nOne\n# page\n## text\nTwo\n"})
            .to_string();
        let mut output = projection.accept(vec![StreamEvent::Text("正在整理".into())]);
        for part in raw.chars() {
            output.extend(projection.accept(vec![StreamEvent::Tool {
                index: 0,
                id: "call".into(),
                name: "CreateOutline".into(),
                arguments: part.to_string(),
            }]));
        }
        output.extend(projection.finish());
        assert_eq!(
            output
                .iter()
                .filter(|(kind, _)| *kind == "tool_start")
                .count(),
            1
        );
        let reconstructed = output
            .iter()
            .filter(|(kind, _)| *kind == "tool_arguments_delta")
            .map(|(_, value)| value["delta"].as_str().unwrap())
            .collect::<String>();
        assert_eq!(reconstructed, raw);
        let draft = &output
            .iter()
            .rev()
            .find(|(kind, _)| *kind == "outline_draft")
            .unwrap()
            .1["document"];
        assert_eq!(draft["body"].as_array().unwrap().len(), 2);
        assert!(!output.iter().any(|(kind, _)| *kind == "tool_result"));
        assert_eq!(pieces(&"中".repeat(10000)).concat(), "中".repeat(10000));
    }
}
