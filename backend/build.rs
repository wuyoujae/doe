use sha2::{Digest, Sha256};
use std::{env, fs, path::PathBuf};

fn main() {
    let root = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").expect("manifest directory"))
        .join("resources/doe");
    let manifest = root.join("manifest.json");
    println!("cargo:rerun-if-changed={}", manifest.display());
    let mut bundle: serde_json::Value =
        serde_json::from_slice(&fs::read(&manifest).expect("DOE manifest"))
            .expect("DOE manifest JSON");
    for entry in bundle["entries"].as_array_mut().expect("DOE entries") {
        let path = root.join(entry["path"].as_str().expect("DOE resource path"));
        let resolved = fs::canonicalize(&path).expect("DOE resource exists");
        assert!(resolved.starts_with(fs::canonicalize(&root).expect("DOE resource root")));
        println!("cargo:rerun-if-changed={}", path.display());
        let content = fs::read_to_string(&path).expect("UTF-8 DOE resource");
        assert_eq!(Some(content.len() as u64), entry["bytes"].as_u64());
        assert_eq!(
            format!("{:x}", Sha256::digest(content.as_bytes())),
            entry["contentSha256"]
                .as_str()
                .expect("DOE content checksum")
        );
        entry["content"] = content.into();
    }
    let out = PathBuf::from(env::var_os("OUT_DIR").expect("build output"));
    fs::write(
        out.join("doe-resources.json"),
        serde_json::to_vec(&bundle).expect("DOE bundle JSON"),
    )
    .expect("write DOE bundle");
}
