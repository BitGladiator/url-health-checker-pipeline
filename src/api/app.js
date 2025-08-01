const express = require('express');
const urlRoutes = require('./routes/url.routes.js');

const app = express();
app.use(express.json());

app.use('/url', urlRoutes);
app.get('/', (req, res) => {
  res.send('URL Health Checker API is running');
});

module.exports = app;
