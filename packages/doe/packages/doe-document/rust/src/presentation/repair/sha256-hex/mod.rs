// Origin: app/backend/core/src/slide_auto_repair_v2/mod.rs::sha256_hex
use super::*;


pub(super) fn sha256_hex(input: &[u8]) -> String {
    format!("{:x}", Sha256::digest(input))
}
