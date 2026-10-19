// Origin: app/backend/core/src/plugin_slide_validation.rs::assets
use super::*;


pub fn assets(value: &Value, manifest: &[Value]) -> Result<(), Failure> {
    let sources: Vec<String> = manifest
        .iter()
        .filter_map(|a| a["slideReference"].as_str().map(str::to_owned))
        .collect();
    contract::validate_agent_image_sources_strict(value, &sources)
        .map_err(|_| Failure::from("asset_unavailable"))?;
    let specs = manifest
        .iter()
        .map(
            |a| doe_core::asset::generated::OutlineGeneratedImageAsset {
                slide_reference: a["slideReference"].as_str().unwrap_or("").to_owned(),
                image_type: if a["imageType"] == "content" {
                    doe_core::asset::generated::GeneratedImageType::Content
                } else {
                    doe_core::asset::generated::GeneratedImageType::Decorative
                },
                ratio: a["ratio"].as_str().unwrap_or("").to_owned(),
            },
        )
        .collect::<Vec<_>>();
    if let Err(e) = contract::validate_generated_image_asset_placements(
        value["deck"]["slides"].as_array().unwrap(),
        &specs,
    ) {
        let mut failure = Failure::from("validation_failed");
        failure.issue("/deck/deck/slides","image_placement",e.split_once(": ").map(|(_,s)|s).unwrap_or("Image placement is invalid."),"Use content images in content slots; decorative edge images must match the edge direction and aspect ratio.");
        return Err(failure);
    }
    Ok(())
}
