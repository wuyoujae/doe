pub use super::super::limits::{OUTLINE_CONTRACT_VERSION, MAX_OUTLINE_RESPONSE_BYTES, MAX_OUTLINE_CONTENT_LEN, MAX_OUTLINE_CONTENT_ITEMS, MAX_OUTLINE_SLIDES};
use serde::{Deserialize, Serialize};

use serde_json::{json, Value};


mod validator;

pub const MAX_OUTLINE_DOCUMENT_BYTES: usize = 1_048_576;

pub const MAX_OUTLINE_VALUE_DEPTH: usize = 16;


#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ContractValueKind {
    Object,
    Array,
    String,
    Integer,
    Number,
    Boolean,
    Null,
    Any,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FieldClass {
    Structural,
    BusinessString,
    Reference,
    Derivable,
    Forbidden,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ContractConstraint {
    pub id: &'static str,
    pub path: &'static str,
    pub rule: &'static str,
    pub safe_recovery: &'static str,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ContractField {
    pub path: &'static str,
    pub value_kind: ContractValueKind,
    pub class: FieldClass,
    pub required: bool,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ComponentContract {
    pub discriminator: &'static str,
    pub required_fields: &'static [&'static str],
    pub optional_fields: &'static [&'static str],
}


#[derive(Debug, Clone)]
pub struct OutlineContractGraph {
    version: &'static str,
    constraints: &'static [ContractConstraint],
    fields: &'static [ContractField],
    components: &'static [ComponentContract],
}


const FIELDS: &[ContractField] = &[
    ContractField {
        path: "/operation",
        value_kind: ContractValueKind::String,
        class: FieldClass::Structural,
        required: true,
    },
    ContractField {
        path: "/expected_revision",
        value_kind: ContractValueKind::Integer,
        class: FieldClass::Structural,
        required: true,
    },
    ContractField {
        path: "/outline",
        value_kind: ContractValueKind::Object,
        class: FieldClass::Structural,
        required: true,
    },
    ContractField {
        path: "/outline/slides",
        value_kind: ContractValueKind::Array,
        class: FieldClass::Structural,
        required: true,
    },
    ContractField {
        path: "/outline/slides/*/page_number",
        value_kind: ContractValueKind::Integer,
        class: FieldClass::Derivable,
        required: true,
    },
    ContractField {
        path: "/outline/slides/*/contents",
        value_kind: ContractValueKind::Object,
        class: FieldClass::Structural,
        required: true,
    },
    ContractField {
        path: "/outline/slides/*/contents/*/body",
        value_kind: ContractValueKind::Any,
        class: FieldClass::BusinessString,
        required: true,
    },
    ContractField {
        path: "/outline/slides/*/contents/*/describe",
        value_kind: ContractValueKind::String,
        class: FieldClass::BusinessString,
        required: true,
    },
    ContractField {
        path: "/outline/slides/*/contents/*/body/type",
        value_kind: ContractValueKind::String,
        class: FieldClass::Structural,
        required: false,
    },
    ContractField {
        path: "/outline/slides/*/contents/*/body/src",
        value_kind: ContractValueKind::String,
        class: FieldClass::Reference,
        required: false,
    },
];


const COMPONENTS: &[ComponentContract] = &[
    ComponentContract {
        discriminator: "text_block",
        required_fields: &["type", "paragraphs"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "metric",
        required_fields: &["type", "label", "value"],
        optional_fields: &["unit", "period", "comparison"],
    },
    ComponentContract {
        discriminator: "metrics",
        required_fields: &["type", "items"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "timeline",
        required_fields: &["type", "events"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "process",
        required_fields: &["type", "steps"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "strengths",
        required_fields: &["type", "items"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "comparison",
        required_fields: &["type", "dimensions", "items"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "table",
        required_fields: &["type", "columns", "rows"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "illustrated_items",
        required_fields: &["type", "items"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "image",
        required_fields: &["type", "src", "ratio", "role"],
        optional_fields: &[],
    },
    ComponentContract {
        discriminator: "generated_image",
        required_fields: &["type", "src", "ratio", "role"],
        optional_fields: &[],
    },
];


const CONSTRAINTS: &[ContractConstraint] = &[
    ContractConstraint {
        id: "outline.envelope.fields",
        path: "",
        rule: "required(operation, expected_revision, outline); deny_unknown",
        safe_recovery: "A2",
    },
    ContractConstraint {
        id: "outline.operation.revision",
        path: "/expected_revision",
        rule: "create=null; replace|edit=positive_integer",
        safe_recovery: "A4",
    },
    ContractConstraint {
        id: "outline.slides.cardinality",
        path: "/outline/slides",
        rule: "cardinality(1,100)",
        safe_recovery: "A5",
    },
    ContractConstraint {
        id: "outline.slides.sequence",
        path: "/outline/slides/*/page_number",
        rule: "sequence(1,1); unique",
        safe_recovery: "A2",
    },
    ContractConstraint {
        id: "outline.content_item.shape",
        path: "/outline/slides/*/contents/*",
        rule: "required(body,describe); deny_unknown",
        safe_recovery: "A3",
    },
    ContractConstraint {
        id: "outline.component.discriminator",
        path: "/outline/slides/*/contents/*/body/type",
        rule: "discriminator(type,variant_schema)",
        safe_recovery: "A2",
    },
    ContractConstraint {
        id: "outline.comparison.equal_length",
        path: "/outline/slides/*/contents/*/body",
        rule: "equal_length(dimensions,items.values) or single_series",
        safe_recovery: "A4",
    },
    ContractConstraint {
        id: "outline.table.equal_key_set",
        path: "/outline/slides/*/contents/*/body",
        rule: "equal_key_set(columns.key,rows.keys)",
        safe_recovery: "A3",
    },
    ContractConstraint {
        id: "outline.image.reference_kind",
        path: "/outline/slides/*/contents/*/body",
        rule: "reference_kind(type,src)",
        safe_recovery: "A2",
    },
    ContractConstraint {
        id: "outline.security.forbidden_keys",
        path: "/outline/**",
        rule: "forbid(__proto__,prototype,constructor)",
        safe_recovery: "A0",
    },
];


impl OutlineContractGraph {
    pub const fn current() -> Self {
        Self {
            version: OUTLINE_CONTRACT_VERSION,
            constraints: CONSTRAINTS,
            fields: FIELDS,
            components: COMPONENTS,
        }
    }

    pub const fn version(&self) -> &'static str {
        self.version
    }

    pub const fn constraints(&self) -> &'static [ContractConstraint] {
        self.constraints
    }

    pub const fn fields(&self) -> &'static [ContractField] {
        self.fields
    }

    pub const fn components(&self) -> &'static [ComponentContract] {
        self.components
    }

    pub fn quarantinable_unknown_field(&self, scope: &str, key: &str) -> bool {
        matches!(
            (scope, key),
            (
                "envelope",
                "request_debug" | "provider_debug" | "transport_metadata"
            ) | ("outline", "page_count_hint" | "provider_debug")
        )
    }

    pub fn machine_contract(&self) -> Value {
        json!({
            "contract_version": self.version,
            "canonical_wire": "outline-v2",
            "provider_constraint": {
                "mode": "json_object",
                "reason": "Canonical contents and table rows use contract-validated dynamic semantic keys that cannot be represented by closed-object strict Provider schemas."
            },
            "limits": {
                "response_bytes": MAX_OUTLINE_RESPONSE_BYTES,
                "document_bytes": MAX_OUTLINE_DOCUMENT_BYTES,
                "slides": MAX_OUTLINE_SLIDES,
                "content_items_per_slide": MAX_OUTLINE_CONTENT_ITEMS,
                "business_string_bytes": MAX_OUTLINE_CONTENT_LEN,
                "value_depth": MAX_OUTLINE_VALUE_DEPTH
            },
            "constraints": self.constraints,
            "fields": self.fields,
            "components": self.components,
            "component_rules": component_machine_rules(),
            "custom_component_policy": {
                "required": ["type", "at_least_one_content_property"],
                "type": "semantic_lowercase_snake_case",
                "unknown_fields": "allowed_only_inside_custom_component",
                "limits_apply_recursively": true
            }
        })
    }

    pub fn provider_response_format(&self) -> Value {
        json!({"type": "json_object"})
    }
}
#[path = "component-machine-rules/mod.rs"]
mod function_component_machine_rules;
 use function_component_machine_rules::component_machine_rules;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;

