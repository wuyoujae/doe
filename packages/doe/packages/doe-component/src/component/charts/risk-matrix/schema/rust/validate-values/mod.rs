// Component contract from validate_authorable_component_values: "risk-matrix"
use crate::schema::*;

pub(crate) fn validate_authorable_component_values_risk_matrix(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_risk_values(props, path)
}
