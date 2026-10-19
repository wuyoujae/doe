// Origin: app/backend/core/src/outline_assets.rs::asset_id


pub fn asset_id(reference: &str) -> Option<&str> {
    reference.strip_prefix("yrkie-asset-data://").filter(|s| {
        s.len() == 64
            && s.bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    })
}
