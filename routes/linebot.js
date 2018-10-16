var express = require('express');

var router = express.Router();
var linebot = require('linebot');
const config = require('../ENV.json');

const bot = linebot({
    channelId: config.line_channelID,
    channelSecret: config.line_Secret,
    channelAccessToken: config.line_accessToken
});

const linebotParser = bot.parser();

router.post('/', linebotParser);

bot.on('message', function (event) {
  event.reply(event.message.text).then(function (data) {
    console.log('Success', data);
  }).catch(function (error) {
    console.log('Error', error);
  });
});
 
module.exports = router;
