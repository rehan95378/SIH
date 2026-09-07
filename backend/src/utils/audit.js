// Audit helper for logging actions and key events for investigators.
const logAudit = (event, metadata = {}) => {
  console.log(`[AUDIT] ${event}`, metadata);
};

module.exports = { logAudit };
