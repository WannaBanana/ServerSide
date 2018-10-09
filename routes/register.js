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
                ref = req.database.ref('/user/' + sid + '/card');
                ref.once('value').then(function(card_snapshot) {
                    if(card_snapshot.exists()) {
                        let userCard = card_snapshot.val();
                        console.log(userCard);
                        for(let key in userCard) {
                            if(userCard[key].cardID == requestObject.cardID) {
                                res.status(406).send({"message": "卡號重複"});
                                return;
                            }
                        }
                        userCard.push({
                            "cardID": requestObject.cardID,
                            "cardName": requestObject.cardName
                        });
                        ref.set(userCard);
                        res.status(200).send({"message": "登記成功"});
                    } else {
                        let userCard = [];
                        userCard.push({
                            "cardID": requestObject.cardID,
                            "cardName": requestObject.cardName
                        });
                        ref.set(userCard);
                        res.status(200).send({"message": "登記成功"});
                    }
                });
            } else {
                res.status(404).send({"message": "找不到該學號"});
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
        if(requestObject.student_id == '') {
            res.status(403).send({ "message": "未填學號"});
            return;
        }
        ref = req.database.ref('/user');
        ref.once('value').then(function(snapshot) {
            let userObject = snapshot.val();
            if(!userObject && !userObject.hasOwnProperty(requestObject.student_id)) {
                ref = req.database.ref('/user/' + requestObject.student_id);
                ref.set({
                    "photo": requestObject.photo,
                    "name": requestObject.first_name + requestObject.last_name,
                    "email": requestObject.email,
                    "idenity": "學生",
                    "lineUserID": "null",
                    "password": hash.sha256().update(requestObject.password).digest('hex'),
                    "cellphone": requestObject.cellphone,
                    "card": [null],
                    "state": "未驗證"
                });
                res.status(200).send(requestObject);
            } else {
                res.status(406).send({ "message": "該學號已註冊"});
            }
        });
    } else {
        res.status(403).send({ "message": '缺少 ' + lack_fields.join(', ') + ' 欄位'});
    }
});

/* 修改帳號資料 */
router.patch('/:sid', function(req, res) {
    let sid = req.params.sid;
    let requestObject = req.body;
    ref = req.database.ref('/user');
    let verify_fields = ["photo", "name", "email", "cellphone"];
    ref.once('value').then(function(snapshot) {
        let userObject = snapshot.val();
        if(userObject.hasOwnProperty(sid)) {
            ref = req.database.ref('/user/' + sid);
            ref.once('value').then(function(student_snapshot) {
                let studentObject = student_snapshot.val();
                if(studentObject.password == hash.sha256().update(requestObject.password).digest('hex')) {
                    for(let key in verify_fields) {
                        if(requestObject.hasOwnProperty(verify_fields[key])) {
                            studentObject[verify_fields[key]] = requestObject[verify_fields[key]];
                        }
                        if(requestObject.hasOwnProperty('newpassword')) {
                            studentObject['password'] = hash.sha256().update(requestObject.newpassword).digest('hex');
                        }
                    }
                    ref.set(studentObject);
                    res.status(200).send({"message": "修改成功"});
                } else {
                    res.status(401).send({"message": "密碼驗證錯誤"});
                }
            });
        } else {
            res.status(406).send({"message": "該學號未註冊"});
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
            ref = req.database.ref('/user/' + sid + '/card');
            ref.once('value').then(function(card_snapshot) {
                if(card_snapshot.exists()) {
                    console.log(card_snapshot);
                    let userCard = card_snapshot.val();
                    let index = -1;
                    for(let item in userCard) {
                        if(userCard[item].cardID == cardID) {
                            index = item;
                        }
                    }
                    if (index > -1) {
                        userCard.splice(index, 1);
                        ref.set(userCard);
                        res.status(200).send({"message": "刪除成功"});
                    } else {
                        res.status(404).send({"message": "找不到該卡號"});
                    }
                } else {
                    res.status(404).send({"message": "找不到該卡號"});
                }
            });
        } else {
            res.status(404).send({"message": "找不到該學號"});
        }
    });
});

/* 刪除帳號 */
router.delete('/:sid', function(req, res) {
    let sid = req.params.sid;
    let requestObject = req.body;
    ref = req.database.ref('/user');
    ref.once("value").then(function(snapshot) {
        let userObject = snapshot.val();
        if(userObject.hasOwnProperty(sid)) {
            if(userObject[sid].password == hash.sha256().update(requestObject.password).digest('hex')) {
                delete userObject[sid];
                ref.set(userObject);
                res.status(200).send({"message": "刪除成功"});
            } else {
                res.status(401).send({"message": "密碼驗證錯誤"});
            }
        } else {
            res.status(404).send({"message": "找不到該學號"});
        }
    });
});

module.exports = router;
