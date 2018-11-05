var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    ref = req.database.ref('/notify');
    ref.once("value").then(function(snapshot) {
        let notifyObject = snapshot.val();
        res.status(200).send(notifyObject);
    });
});

module.exports = router;