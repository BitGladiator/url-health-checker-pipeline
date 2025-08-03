// Load environment variables from .env file
require('dotenv').config();

// Import the Express app and the BullMQ worker
const app = require('./api/app');
const { createWorker } = require('./queue/worker');

// Set server port from env or fallback to 3000
const PORT = process.env.PORT || 3000;

// Start the Express server
app.listen(PORT, () => {
  console.log(`\uD83D\uDE80 Server running on port ${PORT}`);
});

createWorker();