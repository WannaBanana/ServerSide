var express = require('express');
var router = express.Router();
var hash = require('hash.js')

/* 查詢學號是否存在 */
router.get('/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/user');
    ref.once("value").then(function(snapshot) {
        let userObject = snapshot.val();
        if(userObject.hasOwnProperty(sid)) {
            res.status(200).send(true);
        } else {
            res.status(406).send(false);
        }
    });
});

/* 註冊卡片 */
router.post('/:sid', function(req, res) {
    let sid = req.params.sid;
    let requestObject = req.body;
    let verify_fields = ["cardName", "cardID"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!requestObject.hasOwnProperty(verify_fields[key])) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        ref = req.database.ref('/user');
        ref.once('value').then(function(snapshot) {
            let userObject = snapshot.val();
            if(userObject.hasOwnProperty(sid)) {
                ref = req.database.ref('/user/' + requestObject.student_id + '/card');
                ref.once('value').then(function(card_snapshot) {
                    let userCard = card_snapshot.val();
                    userCard.forEach(element => {
                        if(element.cardID == requestObject.cardID) {
                            res.status(406).send('卡號重複');
                            return;
                        }
                    });
                    userCard.push({
                        "cardID": requestObject.cardID,
                        "cardName": requestObject.cardName
                    });
                    ref.set(userCard);
                    res.status(200).send('成功');
                });
            } else {
                res.status(406).send('找不到該學號');
            }
        });
    } else {
        res.status(403).send('缺少' + lack_fields.join(', ') + '欄位');
    }
});

/* 新增帳號 */
router.post('/', function(req, res) {
    let requestObject = req.body;
    console.log(requestObject);
    let verify_fields = ["photo", "first_name", "last_name", "email", "password", "student_id", "cellphone"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!requestObject.hasOwnProperty(verify_fields[key])) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        ref = req.database.ref('/user');
        ref.once('value').then(function(snapshot) {
            let userObject = snapshot.val();
            if(!userObject.hasOwnProperty(requestObject.student_id)) {
                ref = req.database.ref('/user/' + requestObject.student_id);
                ref.set({
                    "name": requestObject.first_name + requestObject.last_name,
                    "email": requestObject.email,
                    "idenity": "學生",
                    "lineUserID": "null",
                    "password": hash.sha256().update(requestObject.password).digest('hex'),
                    "card": [],
                    "state": "未驗證"
                });
                res.status(200).send(requestObject);
            } else {
                res.status(406).send('該學號已註冊');
            }
        });
    } else {
        res.status(403).send('缺少' + lack_fields.join(', ') + '欄位');
    }
});

/* 修改帳號資料 */
router.patch('/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/user');
    let verify_fields = ["photo", "first_name", "last_name", "email", "cellphone"];
    ref.once('value').then(function(snapshot) {
        let userObject = snapshot.val();
        if(userObject.hasOwnProperty(requestObject.student_id)) {
            ref = req.database.ref('/user/' + requestObject.student_id);
            ref.once('value').then(function(student_snapshot) {
                let studentObject = student_snapshot.val();
                if(studentObject.password == hash.sha256().update(requestObject.password).digest('hex')) {
                    for(let key in verify_fields) {
                        if(requestObject.hasOwnProperty(verify_fields[key])) {
                            studentObject[verify_fields[key]] = requestObject[verify_fields[key]];
                        }
                        ref.set(studentObject);
                    }
                } else {
                    res.status(401).send('密碼驗證錯誤');
                }
            });
            ref.push({
                "name": requestObject.first_name + requestObject.last_name,
                "email": requestObject.email,
                "idenity": "學生",
                "lineUserID": "null",
                "password": hash.sha256().update(requestObject.password).digest('hex'),
                "card": [],
                "state": "未驗證"
            });
            res.status(200).send(requestObject);
        } else {
            res.status(406).send('該學號未註冊');
        }
    });
});

/* 刪除卡片 */
router.delete('/:sid/card/:cardID', function(req, res) {
    let sid = req.params.sid;
    let cardID = req.params.cardID
    ref = req.database.ref('/user');
    ref.once("value").then(function(snapshot) {
        let userObject = snapshot.val();
        if(userObject.hasOwnProperty(sid)) {
            ref = req.database.ref('/user/' + requestObject.student_id + '/card');
            ref.once('value').then(function(card_snapshot) {
                let userCard = card_snapshot.val();
                if(userCard.indexOf(cardID) != -1) {
                    let index = userObject.indexOf(cardID);
                    if (index > -1) {
                        userCard.splice(index, 1);
                    }
                } else {
                    res.status(406).send('找不到該卡號');
                    return;
                }
                ref.set(userCard);
                res.status(200).send('成功');
            });
        } else {
            res.status(406).send('找不到該學號');
        }
    });
});

/* 刪除帳號 */
router.delete('/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/user');
    ref.once("value").then(function(snapshot) {
        let userObject = snapshot.val();
        if(userObject.hasOwnProperty(sid)) {
            delete userObject[sid];
            ref.set(userObject);
            res.status(200).send('成功');
        } else {
            res.status(406).send('找不到該學號');
        }
    });
});

module.exports = router;
