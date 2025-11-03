const axios = require('axios');
const logger = require('./logger');

const httpClient = axios.create({
  timeout: 5000, 
});

httpClient.interceptors.response.use(
  response => response,
  error => {
    const url = error.config?.url || 'unknown URL';
    logger.error(`HTTP request failed for ${url}: ${error.message}`);
    return Promise.reject(error);
  }
);

module.exports = httpClient;
