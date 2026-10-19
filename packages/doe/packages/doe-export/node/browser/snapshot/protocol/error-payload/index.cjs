// Origin: browser_snapshot.js::errorPayload


function errorPayload(error) {
  return {
    success: false,
    error: error && error.message ? error.message : String(error),
    error_kind: error && error.yrkieErrorKind === "content" ? "content" : "runtime",
    stack: error && error.stack ? String(error.stack) : null,
  };
}

module.exports = { errorPayload };
