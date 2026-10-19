//! External DOE authoring boundary. No repair, normalization or model invocation.
use doe_core::diagnostic::compatibility as check;
use crate::presentation::schema::contract;

use check::Failure;

use serde_json::{json, Value};

use std::sync::LazyLock;


pub const MAX_REQUEST_BYTES: usize = 8 * 1024 * 1024;

pub const MAX_SLIDE_BYTES: usize = 2_000_000;

pub const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;
#[path = "positive/mod.rs"]
mod function_positive;
pub use function_positive::positive;

#[path = "envelope/mod.rs"]
mod function_envelope;
pub use function_envelope::envelope;

#[path = "diagnostic/mod.rs"]
mod function_diagnostic;
pub use function_diagnostic::diagnostic;

#[path = "deck/mod.rs"]
mod function_deck;
pub use function_deck::deck;



static MARKUP: LazyLock<regex::Regex> =
    LazyLock::new(|| regex::Regex::new(r"(?i)<(?:/?[a-z][a-z0-9:-]*(?:\s|/|>|$)|!|\?)").unwrap());

static ACTIVE: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r"(?i)(?:javascript|vbscript|file|data)\s*:|url\s*\(|expression\s*\(")
        .unwrap()
});
#[path = "edit-safety/mod.rs"]
mod function_edit_safety;
pub use function_edit_safety::edit_safety;

#[path = "safety/mod.rs"]
mod function_safety;
 use function_safety::safety;

#[path = "safe-svg/mod.rs"]
mod function_safe_svg;
 use function_safe_svg::safe_svg;

#[path = "assets/mod.rs"]
mod function_assets;
pub use function_assets::assets;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;

