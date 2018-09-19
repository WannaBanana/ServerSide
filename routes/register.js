var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/', function(req, res) {
    let requsetObject = req.body;
    res.status(200).send(requsetObject);
});

module.exports = router;
