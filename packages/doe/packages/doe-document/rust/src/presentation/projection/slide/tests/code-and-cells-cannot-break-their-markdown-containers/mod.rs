// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::code_and_cells_cannot_break_their_markdown_containers
use super::*;


#[test]
pub(super) fn code_and_cells_cannot_break_their_markdown_containers() {
    let out = output(vec![
        node(
            "code-block",
            json!({"code":"if (a < 3) {\n  ```\n  print(42);\n}","language":"html\nattack"}),
        ),
        node(
            "math-formula",
            json!({"content":{"formula":"\\frac{a}{b}"}}),
        ),
        node(
            "table",
            json!({"content":{"columns":[{"header":"A|B"}],"rows":[{"cells":["line\nnext|cell <img>"]}]}}),
        ),
    ]);
    assert!(out.contains("````text\nif (a < 3) {\n  ```\n  print(42);\n}\n````"));
    assert!(out.contains("\\frac{a}{b}"));
    assert!(out.contains("line<br>next\\|cell &lt;img&gt;"));
    assert!(!out.contains("attack"));
}
