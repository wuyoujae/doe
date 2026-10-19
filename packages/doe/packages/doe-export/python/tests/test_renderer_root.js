"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const { afterEach, mock, test } = require("node:test");

const { resolveRendererRoot } = require("../renderer_root");

afterEach(() => mock.restoreAll());

test("resolves a proc cwd path through the filesystem before joining runtime assets", () => {
  const configured = "/proc/self/cwd/../frontend/public/yrkie-doe";
  const releaseRoot = "/opt/yrkie/releases/release-1/app/frontend/public/yrkie-doe";
  const calls = [];
  mock.method(fs, "realpathSync", (candidate) => {
    calls.push(candidate);
    if (candidate === "/proc/self/cwd") {
      return "/opt/yrkie/releases/release-1/app/pptx_html_runtime";
    }
    assert.equal(candidate, releaseRoot);
    return releaseRoot;
  });
  mock.method(fs, "statSync", (candidate) => {
    assert.equal(candidate, releaseRoot);
    return { isDirectory: () => true };
  });

  assert.equal(resolveRendererRoot(configured, "/unused"), releaseRoot);
  assert.deepEqual(calls, ["/proc/self/cwd", releaseRoot]);
});

test("uses the release-relative fallback when no root is configured", () => {
  const fallback = "/opt/yrkie/releases/release-1/app/frontend/public/yrkie-doe";
  mock.method(fs, "realpathSync", (candidate) => candidate);
  mock.method(fs, "statSync", () => ({ isDirectory: () => true }));

  assert.equal(resolveRendererRoot("", fallback), fallback);
});
