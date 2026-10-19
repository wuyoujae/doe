// Origin: app/backend/core/src/slide_agent_output_contract.rs::is_lower_hex_byte


pub(super) fn is_lower_hex_byte(byte: u8) -> bool {
    byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte)
}
