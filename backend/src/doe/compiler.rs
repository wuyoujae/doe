//! Pure authoring compilation; this does not save a document or call a model.
use doe_document::presentation::{outline::markdown as outline, schema::markdown as slide};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

pub const MAX_MARKDOWN_BYTES: usize = 2 * 1024 * 1024;

#[derive(Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    Outline,
    Slide,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CompileRequest {
    pub kind: Kind,
    pub markdown: String,
}

#[derive(Serialize)]
pub struct Compilation {
    pub kind: Kind,
    pub valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub markdown: Option<String>,
    pub diagnostics: Vec<Value>,
}

pub fn compile(request: CompileRequest) -> Compilation {
    let failed = |message: String, mut diagnostics: Vec<Value>| {
        diagnostics.push(json!({"level":"error","code":"compilation_failed","message":message}));
        Compilation {
            kind: request.kind,
            valid: false,
            document: None,
            markdown: None,
            diagnostics,
        }
    };
    if request.markdown.trim().is_empty()
        || request.markdown.contains('\0')
        || request.markdown.len() > MAX_MARKDOWN_BYTES
    {
        return failed(
            "Authoring Markdown must be nonempty text no larger than 2 MiB".into(),
            vec![],
        );
    }
    let compiled = match request.kind {
        Kind::Outline => outline::compile(&request.markdown).map(|result| {
            let diagnostics = result.diagnostics.into_iter().map(|diagnostic|json!({"line":diagnostic.line,"path":diagnostic.path,"code":diagnostic.code,"level":"warning"})).collect::<Vec<_>>();
            (outline::serialize(&result.outline),result.outline,diagnostics)
        }).map_err(|message|(message,vec![])),
        Kind::Slide => slide::compile_detailed(&request.markdown,&[]).map(|result| {
            let diagnostics = result.diagnostics.into_iter().map(|diagnostic|json!({"line":diagnostic.line,"path":diagnostic.path,"code":diagnostic.code,"level":diagnostic.level})).collect::<Vec<_>>();
            (slide::serialize(&result.value),result.value,diagnostics)
        }).map_err(|failure|(failure.message,failure.diagnostics.into_iter().map(|diagnostic|json!({"line":diagnostic.line,"path":diagnostic.path,"code":diagnostic.code,"level":diagnostic.level})).collect())),
    };
    match compiled {
        Ok((Ok(markdown), document, diagnostics)) => Compilation {
            kind: request.kind,
            valid: true,
            document: Some(document),
            markdown: Some(markdown),
            diagnostics,
        },
        Ok((Err(message), _, diagnostics)) | Err((message, diagnostics)) => {
            failed(message, diagnostics)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compiles_real_outline_and_slide_and_rejects_invalid_authoring() {
        for (kind, source) in [
            (Kind::Outline, "# page\n## text\nTitle\n## text\nBody"),
            (Kind::Slide, "# slide\n## paragraph\nHello DOE"),
        ] {
            let result = compile(CompileRequest {
                kind,
                markdown: source.into(),
            });
            assert!(result.valid, "{:?}", result.diagnostics);
            let again = compile(CompileRequest {
                kind,
                markdown: result.markdown.expect("canonical Markdown"),
            });
            assert!(again.valid);
            assert_eq!(again.document, result.document);
        }
        let invalid = compile(CompileRequest {
            kind: Kind::Slide,
            markdown: "Not a slide".into(),
        });
        assert!(!invalid.valid);
        assert!(invalid.document.is_none());
        assert!(!invalid.diagnostics.is_empty());
    }
}
