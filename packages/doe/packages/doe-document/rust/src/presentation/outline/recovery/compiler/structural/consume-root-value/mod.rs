// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::consume_root_value
use super::*;


pub(super) fn consume_root_value(
    token: &Token,
    frames: &mut Vec<Frame>,
    root_complete: &mut bool,
) -> Result<(), String> {
    match token.kind {
        TokenKind::ObjectStart => frames.push(Frame {
            kind: FrameKind::Object(ObjectState::KeyOrEnd),
            start: token.start,
        }),
        TokenKind::ArrayStart => frames.push(Frame {
            kind: FrameKind::Array(ArrayState::ValueOrEnd),
            start: token.start,
        }),
        TokenKind::String | TokenKind::Atom => *root_complete = true,
        _ => return Err(format!("JSON value expected near byte {}", token.start)),
    }
    Ok(())
}
