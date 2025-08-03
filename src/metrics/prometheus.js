// Import Prometheus client and Express
const client = require("prom-client");
const express = require("express");
const router = express.Router();

// Create a new Prometheus registry
const register = new client.Registry();

// Collect default Node.js metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Define a custom histogram metric for measuring URL check durations
const httpDuration = new client.Histogram({
  name: "url_check_duration_seconds", // Metric name
  help: "Duration of URL health checks", // Metric description
  labelNames: ["url", "status"], // Labels for categorizing the metric
  buckets: [0.1, 0.5, 1, 2, 5], // Duration buckets in seconds
});

// Register the custom metric with Prometheus
register.registerMetric(httpDuration);

// Route to expose all metrics at /metrics for Prometheus to scrape
router.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Export router and custom metric for use in other parts of the app
module.exports = { metricsRouter: router, httpDuration };
