// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::object_comma_belongs_to_parent
use super::*;


pub(super) fn object_comma_belongs_to_parent(tokens: &[Token], index: usize, frames: &[Frame]) -> bool {
    if frames.len() < 2 {
        return false;
    }
    let parent = frames[frames.len() - 2];
    if !matches!(parent.kind, FrameKind::Array(ArrayState::CommaOrEnd)) {
        return false;
    }
    let Some(next) = tokens.get(index + 1) else {
        return false;
    };
    next.kind != TokenKind::String && next.kind.starts_value()
}
