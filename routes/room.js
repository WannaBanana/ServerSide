var express = require('express');
var router = express.Router();

/* GET 單一空間資訊 */
router.get('/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    ref = req.database.ref('/space');
    ref.once("value").then(function(snapshot) {
        let spaceObject = snapshot.val();
        if(spaceObject.hasOwnProperty(department)) {
            ref = req.database.ref('/space/' + department);
            ref.once("value").then(function(department_snapshot) {
                let departmentObject = department_snapshot.val();
                if(departmentObject.hasOwnProperty(space)) {
                    res.status(200).send(departmentObject[space]);
                } else {
                    res.status(404).send('找不到該空間資料');
                }
            });
        } else {
            res.status(404).send('找不到該院別資料');
        }
    });
});

/* GET 院別資料 */
router.get('/:department', function(req, res) {
    let department = req.params.department;
    ref = req.database.ref('/space');
    ref.once("value").then(function(snapshot) {
        let spaceObject = snapshot.val();
        if(spaceObject.hasOwnProperty(department)) {
            res.status(200).send(spaceObject[department]);
        } else {
            res.status(404).send('找不到該院別資料');
        }
    });
});

/* GET 完整資料 */
router.get('/', function(req, res) {
    ref = req.database.ref('/space');
    ref.once("value").then(function(snapshot) {
        let spaceObject = snapshot.val();
        res.status(200).send(spaceObject);
    });
});

module.exports = router;
