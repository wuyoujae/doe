"use strict";

const NUMBERS = ["overflowX", "overflowY", "overlaps", "minWidthViolations", "minHeightViolations",
  "compressionFitViolations", "semanticWrapViolations", "minFontViolations", "minimumFontPx", "minimumFontPt"];
const DETAILS = ["internalPressure", "externalPressure", "fontPressure", "scaleRejections"];
const DETAIL_KEYS = ["id", "key", "path", "overflowX", "overflowY", "blocked", "minimumPt", "actualPt"];

function textProjection(plan) {
  const rows = [];
  for (const key of new Set([...Object.keys(plan?.truncate || {}), ...Object.keys(plan?.textRatio || {})])) {
    let field;
    try { field = JSON.parse(key); } catch { continue; }
    if (!Array.isArray(field) || field.length !== 2 || typeof field[0] !== "string"
      || !field[0].length || field[0].length > 160 || /[\x00-\x1f]/.test(field[0])
      || !Array.isArray(field[1]) || !field[1].length || field[1].length > 12
      || !field[1].every(part => Number.isInteger(part) && part >= 0
        || typeof part === "string" && /^[a-zA-Z_$][a-zA-Z0-9_$-]{0,79}$/.test(part))) continue;
    const path = field[1].join(".");
    if (path.length > 160) continue;
    const truncate = plan.truncate?.[key] === 1, ratio = plan.textRatio?.[key];
    const reduced = Number.isFinite(ratio) && ratio > 0 && ratio < 1;
    if (truncate || reduced) rows.push({ id: field[0], path, ...(truncate ? { truncate: true } : {}),
      ...(reduced ? { textRatio: ratio } : {}) });
  }
  return rows;
}

// Only bounded layout facts enter model context; never HTML, URLs or exception text.
function inspectionReport(report, diagnostics = []) {
  if (!report || typeof report.fits !== "boolean") throw new Error("Inspection layout report is unavailable.");
  const result = { fits: report.fits };
  for (const key of NUMBERS) {
    const value = report[key];
    if (value === null || (typeof value === "number" && Number.isFinite(value))) result[key] = value;
  }
  if (typeof report.solverVersion === "string") result.solverVersion = report.solverVersion.slice(0, 80);
  for (const key of DETAILS) {
    const values = Array.isArray(report[key]) ? report[key] : [];
    result[key] = values.slice(0, 80).map(item => Object.fromEntries(DETAIL_KEYS.flatMap(field => {
      const value = item?.[field];
      if (typeof value === "string") return [[field, value.slice(0, 160)]];
      if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return [[field, value]];
      return [];
    })));
    if (values.length > 80) result[`${key}Omitted`] = values.length - 80;
  }
  result.diagnostics = diagnostics.slice(0, 80).flatMap(item =>
    typeof item?.code === "string" && /^[a-zA-Z0-9_.:-]{1,120}$/.test(item.code)
      ? [{ code: item.code, level: ["error", "warning", "info"].includes(item.level) ? item.level : "info" }] : []);
  // Fitting geometry can still be a shortened projection of the saved text.
  const projection = textProjection(report.compressionPlan);
  result.textProjection = projection.slice(0, 80);
  result.textMayBeTruncated = projection.some(item => item.truncate);
  if (projection.length > 80) result.textProjectionOmitted = projection.length - 80;
  const warnings = [];
  if (result.textMayBeTruncated) warnings.push({ code: "text-projection-truncated", level: "warning" });
  if (projection.some(item => item.textRatio)) warnings.push({ code: "text-projection-reduced", level: "info" });
  result.diagnostics = [...warnings, ...result.diagnostics].slice(0, 80);
  return result;
}

function validateInspection(deck, pageNumber, total) {
  if (deck?.deck?.slides?.length !== 1 || !Number.isInteger(pageNumber) || pageNumber < 1
    || !Number.isInteger(total) || total < pageNumber || total > 300) {
    throw new Error("Inspection requires one page and its original page position.");
  }
}

module.exports = { inspectionReport, validateInspection };
