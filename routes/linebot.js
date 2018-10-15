var express = require('express');
var router = express.Router();
const line = require('@line/bot-sdk');
const config = require('../ENV.json');

const config = {
    channelAccessToken: config.line_accessToken,
    channelSecret: config.line_Secret
};

const client = new line.Client(config);

router.post('/webhook', line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: event.message.text
    });
}

module.exports = router;
