// Origin: app/backend/core/src/outline_recovery/compiler/structural.rs::closes_ancestor
use super::*;


pub(super) fn closes_ancestor(kind: TokenKind, ancestors: &[Frame]) -> bool {
    ancestors.iter().rev().any(|frame| {
        matches!(
            (frame.kind, kind),
            (FrameKind::Object(_), TokenKind::ObjectEnd)
                | (FrameKind::Array(_), TokenKind::ArrayEnd)
        )
    })
}
