var express = require('express');
var router = express.Router();

router.get('/:department/:space/:item', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let item = req.params.item;
    ref = req.database.ref('/item/' + department + '/' + space + '/' + item);
    ref.once("value").then(function(snapshot) {
        let itemObject = snapshot.val();
        if(itemObject) {
            res.status(200).send(itemObject);
        } else {
            res.status(404).send({"message": "找不到該物品資料"});
        }
    });
});

router.get('/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    ref = req.database.ref('/item/' + department + '/' + space);
    ref.once("value").then(function(snapshot) {
        let itemObject = snapshot.val();
        if(itemObject) {
            res.status(200).send(itemObject);
        } else {
            res.status(404).send({"message": "找不到該空間物品資料"});
        }
    });
});

router.get('/:department', function(req, res) {
    let department = req.params.department;
    ref = req.database.ref('/item/' + department);
    ref.once("value").then(function(snapshot) {
        let itemObject = snapshot.val();
        if(itemObject) {
            res.status(200).send(itemObject);
        } else {
            res.status(404).send({"message": "找不到該學院物品資料"});
        }
    });
});

router.get('/', function(req, res) {
    ref = req.database.ref('/item');
    ref.once("value").then(function(snapshot) {
        let itemObject = snapshot.val();
        if(itemObject) {
            res.status(200).send(itemObject);
        } else {
            res.status(404).send({"message": "找不到所有物品資料"});
        }
    });
});

router.post('/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let requestObject = req.body;
    let verify_fields = ["itemID", "itemName", "imgSrc", "itemRule", "type"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!(Object.prototype.hasOwnProperty.call(requestObject, verify_fields[key]))) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        ref = req.database.ref('/item/' + department + '/' + space);
        ref.once("value").then(function(snapshot){
            let spaceItemObject = snapshot.val();
            if(spaceItemObject && Object.prototype.hasOwnProperty.call(spaceItemObject, requestObject.itemID)) {
                res.status(406).send({
                    "message": "該物品編號已被使用"
                });
            } else {
                ref = req.database.ref('/item/' + department + '/' + space + '/' + requestObject.itemID);
                ref.set({
                    "imgSrc": requestObject.imgSrc,
                    "itemName": requestObject.itemName,
                    "itemRule": requestObject.itemRule,
                    "logTime": new Date().toISOString(),
                    "state": "存貨中",
                    "type": requestObject.type
                }).then(() => {
                    res.status(200).send({
                        "message": "新增成功"
                    });
                });
            }
        });
    } else {
        res.status(403).send({
            "message": '缺少' + lack_fields.join(', ') + '欄位'
        });
    }
});

router.patch('/:department/:space/:item', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let item = req.params.item;
    let requestObject = req.body;
    let verify_fields = ["imgSrc", "itemRule", "type"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!(Object.prototype.hasOwnProperty.call(requestObject, verify_fields[key]))) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        ref = req.database.ref('/item/' + department + '/' + space + '/' + item);
        ref.once("value").then(function(snapshot){
            let itemObject = snapshot.val();
            if(itemObject) {
                itemObject.itemName = requestObject.itemName;
                itemObject.imgSrc = requestObject.imgSrc;
                itemObject.itemRule = requestObject.itemRule;
                itemObject.type = requestObject.type;
                ref.set(itemObject).then(() => {
                    res.status(200).send({
                        "message": "修改成功"
                    });
                });
            } else {
                res.status(404).send({
                    "message": "找不到該物品"
                });
            }
        });
    } else {
        res.status(403).send({
            "message": '缺少' + lack_fields.join(', ') + '欄位'
        });
    }
});

router.delete('/:department/:space/:item', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let item = req.params.item;
    ref = req.database.ref('/item/' + department + '/' + space + '/' + item);
    ref.once("value").then(function(snapshot){
        let itemObject = snapshot.val();
        if(itemObject) {
            ref.remove().then(() => {
                res.status(200).send({
                    "message": "刪除成功"
                });
            });
        } else {
            res.status(404).send({
                "message": "找不到該物品"
            });
        }
    });
});

module.exports = router;