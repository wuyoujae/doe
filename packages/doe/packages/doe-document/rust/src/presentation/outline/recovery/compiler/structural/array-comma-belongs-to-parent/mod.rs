// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::array_comma_belongs_to_parent
use super::*;


pub(super) fn array_comma_belongs_to_parent(tokens: &[Token], index: usize, frames: &[Frame]) -> bool {
    if frames.len() < 2 {
        return false;
    }
    let parent = frames[frames.len() - 2];
    if !matches!(parent.kind, FrameKind::Object(ObjectState::CommaOrEnd)) {
        return false;
    }
    matches!(
        (tokens.get(index + 1), tokens.get(index + 2)),
        (
            Some(Token {
                kind: TokenKind::String,
                ..
            }),
            Some(Token {
                kind: TokenKind::Colon,
                ..
            })
        )
    )
}
