var express = require('express');
var router = express.Router();

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
            res.status(200).send({
                "photo": userObject.photo,
                "name": userObject.name,
                "department": userObject.department,
                "identity": userObject.identity,
                "email": userObject.email,
                "cellphone": userObject.cellphone,
                "card": userObject.card,
                "state": userObject.state
            });
        } else {
            res.status(404).send({"message": "找不到使用者資料"});
        }
    });
});

module.exports = router;
