// Origin: browser_snapshot.js::assertStaticDocument
const { invalidInputError } = require("../invalid-input-error/index.cjs");
const { assertStaticDocumentInPage1 } = require("../../page/assert-static-document-in-page1/index.cjs");

async function assertStaticDocument(page) {
  const violation = await page.evaluate(assertStaticDocumentInPage1);
  if (violation) throw invalidInputError(`Unsafe HTML rejected: ${violation}.`);
}

module.exports = { assertStaticDocument };
