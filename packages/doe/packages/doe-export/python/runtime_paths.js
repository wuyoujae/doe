"use strict";
const path = require("node:path");

function publicRoot() {
  return path.resolve(process.env.YRKIE_DOE_PUBLIC_ROOT || path.join(__dirname, "public"));
}

module.exports = {
  publicRoot,
  workspacePackageJson: path.resolve(__dirname, "../../..", "package.json"),
};
