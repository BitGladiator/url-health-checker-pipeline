const client = require("prom-client");
const express = require("express");
const router = express.Router();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpDuration = new client.Histogram({
  name: "url_check_duration_seconds", 
  help: "Duration of URL health checks",
  labelNames: ["url", "status"], 
  buckets: [0.1, 0.5, 1, 2, 5], 
});

register.registerMetric(httpDuration);

router.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

module.exports = { metricsRouter: router, httpDuration };
