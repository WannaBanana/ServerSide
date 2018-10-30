var express = require('express');
var router = express.Router();

router.get('/admin/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/permission/' + sid);
    ref.once("value").then(function(snapshot) {
        let permissionObject = snapshot.val();
        if(permissionObject && permissionObject.admin == true) {
            res.status(200).send({"state": true});
        } else {
            res.status(404).send({"state": false});
        }
    });
});

router.get('/:sid/space', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/permission/' + sid);
    ref.once("value").then(function(snapshot) {
        let permissionObject = snapshot.val();
        if(permissionObject) {
            res.status(200).send(permissionObject.space);
        } else {
            res.status(404).send({"message": "找不到該使用者權限資料"});
        }
    });
});

router.get('/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/permission/' + sid);
    ref.once("value").then(function(snapshot) {
        let permissionObject = snapshot.val();
        if(permissionObject) {
            res.status(200).send(permissionObject);
        } else {
            res.status(404).send({"message": "找不到該使用者權限資料"});
        }
    });
});

/* 設定管理員 */
router.post('/admin/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/permission/' + sid + '/admin');
    ref.set(true).then(()=>{
        res.status(200).send({"message": "管理員設定成功"});
    });
});

router.delete('/admin/:sid', function(req, res) {
    let sid = req.params.sid;
    ref = req.database.ref('/permission/' + sid + '/admin');
    ref.set(false).then(()=>{
        res.status(200).send({"message": "管理員設定成功"});
    });
});

/* 新增權限 */
router.post('/:sid', function(req, res) {
    let sid = req.params.sid;
    let requestObject = req.body;
    ref = req.database.ref('/permission/' + sid + '/space');
    ref.once("value").then(function(snapshot) {
        let permissionObject = snapshot.val();
        if(permissionObject) {
            for(let dep in requestObject) {
                for(let space in requestObject[dep]) {
                    permissionObject[dep].push(requestObject[dep][space]);
                }
            }
            ref.set(permissionObject).then(() => {
                res.status(200).send({"message": "新增權限成功"});
            });
        } else {
            ref.set(requestObject).then(() => {
                res.status(200).send({"message": "新增權限成功"});
            });
        }
    });
});

router.put('/:sid', function(req, res) {
    let sid = req.params.sid;
    let requestObject = req.body;
    ref = req.database.ref('/permission/' + sid + '/space');
    ref.set(requestObject);
});

/* 刪除權限 */
router.delete('/:sid', function(req, res) {
    let sid = req.params.sid;
    let requestObject = req.body;
    ref = req.database.ref('/permission/' + sid + '/space');
    ref.once("value").then(function(snapshot) {
        let permissionObject = snapshot.val();
        if(permissionObject) {
            for(let dep in requestObject) {
                for(let space in requestObject[dep]) {
                    permissionObject[dep].splice(permissionObject[dep].indexOf(requestObject[dep][space]), 1);
                }
            }
            ref.set(permissionObject).then(() => {
                res.status(200).send({"message": "刪除權限成功"});
            });
        } else {
            ref.set(requestObject).then(() => {
                res.status(404).send({"message": "使用者無該權限"});
            });
        }
    });
});

module.exports = router;