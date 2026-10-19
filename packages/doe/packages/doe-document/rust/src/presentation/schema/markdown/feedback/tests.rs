use super::*;

#[test]
fn wrong_separator_returns_the_actual_line_and_correction() {
    let raw = "# slide\n## cards\nitems=<\n[title=\"标题\",text=\"正文\"]\n>";
    let error = compile(raw, &[]).err().unwrap();
    let result = creation_failure(raw, 1, &[], &error);
    assert_eq!(result["committed"], false);
    let issue = result["issues"].as_array().unwrap().iter().find(|i| i["syntax"].is_object()).unwrap();
    assert_eq!(issue["syntax"]["line"], 4);
    assert!(issue["syntax"]["message"].as_str().unwrap().contains("Expected ';'"));
    assert_eq!(issue["expected"]["type"], "array");
    assert!(issue["path"].as_str().unwrap().ends_with("/items"));
    assert!(compile(&raw.replace("\",text", "\";text"), &[]).is_ok());
}

#[test]
fn page_count_and_image_errors_are_reported_together() {
    let allowed = vec![format!("yrkie-asset-data://{}", "a".repeat(64))];
    let raw = "# slide\n## title\n第一页\n## image\nsrc=yrkie-asset-data://wrong\n# slide\n## title\n第二页";
    let result = creation_failure(raw, 1, &allowed, "slide_agent_asset_reference_mismatch");
    let issues = result["issues"].as_array().unwrap();
    let count = issues.iter().find(|i|i["code"]=="slide_count_mismatch").unwrap();
    assert_eq!(count["expected"], 1);
    assert_eq!(count["actual"], 2);
    assert_eq!(result["pages"][1]["title"], "第二页");
    let image = issues.iter().find(|i|i["code"]=="asset_reference_mismatch").unwrap();
    assert_eq!(image["path"], "/deck/slides/0/blocks/1/props/src");
    assert_eq!(image["actual"], "yrkie-asset-data://wrong");
    assert_eq!(result["authorizedSources"], json!(allowed));
}

#[test]
fn literal_slide_markers_do_not_count_as_pages() {
    let raw = "# slide\n## paragraph\ntext=\"第一行\\n# slide\\n第三行\"";
    let result = creation_failure(raw, 1, &[], "another_validation_error");
    assert_eq!(result["pages"].as_array().unwrap().len(), 1);
    assert!(!result["issues"].as_array().unwrap().iter().any(|i|i["code"]=="slide_count_mismatch"));
}

#[test]
fn missing_fields_and_counts_keep_contract_constraints() {
    let raw = "# slide\n## cards\nitems=<[title=\"标题\"]>";
    let result = creation_failure(raw, 1, &[], &compile(raw, &[]).err().unwrap());
    let issue = result["issues"].as_array().unwrap().iter().find(|i| i["path"].as_str().unwrap().ends_with("/text")).unwrap();
    assert_eq!(issue["code"], "missing_content");
    assert_eq!(issue["expected"]["type"], "string");
    assert!(issue["actual"].is_null());
}

#[test]
fn authorized_images_and_builtin_logo_are_not_accused() {
    let source = format!("yrkie-asset-data://{}", "a".repeat(64));
    let raw = format!("logo=/yrkie-doe/brand/logo-text.webp\n# slide\n## image\nsrc={source}");
    let result = creation_failure(&raw, 2, &[source], "slide_count_mismatch");
    assert!(!result["issues"].as_array().unwrap().iter().any(|i| i["code"]=="asset_reference_mismatch"));
}

#[test]
fn feedback_is_bounded_and_marks_omitted_issues() {
    let raw = format!("# slide\n{}", "## cards\nitems=<[title=\"标题\",text=\"正文\"]>\n".repeat(100));
    let result = creation_failure(&raw, 1, &[], &compile(&raw, &[]).err().unwrap());
    assert!(result.to_string().len() <= MAX_BYTES);
    assert_eq!(result["issuesTruncated"], true);
    assert!(result["issueCount"].as_u64().unwrap() >= 100);
    assert!(result["issues"].as_array().unwrap().len() <= MAX_ISSUES);
}

#[test]
fn oversized_input_is_not_compiled_again() {
    let raw = "x".repeat(deck_contract::MAX_OUTPUT_BYTES + 1);
    let result = creation_failure(&raw, 8, &[], "output_too_large");
    assert_eq!(result["issues"][0]["code"], "output_too_large");
    assert_eq!(result["issues"][0]["actualBytes"], raw.len());
}

#[test]
fn malformed_json_has_parser_location() {
    let result = creation_failure("{\n  \"deck\": ]", 8, &[], "invalid_json");
    assert_eq!(result["issues"][0]["line"], 2);
    assert!(result["issues"][0]["column"].as_u64().unwrap() > 0);
}
