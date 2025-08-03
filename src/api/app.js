const express = require('express');
const urlRoutes = require('./routes/url.routes.js');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const basicAuth = require('express-basic-auth');
const { metricsRouter } = require('../metrics/prometheus');
const { urlCheckQueue } = require('../queue/queue');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));
app.use(metricsRouter);
app.use('/url', urlRoutes);
app.get('/', (req, res) => {
  res.send('URL Health Checker API is running');
});

const auth = basicAuth({
  users: { admin: 'admin123' },
  challenge: true,
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(urlCheckQueue)],
  serverAdapter,
});

app.use('/admin/queues', auth, serverAdapter.getRouter());

module.exports = app;
