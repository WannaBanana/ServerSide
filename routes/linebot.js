var express = require('express');
var router = express.Router();
var linebot = require('linebot');
var bodyParser = require('body-parser');
var config = require('../ENV.json');
var database = undefined;

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
    database = req.database
    if (!bot.verify(req.rawBody, req.get('X-Line-Signature'))) {
        return res.sendStatus(400);
    }
    bot.parse(req.body);
    return res.json({});
});

bot.on('follow',   function (event) {
    event.reply({
        "type": "template",
        "altText": "請使用手機接收本訊息",
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
    let ref = database.ref('/user');
    let user = undefined;
    ref.orderByChild('lineUserID').equalTo(event.source.userId).on("value", function(snapshot) {
        let userData = snapshot.val();
        if(userData) {
            for(let key in userData) {
                user = key;
                break;
            }
        }
    });
    if (event.message.type == 'text') {
        let mseeage = event.message.text;
        switch(mseeage) {
            case '帳號驗證':
                event.reply({
                    "type": "text",
                    "text": "請輸入： “user=您的驗證碼” 來綁定使用者"
                });
                break;
            case '協助':
                event.reply({
                    "type": "template",
                    "altText": "請使用手機接收本訊息",
                    "template": {
                      "type": "buttons",
                      "actions": [
                        {
                          "type": "message",
                          "label": "訂閱教室",
                          "text": "訂閱"
                        },
                        {
                          "type": "message",
                          "label": "取消訂閱",
                          "text": "取消訂閱"
                        },
                        {
                          "type": "message",
                          "label": "查看空間",
                          "text": "查看"
                        }
                      ],
                      "title": "指令清單",
                      "text": "請點選下方指令執行動作"
                    }
                  });
                break;
            case '訂閱':
                event.reply({
                    "type": "text",
                    "text": "請輸入： “subscribe=空間” 來訂閱空間，空間名稱範例：「管241」"
                });
                break;
            case '取消訂閱':
                break;
            case '查看空間':
                break;
            case '解除連結':
                break;
            default:
                if(message.split("user=").length == 2) {
                    let userCode = message.split("user=")[1];
                    ref.orderByChild('lineUserID').equalTo(userCode).on("value", function(snapshot) {
                        let userData = snapshot.val();
                        let userKey = undefined;
                        if(userData) {
                            for(let key in userData) {
                                userKey = key;
                                break;
                            }
                            if(userKey) {
                                userData[userKey].lineUserID = event.source.userId;
                                ref.child(userKey).set(userData[userKey]);
                                event.reply({
                                    "type": "text",
                                    "text": "使用者: " + userData[userKey].name + " 綁定成功!"
                                });
                            }
                        } else {
                            event.reply({
                                "type": "text",
                                "text": "綁定失敗, 查無此驗證碼: " + userCode
                            });
                        }
                    });
                }
                if(message.split("subscribe=").length == 2) {
                    let subscribeSpace = message.split("subscribe=")[1];
                    if(user) {
                        ref = database.ref('/subscribe/' + user);
                        
                    } else {
                        event.reply({
                            "type": "text",
                            "text": "請先綁定帳號"
                        });
                    }
                    ref = database.ref('/subscreibe');
                }
                break;
        }
        event.reply(mseeage).then(function (data) {
            console.log('Success', data);
        }).catch(function (error) {
            console.log('Error', error);
        });
    }
});

module.exports = router;