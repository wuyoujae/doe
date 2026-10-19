// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::consume_nested_value
use super::*;


pub(super) fn consume_nested_value(token: &Token, frames: &mut Vec<Frame>) -> Result<(), String> {
    let parent = frames
        .last_mut()
        .ok_or_else(|| "nested JSON value has no parent".to_string())?;
    parent.kind = match parent.kind {
        FrameKind::Object(ObjectState::Value) => FrameKind::Object(ObjectState::CommaOrEnd),
        FrameKind::Array(ArrayState::ValueOrEnd) => FrameKind::Array(ArrayState::CommaOrEnd),
        _ => return Err("JSON parser state rejected a nested value".to_string()),
    };
    match token.kind {
        TokenKind::ObjectStart => frames.push(Frame {
            kind: FrameKind::Object(ObjectState::KeyOrEnd),
            start: token.start,
        }),
        TokenKind::ArrayStart => frames.push(Frame {
            kind: FrameKind::Array(ArrayState::ValueOrEnd),
            start: token.start,
        }),
        TokenKind::String | TokenKind::Atom => {}
        _ => return Err(format!("JSON value expected near byte {}", token.start)),
    }
    Ok(())
}
