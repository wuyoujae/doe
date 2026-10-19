use serde::{Deserialize, Serialize};

use sha2::{Digest, Sha256};


#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Deserialize, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RecoveryStage {
    S0,
    S1,
    S2,
    S3,
    S4,
    S5,
    S6,
    S7,
    S8,
    S9,
    S10,
    S11,
    S12,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Repairability {
    None,
    Deterministic,
    StructureModel,
    ContentModel,
    Regeneration,
    ExternalState,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FindingSeverity {
    Info,
    Warning,
    Error,
    Fatal,
}


#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum Ambiguity {
    A0,
    A1,
    A2,
    A3,
    A4,
    A5,
}


#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DiagnosticFinding {
    pub code: String,
    pub stage: RecoveryStage,
    pub invariant: String,
    pub mutation: String,
    pub scope: String,
    pub multiplicity: String,
    pub ambiguity: Ambiguity,
    pub severity: FindingSeverity,
    pub json_pointer: String,
    pub source_byte_start: Option<usize>,
    pub source_byte_end: Option<usize>,
    pub expected: String,
    pub actual: String,
    pub evidence_hash: String,
    pub constraint_id: Option<String>,
}


impl DiagnosticFinding {
    pub fn structural_insert(
        source_offset: usize,
        token: char,
        constraint_id: &'static str,
        scope: impl Into<String>,
    ) -> Self {
        let expected = format!("insert {token} at the current grammar boundary");
        let actual = "the next token belongs to the parent container".to_string();
        Self {
            code: "json.container.missing_closer".to_string(),
            stage: RecoveryStage::S5,
            invariant: "completeness".to_string(),
            mutation: "omit".to_string(),
            scope: scope.into(),
            multiplicity: "single".to_string(),
            ambiguity: Ambiguity::A1,
            severity: FindingSeverity::Error,
            json_pointer: String::new(),
            source_byte_start: Some(source_offset),
            source_byte_end: Some(source_offset),
            evidence_hash: sha256_hex(format!("{source_offset}:{token}:{actual}").as_bytes()),
            expected,
            actual,
            constraint_id: Some(constraint_id.to_string()),
        }
    }
}


#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DiagnosticReport {
    pub primary_stage: RecoveryStage,
    pub findings: Vec<DiagnosticFinding>,
    pub repairability: Repairability,
    pub content_available: bool,
    pub progress_score: f64,
}


impl DiagnosticReport {
    pub fn valid() -> Self {
        Self {
            primary_stage: RecoveryStage::S9,
            findings: Vec::new(),
            repairability: Repairability::None,
            content_available: true,
            progress_score: 1.0,
        }
    }

    pub fn from_findings(mut findings: Vec<DiagnosticFinding>) -> Self {
        if findings.len() > 1 {
            let first_code = findings.first().map(|finding| finding.code.as_str());
            let homogeneous = findings
                .iter()
                .all(|finding| Some(finding.code.as_str()) == first_code);
            let multiplicity = if homogeneous {
                "homogeneous_repeated"
            } else {
                "heterogeneous"
            };
            for finding in &mut findings {
                finding.multiplicity = multiplicity.to_string();
            }
        }
        let primary_stage = findings
            .iter()
            .map(|finding| finding.stage)
            .min()
            .unwrap_or(RecoveryStage::S9);
        let error_count = findings
            .iter()
            .filter(|finding| {
                matches!(
                    finding.severity,
                    FindingSeverity::Error | FindingSeverity::Fatal
                )
            })
            .count();
        Self {
            primary_stage,
            repairability: if findings.is_empty() {
                Repairability::None
            } else {
                Repairability::Deterministic
            },
            content_available: true,
            progress_score: 1.0 / (1.0 + error_count as f64),
            findings,
        }
    }

    pub fn from_outline_output_error(error: &str, content_available: bool) -> Self {
        let (stage, code, invariant, mutation, ambiguity, repairability) =
            if error.starts_with("outline_agent_empty_structured_output") {
                (
                    RecoveryStage::S3,
                    "response.content_empty",
                    "presence",
                    "omit",
                    Ambiguity::A5,
                    Repairability::Regeneration,
                )
            } else if error.starts_with("outline_agent_output_too_large") {
                (
                    RecoveryStage::S3,
                    "response.content_too_large",
                    "bounded",
                    "overflow",
                    Ambiguity::A5,
                    Repairability::Regeneration,
                )
            } else if error.starts_with("outline_agent_invalid_json") {
                (
                    RecoveryStage::S5,
                    "json.document.invalid",
                    "syntax",
                    "corrupt",
                    Ambiguity::A3,
                    Repairability::StructureModel,
                )
            } else if error.starts_with("outline_agent_schema_mismatch") {
                (
                    RecoveryStage::S8,
                    "outline.schema.mismatch",
                    "type",
                    "schema_drift",
                    Ambiguity::A3,
                    Repairability::StructureModel,
                )
            } else if error.starts_with("outline_agent_output_contract_violation") {
                (
                    RecoveryStage::S8,
                    "outline.contract.violation",
                    "semantic",
                    "contract_drift",
                    Ambiguity::A3,
                    Repairability::StructureModel,
                )
            } else {
                (
                    RecoveryStage::S12,
                    "recovery.unclassified_failure",
                    "classification",
                    "unknown",
                    Ambiguity::A5,
                    Repairability::Regeneration,
                )
            };
        let evidence_hash = sha256_hex(error.as_bytes());
        Self {
            primary_stage: stage,
            findings: vec![DiagnosticFinding {
                code: code.to_string(),
                stage,
                invariant: invariant.to_string(),
                mutation: mutation.to_string(),
                scope: "complete_outline_output".to_string(),
                multiplicity: "unknown".to_string(),
                ambiguity,
                severity: FindingSeverity::Error,
                json_pointer: String::new(),
                source_byte_start: None,
                source_byte_end: None,
                expected: "Outline Contract Graph compliant output".to_string(),
                actual: code.to_string(),
                evidence_hash,
                constraint_id: None,
            }],
            repairability,
            content_available,
            progress_score: 0.0,
        }
    }

    pub fn single_failure(
        stage: RecoveryStage,
        code: &str,
        repairability: Repairability,
        content_available: bool,
        evidence: &str,
    ) -> Self {
        Self {
            primary_stage: stage,
            findings: vec![DiagnosticFinding {
                code: code.to_string(),
                stage,
                invariant: "recovery_boundary".to_string(),
                mutation: "failure".to_string(),
                scope: "outline_recovery".to_string(),
                multiplicity: "single".to_string(),
                ambiguity: Ambiguity::A5,
                severity: FindingSeverity::Error,
                json_pointer: String::new(),
                source_byte_start: None,
                source_byte_end: None,
                expected: "a valid bounded recovery result".to_string(),
                actual: code.to_string(),
                evidence_hash: sha256_hex(evidence.as_bytes()),
                constraint_id: None,
            }],
            repairability,
            content_available,
            progress_score: 0.0,
        }
    }
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RepairEdit {
    pub operation: String,
    pub source_byte_start: usize,
    pub source_byte_end: usize,
    pub token: Option<String>,
    pub target_pointer: String,
    pub before_hash: String,
    pub after_hash: String,
    pub constraint_id: String,
    pub ambiguity: Ambiguity,
}


#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RepairProof {
    pub contract_version: String,
    pub input_sha256: String,
    pub output_sha256: String,
    pub edits: Vec<RepairEdit>,
    pub decoded_business_string_multiset_before: String,
    pub decoded_business_string_multiset_after: String,
    pub strict_parse_passed: bool,
    pub duplicate_key_check_passed: bool,
    pub schema_passed: bool,
    pub canonicalization_idempotent: bool,
    pub business_string_invariant_passed: bool,
}
#[path = "sha256-hex/mod.rs"]
mod function_sha256_hex;
pub use function_sha256_hex::sha256_hex;

