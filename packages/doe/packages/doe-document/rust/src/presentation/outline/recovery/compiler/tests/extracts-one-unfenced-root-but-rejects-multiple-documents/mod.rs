// Origin: app/backend/core/src/outline_recovery/compiler/tests.rs::extracts_one_unfenced_root_but_rejects_multiple_documents
use super::*;


#[test]
pub(super) fn extracts_one_unfenced_root_but_rejects_multiple_documents() {
    let compiled = compile_json("result: {\"a\":\"业务文本\"} done", |_| Some(0))
        .expect("compile unique inline document");
    assert_eq!(compiled.value["a"], "业务文本");
    assert!(compile_json("{\"a\":1}\n{\"b\":2}", |_| Some(0)).is_err());
    assert!(compile_json(
        "```json\n{\"a\":1}\n```\n```json\n{\"b\":2}\n```",
        |_| Some(0)
    )
    .is_err());
}
