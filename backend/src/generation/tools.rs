use super::imagery;
use crate::projects::{Question, RunStage};
use serde::Deserialize;
use serde_json::{Value, json};

fn tool(name: &str, description: &str, properties: Value, required: &[&str]) -> Value {
    json!({"type":"function","function":{"name":name,"description":description,"parameters":{"type":"object","additionalProperties":false,"properties":properties,"required":required}}})
}

pub fn definitions(stage: RunStage) -> Vec<Value> {
    let mut tools = vec![
        tool(
            "ReadDoeSkill",
            "Read the complete enabled design Skill from the configuration frozen for this run. Use its exact catalog id.",
            json!({"skill":{"type":"string"}}),
            &["skill"],
        ),
        tool(
            "ReadOutline",
            "Read the current authoritative Outline, revision, confirmation, visual plan, generated assets and Deck revision. Do not invent ids or references.",
            json!({}),
            &[],
        ),
    ];
    if matches!(stage, RunStage::Outline | RunStage::Edit) {
        tools.push(tool("AskQuestions", "Ask 1–4 unresolved preferences or factual questions in the user's language, then stop for actual answers. Call this tool ALONE. Users can always enter their own answer. Plain text options may include a short explanation and one recommended choice. Never treat these answers as outline confirmation.", json!({"questions":{"type":"array","minItems":1,"maxItems":4,"items":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","maxLength":40},"question":{"type":"string","maxLength":500},"options":{"type":"array","maxItems":4,"items":{"type":"string","maxLength":450}}},"required":["id","question"]}}}), &["questions"]));
    }
    if stage == RunStage::Outline {
        for name in ["CreateOutline", "ReplaceOutline", "EditOutline"] {
            let mut properties = json!({"markdown":{"type":"string","maxLength":2097152},"visual_plan":imagery::schema()});
            let required = if name == "CreateOutline" {
                vec!["markdown"]
            } else {
                properties["outline_id"] = json!({"type":"string"});
                properties["expected_revision"] = json!({"type":"integer","minimum":1});
                vec!["markdown", "outline_id", "expected_revision"]
            };
            tools.push(tool(name, "Save complete Outline V2.1 Markdown for user review. First text unit is the short headline. Supply a separate visual_plan for every page. This tool MUST be called alone and ends this run; only the user can confirm and start slides.", properties, &required));
        }
    } else {
        if stage == RunStage::Slides {
            tools.push(tool("ConfirmOutline", "Read-only idempotent receipt for the user's existing approval. The host has already confirmed the current Outline; this cannot grant approval or change it.", json!({"outline_id":{"type":"string"},"expected_revision":{"type":"integer","minimum":1}}), &["outline_id", "expected_revision"]));
        }
        tools.push(tool("GenerateImage", "Generate one needed image with the configured image model. Returns a real project-authorized reference. Do not repeat identical requests; planned Outline images are already materialized before this stage. Aspect ratio is a generation instruction; the provider may return the closest supported size. Transparent background requests require provider support.", json!({"prompt":{"type":"string","maxLength":16000},"ratio":{"type":"string","enum":["1:1","4:3","3:4","4:5","16:9","9:16"]},"removeBackground":{"type":"boolean"}}), &["prompt"]));
        if stage == RunStage::Slides {
            tools.push(tool("CreateDeck", "Save all confirmed Outline pages as complete V2.1 Slide Markdown. Select theme=<registered id> before the first # slide, use only real authorized image refs and fulfill visual_plan on every page. Pass exact current revisions from ReadOutline. Call alone; success completes generation. Invalid candidates are never saved and return actionable compilation diagnostics.", json!({"markdown":{"type":"string","maxLength":2097152},"outline_id":{"type":"string"},"outline_revision":{"type":"integer","minimum":1},"deck_revision":{"type":["integer","null"],"minimum":1}}), &["markdown","outline_id","outline_revision","deck_revision"]));
        } else {
            tools.push(tool("ReadSlide", "Read the actual saved page as editable V2.1 Markdown. Use its stable slideId and revision for EditSlide. At most eight reads per run; reuse receipts while the deck revision remains unchanged. This is source, not a rendered preview.", json!({"page_number":{"type":"integer","minimum":1},"slide_id":{"type":"string"}}), &[]));
            tools.push(tool("EditSlide", "Apply a scoped edit to one previously read saved page using complete one-page V2.1 Markdown. Preserve untouched content, components, images and styling. Use exact slide_id and expected_revision from ReadSlide. Call alone. Success commits immediately; never repeat a committed edit.", json!({"slide_id":{"type":"string"},"expected_revision":{"type":"integer","minimum":1},"markdown":{"type":"string","maxLength":2097152}}), &["slide_id","expected_revision","markdown"]));
            tools.push(tool("SetDeckTheme", "Change the saved deck theme only when the user requested a style change. Preserve all pages. Use the current deck revision from ReadOutline. Call alone.", json!({"theme":{"type":"string","enum":doe_document::presentation::schema::contract::registered_theme_ids()},"expected_revision":{"type":"integer","minimum":1}}), &["theme","expected_revision"]));
        }
    }
    tools
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OutlineInput {
    pub markdown: String,
    pub outline_id: Option<String>,
    pub expected_revision: Option<u64>,
    pub visual_plan: Option<imagery::VisualPlan>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DeckInput {
    pub markdown: String,
    pub outline_id: String,
    pub outline_revision: u64,
    pub deck_revision: Option<u64>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ImageInput {
    pub prompt: String,
    pub ratio: Option<String>,
    #[serde(default, rename = "removeBackground")]
    pub remove_background: bool,
}

pub fn questions(value: Value) -> Result<Vec<Question>, String> {
    #[derive(Deserialize)]
    #[serde(deny_unknown_fields)]
    struct Input {
        questions: Vec<Question>,
    }
    let mut input: Input = serde_json::from_value(value)
        .map_err(|_| "Invalid question fields; use id, question and optional plain-text options")?;
    for item in &mut input.questions {
        item.id = item.id.trim().into();
        item.question = item.question.trim().into();
        for option in &mut item.options {
            *option = option.trim().into();
        }
    }
    crate::projects::validate_questions(&input.questions).map_err(|error| error.to_string())?;
    Ok(input.questions)
}

pub fn is_barrier(name: &str) -> bool {
    matches!(
        name,
        "AskQuestions"
            | "CreateOutline"
            | "ReplaceOutline"
            | "EditOutline"
            | "CreateDeck"
            | "EditSlide"
            | "SetDeckTheme"
    )
}
