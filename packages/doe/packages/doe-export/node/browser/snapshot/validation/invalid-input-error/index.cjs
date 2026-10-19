// Origin: browser_snapshot.js::invalidInputError


function invalidInputError(message) {
  const error = new Error(message);
  error.yrkieErrorKind = "content";
  return error;
}

module.exports = { invalidInputError };
