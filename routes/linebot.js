var express = require('express');
var router = express.Router();
var linebot = require('linebot');
var bodyParser = require('body-parser');
var config = require('../ENV.json');

const bot = linebot({
    channelId: config.line_channelID,
    channelSecret: config.line_Secret,
    channelAccessToken: config.line_accessToken
});

const parser = bodyParser.json({
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf.toString(encoding);
    }
});

router.post('/', parser, function (req, res) {
    if (!bot.verify(req.rawBody, req.get('X-Line-Signature'))) {
        return res.sendStatus(400);
    }
    bot.parse(req.body);
    return res.json({});
});

bot.on('follow',   function (event) {
    event.reply({
        "type": "template",
        "altText": "this is a buttons template",
        "template": {
          "type": "buttons",
          "actions": [
            {
              "type": "message",
              "label": "立即驗證",
              "text": "帳號驗證"
            }
          ],
          "thumbnailImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThNUrbkgtLjgyun1P7GEg6wztMMBHmzLs_gCIxs_owciH2jJAo",
          "title": "歡迎使用 NCNU Space 服務",
          "text": "請先驗證您的使用者後即可使用服務！"
        }
    })
});

bot.on('message', function (event) {
    if (event.message.type == 'text') {
        event.reply(event.message.text).then(function (data) {
            console.log('Success', data);
        }).catch(function (error) {
            console.log('Error', error);
        });
    }
});

module.exports = router;