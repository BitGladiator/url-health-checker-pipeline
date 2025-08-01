const express = require('express');
const router = express.Router();
const { submitUrlCheck,getUrlStatus } = require('../controllers/url.controller.js');

router.post('/check', submitUrlCheck);

router.get('/status', getUrlStatus);
module.exports = router;
