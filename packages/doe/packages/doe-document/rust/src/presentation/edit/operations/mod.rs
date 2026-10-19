use serde::{Deserialize, Serialize};

use serde_json::Value;


#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "op", rename_all = "snake_case", deny_unknown_fields)]
pub enum Operation {
    Set {
        node_id: String,
        path: String,
        value: Value,
    },
    RemoveField {
        node_id: String,
        path: String,
    },
    ReplaceNode {
        node_id: String,
        node: Value,
    },
    RemoveNode {
        node_id: String,
    },
    InsertNode {
        parent_id: Option<String>,
        before_id: Option<String>,
        node: Value,
    },
}


#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Edit {
    #[serde(default)]
    pub operations: Vec<Operation>,
    pub slide: Option<Value>,
}
#[path = "nodes/mod.rs"]
mod function_nodes;
 use function_nodes::nodes;

#[path = "find/mod.rs"]
mod function_find;
 use function_find::find;

#[path = "remove/mod.rs"]
mod function_remove;
 use function_remove::remove;

#[path = "set-field/mod.rs"]
mod function_set_field;
 use function_set_field::set_field;

#[path = "apply/mod.rs"]
mod function_apply;
pub use function_apply::apply;

