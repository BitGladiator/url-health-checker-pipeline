require('dotenv').config();
const app = require('./api/app');
const { createWorker } = require('./queue/worker');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\uD83D\uDE80 Server running on port ${PORT}`);
});

createWorker();