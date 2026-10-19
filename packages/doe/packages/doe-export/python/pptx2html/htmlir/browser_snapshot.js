// Compatibility worker entry; implementations are owned by the export browser modules.
const { main } = require("../../../node/browser/snapshot/protocol/main/index.cjs");
const { errorPayload } = require("../../../node/browser/snapshot/protocol/error-payload/index.cjs");

main().catch((error) => {
  if (process.argv.includes("--worker")) {
    process.stderr.write(`${JSON.stringify(errorPayload(error))}\n`);
  } else {
    process.stdout.write(JSON.stringify(errorPayload(error)));
  }
  process.exit(1);
});
