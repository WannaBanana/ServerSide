var express = require('express');
var router = express.Router();

/* 新增帳號 */
router.post('/', function(req, res) {
    let requsetObject = req.body;
    let verify_fields = ["first_name", "last_name", "email", "password", "student_id", "cellphone"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!requsetObject.hasOwnProperty(key)) {
            lack_fields.push(key);
        }
    }
    if(lack_fields.length() == 0) {
        res.status(200).send(requsetObject);
    } else {
        res.status(403).send('{ "message": "缺少欄位 ' + lack_fields + ' 資訊" }');
    }
});

module.exports = router;
