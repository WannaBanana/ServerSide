var express = require('express');
var router = express.Router();

router.get('/admin/:sid', function(req, res) {
    let sid = req.params.sid;
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

module.exports = router;