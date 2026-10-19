// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_generated_image_asset_placements
use super::*;


pub fn validate_generated_image_asset_placements(
    slides: &[Value],
    assets: &[doe_core::asset::generated::OutlineGeneratedImageAsset],
) -> Result<(), String> {
    #[derive(Clone, Copy)]
    struct AssetSpec<'a> {
        image_type: doe_core::asset::generated::GeneratedImageType,
        ratio: &'a str,
    }

    fn collect_src_references<'a>(value: &'a Value, references: &mut Vec<&'a str>) {
        match value {
            Value::Array(items) => {
                for item in items {
                    collect_src_references(item, references);
                }
            }
            Value::Object(object) => {
                if let Some(source) = object.get("src").and_then(Value::as_str) {
                    references.push(source);
                }
                for item in object.values() {
                    collect_src_references(item, references);
                }
            }
            _ => {}
        }
    }

    fn mismatch(detail: &str) -> String {
        format!("{GENERATED_IMAGE_PLACEMENT_MISMATCH_ERROR}: {detail}")
    }

    fn validate_edge_media_references(
        media: &Value,
        position: &str,
        manifest: &HashMap<&str, AssetSpec<'_>>,
    ) -> Result<(), String> {
        let horizontal = matches!(position, "left" | "right");
        let mut references = Vec::new();
        collect_src_references(media, &mut references);
        for source in references {
            let Some(spec) = manifest.get(source) else {
                continue;
            };
            if spec.image_type == doe_core::asset::generated::GeneratedImageType::Content {
                return Err(mismatch(
                    "a transparent content image cannot be used as edge media",
                ));
            }
            let portrait = matches!(spec.ratio, "3:4" | "4:5" | "9:16");
            let landscape = matches!(spec.ratio, "4:3" | "16:9");
            if (horizontal && !portrait) || (!horizontal && !landscape) {
                return Err(mismatch(
                    "generated decorative image ratio does not match the edge-media axis",
                ));
            }
        }
        Ok(())
    }

    fn validate_edge_group(
        node: &Value,
        manifest: &HashMap<&str, AssetSpec<'_>>,
    ) -> Result<(), String> {
        let Some(object) = node.as_object() else {
            return Ok(());
        };
        let is_edge_media = object.get("type").and_then(Value::as_str) == Some("layout-group")
            && object
                .get("layout")
                .and_then(Value::as_object)
                .and_then(|layout| layout.get("variant"))
                .and_then(Value::as_str)
                == Some("edge-media");
        if is_edge_media {
            let position = object
                .get("layout")
                .and_then(Value::as_object)
                .and_then(|layout| layout.get("mediaPosition"))
                .and_then(Value::as_str)
                .unwrap_or("right");
            let children = object
                .get("children")
                .and_then(Value::as_array)
                .map(Vec::as_slice)
                .unwrap_or(&[]);
            for child in children.iter().filter(|child| {
                child
                    .get("layout")
                    .and_then(Value::as_object)
                    .and_then(|layout| layout.get("region"))
                    .and_then(Value::as_str)
                    == Some("media")
            }) {
                validate_edge_media_references(child, position, manifest)?;
            }
        }
        if let Some(children) = object.get("children").and_then(Value::as_array) {
            for child in children {
                validate_edge_group(child, manifest)?;
            }
        }
        Ok(())
    }

    fn validate_implicit_root_edge_media(
        slide: &Value,
        manifest: &HashMap<&str, AssetSpec<'_>>,
    ) -> Result<(), String> {
        let uses_bleed_preset = slide
            .get("layout")
            .and_then(Value::as_object)
            .and_then(|layout| layout.get("preset"))
            .and_then(Value::as_str)
            .is_some_and(|preset| matches!(preset, "edge-media" | "split-right-bleed"));
        if !uses_bleed_preset {
            return Ok(());
        }

        let Some(blocks) = slide.get("blocks").and_then(Value::as_array) else {
            return Ok(());
        };
        // Keep this contract aligned with inferRootEdgeMediaGroup in the browser runtime:
        // only a two-block, root-level content/media pair can become an implicit edge split.
        if blocks.len() != 2 {
            return Ok(());
        }
        fn layout_region(block: &Value) -> Option<&str> {
            block
                .get("layout")
                .and_then(Value::as_object)
                .and_then(|layout| layout.get("region"))
                .and_then(Value::as_str)
        }
        let media_indices = blocks
            .iter()
            .enumerate()
            .filter_map(|(index, block)| (layout_region(block) == Some("media")).then_some(index))
            .collect::<Vec<_>>();
        let content_indices = blocks
            .iter()
            .enumerate()
            .filter_map(|(index, block)| (layout_region(block) == Some("content")).then_some(index))
            .collect::<Vec<_>>();
        if media_indices.len() != 1 || content_indices.len() != 1 {
            return Ok(());
        }

        let media_index = media_indices[0];
        let media = &blocks[media_index];
        // `media` is currently the only registered Schema v4 component that supports bleed.
        // A group or an ordinary component is not upgraded by the browser and must not be
        // interpreted as edge media here either.
        if media.get("type").and_then(Value::as_str) != Some("media") {
            return Ok(());
        }

        // Root inference places media left when it precedes content and right otherwise.
        // Both positions use the vertical edge-media axis and therefore require a portrait asset.
        let media_position = if media_index < content_indices[0] {
            "left"
        } else {
            "right"
        };
        validate_edge_media_references(media, media_position, manifest)
    }

    let manifest = assets
        .iter()
        .map(|asset| {
            (
                asset.slide_reference.as_str(),
                AssetSpec {
                    image_type: asset.image_type,
                    ratio: asset.ratio.as_str(),
                },
            )
        })
        .collect::<HashMap<_, _>>();
    for slide in slides {
        if let Some(background) = slide.get("background") {
            let mut references = Vec::new();
            collect_src_references(background, &mut references);
            for source in references {
                let Some(spec) = manifest.get(source) else {
                    continue;
                };
                if spec.image_type == doe_core::asset::generated::GeneratedImageType::Content {
                    return Err(mismatch(
                        "a transparent content image cannot be used as a Slide background",
                    ));
                }
                if !matches!(spec.ratio, "4:3" | "16:9") {
                    return Err(mismatch(
                        "a generated Slide background must use a landscape ratio",
                    ));
                }
            }
        }
        if let Some(blocks) = slide.get("blocks").and_then(Value::as_array) {
            for block in blocks {
                validate_edge_group(block, &manifest)?;
            }
        }
        validate_implicit_root_edge_media(slide, &manifest)?;
    }
    Ok(())
}
