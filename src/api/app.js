// Import required modules
const express = require('express');
const urlRoutes = require('./routes/url.routes.js');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const basicAuth = require('express-basic-auth');
const monitoringRoutes = require('./routes/monitoring.routes.js');
const { metricsRouter } = require('../metrics/prometheus');
const { urlCheckQueue } = require('../queue/queue');
const path = require('path');

// Initialize Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../../public')));

// Expose Prometheus metrics endpoint
app.use(metricsRouter);

// Mount all URL-related routes under /url
app.use('/url', urlRoutes);
app.use('/monitoring', monitoringRoutes);
// Health check endpoint
app.get('/', (req, res) => {
  res.send('URL Health Checker API is running');
});

// Basic authentication config for Bull Board admin panel
const auth = basicAuth({
  users: { admin: 'admin123' }, // username: admin, password: admin123
  challenge: true, // enables browser-based login popup
});

// Setup Bull Board to monitor the BullMQ queue
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(urlCheckQueue)], // attach our URL queue
  serverAdapter,
});

// Secure Bull Board UI with basic auth
app.use('/admin/queues', auth, serverAdapter.getRouter());

// Export the app for use in the main entry point or testing
module.exports = app;
