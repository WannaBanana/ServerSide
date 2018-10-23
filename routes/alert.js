var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    ref = req.database.ref('/alert');
    ref.once("value").then(function(snapshot) {
        let alertObject = snapshot.val();
        res.status(200).send(alertObject);
    });
});

module.exports = router;