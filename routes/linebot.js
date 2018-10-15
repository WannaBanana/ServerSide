var express = require('express');
var router = express.Router();
const config = require('../ENV.json');

const line_config = {
    channelAccessToken: config.line_accessToken,
    channelSecret: config.line_Secret
};

module.exports = router;
