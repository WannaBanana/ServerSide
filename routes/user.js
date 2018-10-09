var express = require('express');
var router = express.Router();

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
            res.status(404).send(false);
        }
    });
});

module.exports = router;
