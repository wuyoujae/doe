// Origin: browser_snapshot.js::remainingExportTime


function remainingExportTime(deadline, phase, reserveMs = 0) {
  const remaining = Math.floor(deadline - Date.now() - Math.max(0, reserveMs));
  if (remaining <= 0) throw new Error(`Export deadline exceeded while ${phase}.`);
  return remaining;
}

module.exports = { remainingExportTime };
