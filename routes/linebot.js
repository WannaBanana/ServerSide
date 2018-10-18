var express = require('express');
var router = express.Router();
var linebot = require('linebot');
var bodyParser = require('body-parser');
var config = require('../ENV.json');
var crypto = require('crypto');
const secret = require('../secret.json');
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
              "text": "帳號綁定"
            }
          ],
          "thumbnailImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThNUrbkgtLjgyun1P7GEg6wztMMBHmzLs_gCIxs_owciH2jJAo",
          "title": "歡迎使用 NCNU Space 服務",
          "text": "請先驗證您的使用者後即可使用服務！"
        }
    });
    return;
});

bot.on('message', function (event) {
    let ref = database.ref('/user');
    let message = event.message.text;
    let user = undefined;
    ref.orderByChild('lineUserID').equalTo(event.source.userId).on("value", function(snapshot) {
        let userData = snapshot.val();
        if(userData) {
            for(let key in userData) {
                user = key;
                break;
            }
        }
        if(user) {
            // 使用者已登記
            if(event.message.type == 'text') {
                switch(message) {
                    case '選單':
                        event.reply({
                            "type": "template",
                            "altText": "請使用手機接收本訊息",
                            "template": {
                              "type": "buttons",
                              "actions": [
                                {
                                  "type": "message",
                                  "label": "訂閱教室",
                                  "text": "新增訂閱"
                                },
                                {
                                  "type": "message",
                                  "label": "取消訂閱",
                                  "text": "取消訂閱"
                                },
                                {
                                  "type": "message",
                                  "label": "管理空間",
                                  "text": "管理空間"
                                },
                                {
                                    "type": "message",
                                    "label": "解除綁定",
                                    "text": "解除綁定"
                                  }
                              ],
                              "title": "指令清單",
                              "text": "請點選下方指令執行動作"
                            }
                          });
                        break;
                    case '新增訂閱':
                        ref = database.ref('/permission/' + user);
                        ref.once("value").then(function(snapshot) {
                            let permissionObject = snapshot.val();
                            let button = [];
                            if(permissionObject) {
                                for(let department in permissionObject) {
                                    for(let space in permissionObject[department]) {
                                        button.push({
                                            "type": "postback",
                                            "label": department[0] + permissionObject[department][space],
                                            "data": "subscribe&" + department[0] + permissionObject[department][space]
                                          });
                                    }
                                }
                                event.reply({
                                    "type": "template",
                                    "altText": "請使用手機接收本訊息",
                                    "template": {
                                      "type": "buttons",
                                      "actions": button,
                                      "title": "新增訂閱",
                                      "text": "請點選下列空間進行訂閱"
                                    }
                                  });
                            } else {
                                event.reply({
                                    "type": "text",
                                    "text": "您目前沒有權限訂閱空間！"
                                });
                            }
                        });
                        break;
                    case '取消訂閱':
                        ref = database.ref('/subscribe/' + user);
                        ref.once("value").then(function(snapshot) {
                            let subscribeObject = snapshot.val();
                            let button = [];
                            if(subscribeObject) {
                                for(let department in subscribeObject) {
                                    for(let space in subscribeObject[department]) {
                                        button.push({
                                            "type": "postback",
                                            "label": department[0] + subscribeObject[department][space],
                                            "data": "unsubscribe&" + department[0] + subscribeObject[department][space]
                                          });
                                    }
                                }
                                event.reply({
                                    "type": "template",
                                    "altText": "請使用手機接收本訊息",
                                    "template": {
                                      "type": "buttons",
                                      "actions": button,
                                      "title": "解除訂閱",
                                      "text": "請點選下列空間進行解除訂閱"
                                    }
                                  });
                            } else {
                                event.reply({
                                    "type": "text",
                                    "text": "您目前沒有訂閱的空間！"
                                });
                            }
                        });
                        break;
                    case '管理空間':
                        ref = database.ref('/permission/' + user);
                        ref.once("value").then(function(snapshot) {
                            let permissionObject = snapshot.val();
                            let button = [];
                            if(permissionObject) {
                                for(let department in permissionObject) {
                                    for(let space in permissionObject[department]) {
                                        button.push({
                                            "type": "postback",
                                            "label": department[0] + permissionObject[department][space],
                                            "data": "manage&" + department[0] + permissionObject[department][space]
                                        });
                                    }
                                }
                                event.reply({
                                    "type": "template",
                                    "altText": "請使用手機接收本訊息",
                                    "template": {
                                    "type": "buttons",
                                    "actions": button,
                                    "title": "管理空間",
                                    "text": "請點選下列空間進行管理"
                                    }
                                });
                            } else {
                                event.reply({
                                    "type": "text",
                                    "text": "您目前沒有權限管理空間！"
                                });
                            }
                        });
                        break;
                    case '解除綁定':
                        event.reply({
                            "type": "template",
                            "altText": "請使用手機接收本訊息",
                            "template": {
                              "type": "buttons",
                              "actions": [
                                {
                                  "type": "postback",
                                  "label": "確定",
                                  "data": "cancelVerify"
                                }
                              ],
                              "title": "解除帳號綁定",
                              "text": "您是否確定解除此帳號綁定？（取消請無視本訊息即可）"
                            }
                          });
                        break;
                    default:
                }
            }
        } else {
            // 使用者未登記
            if(event.message.type == 'text') {
                if(message == '帳號綁定') {
                    event.reply({
                        "type": "text",
                        "text": "請輸入： “user=您的驗證碼” 來綁定使用者"
                    });
                } else if(message.split("user=").length == 2) {
                    let userCode = message.split("user=")[1];
                    ref = database.ref('/user');
                    ref.orderByChild('lineUserID').equalTo(userCode).on("value", function(search_snapshot) {
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
                } else {
                    event.reply({
                        "type": "text",
                        "text": "尚未綁定使用者"
                    });
                }
            }
        }
    });
});

bot.on('postback', function (event) {
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
        if(user) {
            if (event.postback.data) {
                let temp = event.postback.data.split("&");
                switch(temp[0]) {
                    case 'subscribe':
                        var depCode = temp[1][0];
                        var space = temp[1].replace(temp[1][0], '');
                        switch(depCode){
                            case '管':
                                depCode = '管理學院';
                                break;
                            case '科':
                                depCode = '科技學院';
                                break;
                            case '人':
                                depCode = '人文學院';
                                break;
                            case '教':
                                depCode = '教育學院';
                                break;
                        }
                        ref = database.ref('/subscribe/' + user + '/' + depCode);
                        ref.once("value").then(function(snapshot) {
                            let subscribeObject = snapshot.val();
                            if(subscribeObject) {
                                if(subscribeObject.indexOf(space) == -1) {
                                    subscribeObject.push(space);
                                    ref.set(subscribeObject).then(function() {
                                        event.reply({
                                            "type": "text",
                                            "text": "訂閱成功"
                                        });
                                    });
                                } else {
                                    event.reply({
                                        "type": "text",
                                        "text": "已經訂閱過該空間了"
                                    });
                                }
                            } else {
                                ref.set([space]);
                                event.reply({
                                    "type": "text",
                                    "text": "訂閱成功"
                                });
                            }
                        });
                        break;
                    case 'unsubscribe':
                        var depCode = temp[1][0];
                        var space = temp[1].replace(temp[1][0], '');
                        switch(depCode){
                            case '管':
                                depCode = '管理學院';
                                break;
                            case '科':
                                depCode = '科技學院';
                                break;
                            case '人':
                                depCode = '人文學院';
                                break;
                            case '教':
                                depCode = '教育學院';
                                break;
                        }
                        ref = database.ref('/subscribe/' + user + '/' + depCode);
                        ref.once("value").then(function(snapshot) {
                            let subscribeObject = snapshot.val();
                            if(subscribeObject) {
                                if(subscribeObject.indexOf(space) != -1) {
                                    subscribeObject.splice(subscribeObject.indexOf(space), 1);
                                    ref.set(subscribeObject).then(function() {
                                        event.reply({
                                            "type": "text",
                                            "text": "取消訂閱成功"
                                        });
                                    })
                                } else {
                                    event.reply({
                                        "type": "text",
                                        "text": "沒有訂閱該空間"
                                    });
                                }
                            }
                        });
                        break;
                    case 'manage':
                        event.reply({
                            "type": "template",
                            "altText": "請使用手機接收本訊息",
                            "template": {
                                "type": "buttons",
                                "actions": [
                                    {
                                        "type": "postback",
                                        "label": "即時動態",
                                        "data": "control&" + temp[1] + "&photo"
                                    },
                                    {
                                        "type": "postback",
                                        "label": "裝置狀態",
                                        "data": "control&" + temp[1] + "&state"
                                    },
                                    {
                                        "type": "postback",
                                        "label": "開門",
                                        "data": "control&" + temp[1] + "open"
                                    },
                                    {
                                        "type": "postback",
                                        "label": "關門",
                                        "data": "control&" + temp[1] + "&close"
                                    }
                                ],
                                "title": temp[1] + " 管理選單",
                                "text": "請選擇下列功能進行管理"
                            }
                          });
                        break;
                    case 'control':
                        var depCode = temp[1][0];
                        var space = temp[1].replace(temp[1][0], '');
                        switch(depCode){
                            case '管':
                                depCode = '管理學院';
                                break;
                            case '科':
                                depCode = '科技學院';
                                break;
                            case '人':
                                depCode = '人文學院';
                                break;
                            case '教':
                                depCode = '教育學院';
                                break;
                        }
                        break;
                    case 'cancelVerify':
                        ref = database.ref('/user/' + user);
                        ref.once("value").then(function(snapshot) {
                            let userData = snapshot.val();
                            if(userData) {
                                userData.lineUserID = (crypto.createHmac('sha1', secret.salt).update(crypto.createHmac('md5', secret.salt).update((new Date()).toISOString()).digest('hex')).digest('hex')).slice(0, 5);
                                ref.set(userData).then(function() {
                                    event.reply({
                                        "type": "text",
                                        "text": "解除使用者綁定成功"
                                    });
                                });
                            }
                        });
                        break;
                    default:
                        event.reply({
                            "type": "text",
                            "text": "未知的指令"
                        });
                }
            }
        } else {
            event.reply({
                "type": "text",
                "text": "尚未綁定使用者"
            });
        }
    });
});

module.exports = router;