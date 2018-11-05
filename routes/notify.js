var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    ref = req.database.ref('/notify');
    ref.once("value").then(function(snapshot) {
        let notifyObject = snapshot.val();
        if(notifyObject) {
            res.status(200).send(notifyObject);
        } else {
            res.status(404).send({"message": "找不到通知"});
        }
    });
});

module.exports = router;