"use strict";

const fs = require("fs");
const path = require("path");

const PROC_SELF_CWD = "/proc/self/cwd";

function expandProcessCwd(candidate) {
  if (candidate !== PROC_SELF_CWD && !candidate.startsWith(`${PROC_SELF_CWD}/`)) {
    return candidate;
  }
  const processCwd = fs.realpathSync(PROC_SELF_CWD);
  const suffix = candidate.slice(PROC_SELF_CWD.length);
  return path.posix.resolve(processCwd, `.${suffix}`);
}

function resolveRendererRoot(configuredValue, fallbackRoot) {
  const configured = String(configuredValue || "").trim();
  const candidate = configured || fallbackRoot;
  let root;
  try {
    root = fs.realpathSync(expandProcessCwd(candidate));
  } catch (error) {
    throw new Error(`Yrkie-doe renderer root is unavailable: ${candidate}`, { cause: error });
  }
  if (!fs.statSync(root).isDirectory()) {
    throw new Error(`Yrkie-doe renderer root is not a directory: ${root}`);
  }
  return root;
}

module.exports = { resolveRendererRoot };
