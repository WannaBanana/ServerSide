var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    let responseObject = {};
    ref = req.database.ref('/alert');
    ref.once("value").then(function(snapshot) {
        let alertObject = snapshot.val();
        for(let key in alertObject) {
            let department = alertObject[key].source.slice(0,4);
            let space = alertObject[key].source.slice(4);
            let date = new Date(alertObject[key].time).toISOString().slice(0, 10);
            if(!responseObject[department]) {
                responseObject[department] = {};
            }
            if(!responseObject[department][space]) {
                responseObject[department][space] = {};
            }
            if(!responseObject[department][space][date]) {
                responseObject[department][space][date] = {};
            }
            if(!responseObject[department][space][date][key]) {
                responseObject[department][space][date][key] = {};
            }
            responseObject[department][space][date][key] = alertObject[key];
        }
        res.status.send(responseObject);
    });
});

module.exports = router;