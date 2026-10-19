// Origin: app/backend/core/src/outline_recovery/diagnostics.rs::sha256_hex
use super::*;


pub fn sha256_hex(input: &[u8]) -> String {
    let digest = Sha256::digest(input);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}
