// Origin: app/backend/core/src/slide_recovery/mod.rs::sha256_hex
use super::*;


pub(super) fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}
