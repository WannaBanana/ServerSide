var express = require('express');
var router = express.Router();

/* 物品預約 */

/* 獲得各院空間物品預約資訊 */
router.get('/book/:department', function(req, res) {
    let department = req.params.department;
    ref = req.database.ref('/itemReservation/' + department);
    ref.once("value").then(function(snapshot) {
        let responseObject = {};
        let reservationObject = snapshot.val();
        if(reservationObject) {
            for(let space in reservationObject) {
                for(let date in reservationObject[space]) {
                    for(let key in reservationObject[space][date]) {
                        if(reservationObject[space][date][key].state == '未核准') {
                            responseObject[space] = {};
                            responseObject[space][date] = {};
                            responseObject[space][date][key] = reservationObject[space][date][key];
                        }
                    }
                }
            }
            res.status(200).send(responseObject);
        } else {
            res.status(404).send({"message": "找不到該院別資料"});
        }
    });
});

/* 查詢單筆物品預約資訊 */
router.get('/reservation/:department/:space/:key', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let key = req.params.key;
    ref = req.database.ref('/itemReservation');
    ref.once("value").then(function(snapshot) {
        let reservationObject = snapshot.val();
        if(Object.prototype.hasOwnProperty.call(reservationObject, department)) {
            ref = req.database.ref('/itemReservation/' + department);
            ref.once("value").then(function(department_snapshot) {
                let departmentObject = department_snapshot.val();
                if(Object.prototype.hasOwnProperty.call(departmentObject, space)) {
                    for(let date in space) {
                        for(let self_key in date) {
                            if(self_key == key) {
                                res.status(200).send(departmentObject[date][key]);
                                return;
                            }
                        }
                    }
                    res.status(404).send('找不到該筆預約資料');
                } else {
                    res.status(404).send('找不到該空間資料');
                }
            });
        } else {
            res.status(404).send('找不到該院別資料');
        }
    });
});

/* 獲得單獨空間物品預約資訊 */
router.get('/reservation/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    ref = req.database.ref('/itemReservation');
    ref.once("value").then(function(snapshot) {
        let reservationObject = snapshot.val();
        if(Object.prototype.hasOwnProperty.call(reservationObject, department)) {
            ref = req.database.ref('/itemReservation/' + department);
            ref.once("value").then(function(department_snapshot) {
                let departmentObject = department_snapshot.val();
                if(Object.prototype.hasOwnProperty.call(departmentObject, space)) {
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

/* 獲得該院物品預約資訊 */
router.get('/reservation/:department', function(req, res) {
    let department = req.params.department;
    ref = req.database.ref('/itemReservation');
    ref.once("value").then(function(snapshot) {
        let reservationObject = snapshot.val();
        if(Object.prototype.hasOwnProperty.call(reservationObject, department)) {
            res.status(200).send(reservationObject[department]);
        } else {
            res.status(404).send('找不到該院別資料');
        }
    });
});

/* 新增預約 */
router.post('/reservation/admin/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let requestObject = req.body;
    let verify_fields = ["studentID", "department", "itemID", "title", "start", "end", "repeat", "repeat_end", "conflict"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!(Object.prototype.hasOwnProperty.call(requestObject, verify_fields[key]))) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        let reservationCurrent = undefined;
        ref = req.database.ref('/itemReservation/' + department + '/' + space + '/');
        ref.once('value').then(function(snapshot) {
            // 如果有資料的情況
            if(snapshot.hasChildren()) {
                reservationCurrent = snapshot.val();
                // console.log('有資料: ' + JSON.stringify(reservationCurrent));
            }
            // 防止時間顛倒
            // console.log('處理時間顛倒');
            if(new Date(requestObject.start) > new Date(requestObject.end)) {
                [requestObject.start, requestObject.end] = [requestObject.end, requestObject.start];
            }
            // console.log('檢查衝突')
            // 檢查衝突, 在禁止衝突的情況
            let begin = new Date(requestObject.start);
            let stop = new Date(requestObject.end);
            // console.log('Start: ' + begin + ', end: ' + stop);
            // 不允許衝突情況下需檢查衝突
            if(requestObject.conflict == 'false') {
                // console.log('不允許衝突');
                while(reservationCurrent != undefined) {
                    let date = new Date(begin).toISOString().slice(0, 10);
                    // console.log('日期檢查: ' + date);
                    if(reservationCurrent && reservationCurrent[date] != undefined) {
                        for(key in reservationCurrent[date]) {
                            // 若開始時間是已經被預約的期間, 則回傳時間衝突
                            if((new Date(reservationCurrent[date][key].start) <= begin && new Date(reservationCurrent[date][key].end) > begin) || (new Date(reservationCurrent[date][key].start) < stop && new Date(reservationCurrent[date][key].end) >= stop)) {
                                // console.log('時間衝突');
                                res.status(403).send({
                                    "message": "時間衝突"
                                });
                                return;
                            }
                            // console.log('時間未衝突');
                        }
                    }
                    // 非重複性預約則結束迴圈
                    if(requestObject.repeat == 'none') {
                        break;
                    // 判斷是否已到終止日期
                    } else {
                        // console.log('重複直到: ' + new Date(requestObject.repeat_end));
                        switch(requestObject.repeat) {
                            case 'daily':
                                begin.setDate(begin.getDate() + 1);
                                stop.setDate(stop.getDate() + 1);
                                break;
                            case 'weekly':
                                begin.setDate(begin.getDate() + 7);
                                stop.setDate(stop.getDate() + 7);
                                break;
                            case 'biweekly':
                                begin.setDate(begin.getDate() + 14);
                                stop.setDate(stop.getDate() + 14);
                                break;
                            case 'monthly':
                                begin.setMonth(begin.getMonth() + 1);
                                stop.setMonth(stop.getMonth() + 1);
                                break;
                            default:
                                res.status(403).send({
                                    "message": "重複格式錯誤"
                                });
                                return;
                        }
                        // console.log(begin, stop);
                        if(new Date(requestObject.repeat_end) < stop) {
                            break;
                        }
                    }
                }
            }
            // 插入預約
            // console.log('插入預約');
            let succes = 0;
            let fail = 0;
            [begin, stop] = [new Date(requestObject.start), new Date(requestObject.end)];
            // console.log('Start: ' + begin + ', end: ' + stop + ', reservationCurrent: ' + reservationCurrent);
            while(true) {
                // (年 / 月 / 日)來作為該天預約索引值
                let date = new Date(begin).toISOString().slice(0, 10);
                // console.log('日期檢查: ' + date);
                // 用來判斷是否有衝突
                let conflict = false;
                ref = req.database.ref('/itemReservation/' + department + '/' + space + '/' + date);
                if(reservationCurrent && reservationCurrent[date] != undefined) {
                    for(key in reservationCurrent[date]) {
                        if((new Date(reservationCurrent[date][key].start) <= begin && new Date(reservationCurrent[date][key].end) > begin) || (new Date(reservationCurrent[date][key].start) < stop && new Date(reservationCurrent[date][key].end) >= stop)) {
                            conflict = true;
                            fail++;
                            // console.log('衝突');
                            // 只有一筆的情況衝突
                            if(requestObject.repeat == 'none') {
                                res.status(403).send({
                                    "message": "時間衝突"
                                });
                                return;
                            }
                        }
                    }
                }
                if(conflict == false) {
                    // console.log('未衝突');
                    // 預先填入資料
                    let object = {
                        "studentID": requestObject.studentID,
                        "department": requestObject.department,
                        "title": requestObject.title,
                        "itemID": requestObject.itemID,
                        "start": begin.toISOString(),
                        "end": stop.toISOString(),
                        "state": "已核准"
                    };
                    // 如果是重複性預約, 則 repeat 值為 true, 反之
                    if(requestObject.repeat != 'none') {
                        object["repeat"] = true;
                    } else {
                        object["repeat"] = false;
                    }
                    // 將衍伸子預約填回父預約 Key 值
                    var parent_arr = [];
                    ref.push(object).then((push_snapshot) => {
                        if(parent_arr.length != 0) {
                            let parentKey = parent_arr.pop();
                            ref = req.database.ref('/itemReservation/' + department + '/' + space + '/');
                            ref.once('value').then(function(snapshot) {
                                let spaceReservation = snapshot.val();
                                for(let date in spaceReservation) {
                                    for(let self_key in spaceReservation[date]) {
                                        if(self_key == parentKey) {
                                            ref.child(date).child(parentKey).child('child').set(push_snapshot.key);
                                        }
                                    }
                                }
                            });
                        }
                        parent_arr.push(push_snapshot.key);
                    });
                    succes++;
                }
                // 非重複性預約則結束迴圈
                if(requestObject.repeat == 'none') {
                    break;
                // 判斷是否已到終止日期
                } else {
                    // console.log('重複直到: ' + new Date(requestObject.repeat_end));
                    switch(requestObject.repeat) {
                        case 'daily':
                            begin.setDate(begin.getDate() + 1);
                            stop.setDate(stop.getDate() + 1);
                            break;
                        case 'weekly':
                            begin.setDate(begin.getDate() + 7);
                            stop.setDate(stop.getDate() + 7);
                            break;
                        case 'biweekly':
                            begin.setDate(begin.getDate() + 14);
                            stop.setDate(stop.getDate() + 14);
                            break;
                        case 'monthly':
                            begin.setMonth(begin.getMonth() + 1);
                            stop.setMonth(stop.getMonth() + 1);
                            break;
                        default:
                            res.status(403).send({
                                "message": "重複格式錯誤"
                            });
                            return;
                    }
                    // console.log(begin, stop);
                    if(new Date(requestObject.repeat_end) < stop) {
                        break;
                    }
                }
            }
            res.status(200).send({
                "message": '預約成功 - 筆數: ' + succes + ', 預約失敗 - 筆數: ' + fail
            });
        });
    } else {
        res.status(403).send({
            "message": '缺少' + lack_fields.join(', ') + '欄位'
        });
    }
});

router.post('/reservation/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let requestObject = req.body;
    let verify_fields = ["studentID", "department", "itemID", "title", "start", "end", "repeat", "repeat_end", "conflict"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!(Object.prototype.hasOwnProperty.call(requestObject, verify_fields[key]))) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        let reservationCurrent = undefined;
        ref = req.database.ref('/itemReservation/' + department + '/' + space + '/');
        ref.once('value').then(function(snapshot) {
            // 如果有資料的情況
            if(snapshot.hasChildren()) {
                reservationCurrent = snapshot.val();
                // console.log('有資料: ' + JSON.stringify(reservationCurrent));
            }
            // 防止時間顛倒
            // console.log('處理時間顛倒');
            if(new Date(requestObject.start) > new Date(requestObject.end)) {
                [requestObject.start, requestObject.end] = [requestObject.end, requestObject.start];
            }
            // console.log('檢查衝突')
            // 檢查衝突, 在禁止衝突的情況
            let begin = new Date(requestObject.start);
            let stop = new Date(requestObject.end);
            // console.log('Start: ' + begin + ', end: ' + stop);
            // 不允許衝突情況下需檢查衝突
            if(requestObject.conflict == 'false') {
                // console.log('不允許衝突');
                while(reservationCurrent != undefined) {
                    let date = new Date(begin).toISOString().slice(0, 10);
                    // console.log('日期檢查: ' + date);
                    if(reservationCurrent && reservationCurrent[date] != undefined) {
                        for(key in reservationCurrent[date]) {
                            // 若開始時間是已經被預約的期間, 則回傳時間衝突
                            if((new Date(reservationCurrent[date][key].start) <= begin && new Date(reservationCurrent[date][key].end) > begin) || (new Date(reservationCurrent[date][key].start) < stop && new Date(reservationCurrent[date][key].end) >= stop)) {
                                // console.log('時間衝突');
                                res.status(403).send({
                                    "message": "時間衝突"
                                });
                                return;
                            }
                            // console.log('時間未衝突');
                        }
                    }
                    // 非重複性預約則結束迴圈
                    if(requestObject.repeat == 'none') {
                        break;
                    // 判斷是否已到終止日期
                    } else {
                        // console.log('重複直到: ' + new Date(requestObject.repeat_end));
                        switch(requestObject.repeat) {
                            case 'daily':
                                begin.setDate(begin.getDate() + 1);
                                stop.setDate(stop.getDate() + 1);
                                break;
                            case 'weekly':
                                begin.setDate(begin.getDate() + 7);
                                stop.setDate(stop.getDate() + 7);
                                break;
                            case 'biweekly':
                                begin.setDate(begin.getDate() + 14);
                                stop.setDate(stop.getDate() + 14);
                                break;
                            case 'monthly':
                                begin.setMonth(begin.getMonth() + 1);
                                stop.setMonth(stop.getMonth() + 1);
                                break;
                            default:
                                res.status(403).send({
                                    "message": "重複格式錯誤"
                                });
                                return;
                        }
                        // console.log(begin, stop);
                        if(new Date(requestObject.repeat_end) < stop) {
                            break;
                        }
                    }
                }
            }
            // 插入預約
            // console.log('插入預約');
            let succes = 0;
            let fail = 0;
            [begin, stop] = [new Date(requestObject.start), new Date(requestObject.end)];
            // console.log('Start: ' + begin + ', end: ' + stop + ', reservationCurrent: ' + reservationCurrent);
            while(true) {
                // (年 / 月 / 日)來作為該天預約索引值
                let date = new Date(begin).toISOString().slice(0, 10);
                // console.log('日期檢查: ' + date);
                // 用來判斷是否有衝突
                let conflict = false;
                ref = req.database.ref('/itemReservation/' + department + '/' + space + '/' + date);
                if(reservationCurrent && reservationCurrent[date] != undefined) {
                    for(key in reservationCurrent[date]) {
                        if((new Date(reservationCurrent[date][key].start) <= begin && new Date(reservationCurrent[date][key].end) > begin) || (new Date(reservationCurrent[date][key].start) < stop && new Date(reservationCurrent[date][key].end) >= stop)) {
                            conflict = true;
                            fail++;
                            // console.log('衝突');
                            // 只有一筆的情況衝突
                            if(requestObject.repeat == 'none') {
                                res.status(403).send({
                                    "message": "時間衝突"
                                });
                                return;
                            }
                        }
                    }
                }
                if(conflict == false) {
                    // console.log('未衝突');
                    // 預先填入資料
                    let object = {
                        "studentID": requestObject.studentID,
                        "department": requestObject.department,
                        "title": requestObject.title,
                        "itemID": requestObject.itemID,
                        "start": begin.toISOString(),
                        "end": stop.toISOString(),
                        "state": "未核准"
                    };
                    // 如果是重複性預約, 則 repeat 值為 true, 反之
                    if(requestObject.repeat != 'none') {
                        object["repeat"] = true;
                        object["repeat_type"] = requestObject.repeat;
                    } else {
                        object["repeat"] = false;
                    }
                    // 將衍伸子預約填回父預約 Key 值
                    var parent_arr = [];
                    ref.push(object).then((push_snapshot) => {
                        if(parent_arr.length != 0) {
                            let parentKey = parent_arr.pop();
                            ref = req.database.ref('/itemReservation/' + department + '/' + space + '/');
                            ref.once('value').then(function(snapshot) {
                                let spaceReservation = snapshot.val();
                                for(let date in spaceReservation) {
                                    for(let self_key in spaceReservation[date]) {
                                        if(self_key == parentKey) {
                                            ref.child(date).child(parentKey).child('child').set(push_snapshot.key);
                                        }
                                    }
                                }
                            });
                        }
                        parent_arr.push(push_snapshot.key);
                    });
                    succes++;
                }
                // 非重複性預約則結束迴圈
                if(requestObject.repeat == 'none') {
                    break;
                // 判斷是否已到終止日期
                } else {
                    // console.log('重複直到: ' + new Date(requestObject.repeat_end));
                    switch(requestObject.repeat) {
                        case 'daily':
                            begin.setDate(begin.getDate() + 1);
                            stop.setDate(stop.getDate() + 1);
                            break;
                        case 'weekly':
                            begin.setDate(begin.getDate() + 7);
                            stop.setDate(stop.getDate() + 7);
                            break;
                        case 'biweekly':
                            begin.setDate(begin.getDate() + 14);
                            stop.setDate(stop.getDate() + 14);
                            break;
                        case 'monthly':
                            begin.setMonth(begin.getMonth() + 1);
                            stop.setMonth(stop.getMonth() + 1);
                            break;
                        default:
                            res.status(403).send({
                                "message": "重複格式錯誤"
                            });
                            return;
                    }
                    // console.log(begin, stop);
                    if(new Date(requestObject.repeat_end) < stop) {
                        break;
                    }
                }
            }
            res.status(200).send({
                "message": '預約成功 - 筆數: ' + succes + ', 預約失敗 - 筆數: ' + fail
            });
        });
    } else {
        res.status(403).send({
            "message": '缺少' + lack_fields.join(', ') + '欄位'
        });
    }
});

/* 獲得全部物品預約資訊 */
router.get('/reservation', function(req, res) {
    ref = req.database.ref('/reservation');
    ref.once('value').then(function(snapshot) {
        let reservation = snapshot.val();
        res.status(200).send(reservation);
    });
});


/* 物品新增刪除修改 */

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
    let verify_fields = ["itemName", "imgSrc", "itemRule", "type"];
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