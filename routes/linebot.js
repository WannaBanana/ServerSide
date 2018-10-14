var express = require('express');
var router = express.Router();
const line = require('@line/bot-sdk');

/* 不知道 */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
