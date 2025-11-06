const log = (level, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${level.toUpperCase()}] ${timestamp} - ${message}`);
};

module.exports = {
  info: (msg) => log("info", msg),
  warn: (msg) => log("warn", msg),
  error: (msg) => log("error", msg),
};
