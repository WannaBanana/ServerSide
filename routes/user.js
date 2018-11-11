var express = require('express');
var router = express.Router();
var crypto = require('crypto');
const secret = require('../secret.json');

/* 取得驗證及非驗證使用者資料 */
router.get('/verify', function(req, res) {
    ref = req.database.ref('/user');
    let responseData = {};
    ref.orderByChild('state').equalTo('已驗證').on("value", function(verify_snapshot) {
        let userObject = verify_snapshot.val();
        if(userObject) {
            responseData['已驗證'] = userObject;
        }
        ref.orderByChild('state').equalTo('未驗證').on("value", function(unverify_snapshot) {
            userObject = unverify_snapshot.val();
            if(userObject) {
                responseData['未驗證'] = userObject;
            }
            res.status(200).send(responseData);
        });
    });
});

/* 取得驗證或非驗證使用者資料 */
router.get('/verify/:state', function(req, res) {
    let state = req.params.state;
    ref = req.database.ref('/user');
    switch(state) {
        case '已驗證':
            ref.orderByChild('state').equalTo('已驗證').on("value", function(snapshot) {
                let userObject = snapshot.val();
                let userData = {};
                if(userObject) {
                    snapshot.forEach(function(data) {
                        userData[data.key] = data.val();
                    });
                    res.status(200).send(userData);
                } else {
                    res.status(404).send({"message": "找不到使用者資料"});
                }
            });
            break;
        case '未驗證':
            ref.orderByChild('state').equalTo('未驗證').on("value", function(snapshot) {
                let userObject = snapshot.val();
                let userData = {};
                if(userObject) {
                    snapshot.forEach(function(data) {
                        userData[data.key] = data.val();
                    });
                    res.status(200).send(userData);
                } else {
                    res.status(404).send({"message": "找不到使用者資料"});
                }
            });
            break;
        default:
            res.status(403).send({"message": "未知的狀態"});
    }
});

/* 取得使用者資料 */
router.get('/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/user');
    ref.once("value").then(function(snapshot) {
        let userObject = snapshot.val();
        if(!userObject || userObject.hasOwnProperty(sid)) {
            userObject = userObject[sid];
            let sendData = {
                "photo": userObject.photo,
                "name": userObject.name,
                "department": userObject.department,
                "identity": userObject.identity,
                "email": userObject.email,
                "cellphone": userObject.cellphone,
                "card": userObject.card,
                "state": userObject.state
            };
            if(userObject.lineUserID.length == 5) {
                sendData['lineUserID'] = userObject.lineUserID;
            }
            res.status(200).send(sendData);
        } else {
            res.status(404).send({"message": "找不到使用者資料"});
        }
    });
});

/* 驗證使用者密碼 */
router.post('/:sid', function(req, res) {
    let sid = req.params.sid;
    let password = JSON.parse(JSON.stringify(req.body)).password;
    ref = req.database.ref('/user');
    ref.orderByChild('state').equalTo('已驗證').on("value", function(snapshot) {
        let userObject = snapshot.val();
        if(!userObject || userObject.hasOwnProperty(sid)) {
            userObject = userObject[sid];
            if(userObject.password == crypto.createHmac('sha256', secret.salt).update(password).digest('hex')) {
                ref = req.database.ref('/permission/' + sid);
                ref.once("value").then(function(user_snapshot) {
                    let user = user_snapshot.val();
                    res.status(200).send(user);
                });
            } else {
                res.status(401).send({"status": false});
            }
        } else {
            res.status(404).send({"status": false});
        }
    });
});

module.exports = router;
