

pub const FACTUAL_POLICY_GROUNDED: &str = "grounded_or_clearly_bounded";

pub const FACTUAL_POLICY_SYNTHETIC_ALLOWED: &str = "explicit_synthetic_data_allowed";
#[path = "compile-factual-claim-policy/mod.rs"]
mod function_compile_factual_claim_policy;
pub use function_compile_factual_claim_policy::compile_factual_claim_policy;

#[path = "compile-factual-claim-policy-from-values/mod.rs"]
mod function_compile_factual_claim_policy_from_values;
pub use function_compile_factual_claim_policy_from_values::compile_factual_claim_policy_from_values;

#[path = "clause-spans/mod.rs"]
mod function_clause_spans;
 pub use function_clause_spans::clause_spans;

