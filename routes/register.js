var express = require('express');
var router = express.Router();

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
        res.status(200).send(requestObject);
    } else {
        res.status(403).send(lack_fields.join(', '));
    }
});

module.exports = router;
