require("dotenv").config();

const app = require("./api/app");
const { createWorker } = require("./queue/worker");
const { cronScheduler } = require("./scheduler/cronJobs");

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  createWorker();
  await cronScheduler.startAllJobs();
});
process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  cronScheduler.stopAllJobs();
  process.exit(0);
});
