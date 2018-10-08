var express = require('express');
var router = express.Router();

/* 獲得單獨空間預約資訊 */
router.get('/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    ref = req.database.ref('/reservation');
    ref.once("value").then(function(snapshot) {
        let reservationObject = snapshot.val();
        if(reservationObject.hasOwnProperty(department)) {
            ref = req.database.ref('/reservation/' + department);
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
/* 獲得各院空間預約資訊 */
router.get('/:department', function(req, res) {
    let department = req.params.department;
    ref = req.database.ref('/reservation');
    ref.once("value").then(function(snapshot) {
        let reservationObject = snapshot.val();
        if(reservationObject.hasOwnProperty(department)) {
            res.status(200).send(reservationObject[department]);
        } else {
            res.status(404).send('找不到該院別資料');
        }
    });
});
/* 獲得全部空間預約資訊 */
router.get('/', function(req, res) {
    ref = req.database.ref('/reservation');
    ref.once('value').then(function(snapshot) {
        let reservation = snapshot.val();
        res.status(200).send(reservation);
    });
});

/* 預約 */
router.post('/:department/:space', function(req, res) {
    let department = req.params.department;
    let space = req.params.space;
    let requestObject = req.body;
    let verify_fields = ["name", "phone", "describe", "type", "start", "end", "repeat", "repeat_end", "conflict"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!requestObject.hasOwnProperty(verify_fields[key])) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        let reservationCurrent = undefined;
        ref = req.database.ref('/reservation/' + department + '/' + space + '/');
        ref.once('value').then(function(snapshot) {
            // 如果有資料的情況
            if(snapshot.hasChildren()) {
                reservationCurrent = snapshot.val();
            }
        });
        // 防止時間顛倒
        if(new Date(requestObject.start) > new Date(requestObject.end) ) {
            [requestObject.start, requestObject.end] = [requestObject.end, requestObject.start];
        }
        // 檢查衝突, 在禁止衝突的情況
        let begin = new Date(requestObject.start);
        let stop = new Date(requestObject.end);
        // 不允許衝突情況下需檢查衝突
        if(requestObject.conflict == false) {
            while(reservationCurrent != undefined) {
                let date = new Date(begin).toISOString().slice(0, 10);
                if(reservationCurrent[date] != undefined) {
                    for(key in reservationCurrent[date]) {
                        // 若開始時間是已經被預約的期間, 則回傳時間衝突
                        if(new Date(reservationCurrent[date][key].start) <= begin && new Date(reservationCurrent[date][key].start) > stop) {
                            res.status(403).send({
                                "message": "時間衝突"
                            });
                            return;
                        }
                    }
                }
                // 非重複性即可結束判斷
                if(requestObject.repeat == 'none') {
                    break;
                } else if(new Date(requestObject.repeat_end) > begin) {
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
                } else {
                    break;
                }
            }
        }
        // 插入預約
        let parentKey = undefined;
        [begin, stop] = [new Date(requestObject.start), new Date(requestObject.end)];
        while(reservationCurrent != undefined) {
            // (年 / 月 / 日)來作為該天預約索引值
            let date = new Date(begin).toISOString().slice(0, 10);
            // 用來判斷是否有衝突
            let conflict = false;
            ref = req.database.ref('/reservation/' + department + '/' + space + '/' + date);
            if(reservationCurrent[date] != undefined) {
                for(key in reservationCurrent[date]) {
                    if(new Date(reservationCurrent[date][key].start) <= begin && new Date(reservationCurrent[date][key].start) > stop) {
                        conflict = true;
                    }
                }
            }
            if(conflict == false) {
                // 預先填入資料
                let object = {
                    "name": requestObject.name,
                    "phone": requestObject.phone,
                    "describe": requestObject.describe,
                    "type": requestObject.type,
                    "start": begin,
                    "end": stop,
                };
                // 如果是重複性預約, 則 repeat 值為 true, 反之
                if(requestObject.repeat != 'none') {
                    object["repeat"] = true;
                } else {
                    object["repeat"] = false;
                }
                // 如果有父預約 Key 則帶上該值, 第一筆預約沒有上層, 故 repeat 為 true 且無 parent 屬性
                if(parentKey != undefined) {
                    object["parent"] = parentKey;
                }
                parentKey = ref.push(object).key;
            }
            // 非重複性預約則結束迴圈
            if(requestObject.repeat == 'none') {
                break;
            // 判斷是否已到終止日期
            } else if(new Date(requestObject.repeat_end) > begin) {
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
            } else {
                break;
            }
        }
    } else {
        res.status(403).send({
            "message": '缺少' + lack_fields.join(', ') + '欄位'
        });
    }
});

/* 修改預約 */
router.patch('/:department/:space/:key', function(req, res) {
    let key = req.params.key;
    let department = req.params.department;
    let space = req.params.department;
    let requestObject = req.body;
    let verify_fields = ["describe", "type", "start", "end"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!requestObject.hasOwnProperty(verify_fields[key])) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        ref = req.database.ref('/reservation/' + department + '/' + space + '/');
        ref.once('value').then(function(snapshot) {
            let spaceReservation = snapshot.val();
            for(let date in spaceReservation) {
                for(let self_key in spaceReservation[date]) {
                    if(self_key == key) {
                        // 檢查是否衝突
                        for(let item in spaceReservation[date]) {
                            if(new Date(reservationCurrent[date][item].start) <= new Date(requestObject.start) && new Date(reservationCurrent[date][item].start) > new Date(requestObject.end)) {
                                res.status(403).send({
                                    "message": "時間衝突"
                                });
                                return;
                            }
                        }
                        // 更新
                        ref = req.database.ref('/reservation/' + department + '/' + space + '/' + date + '/' + self_key);
                        ref.once('value').then(function(targetSnapshot) {
                            let targetObject = targetSnapshot.val();
                            targetObject["describe"] = requestObject.describe;
                            targetObject["type"] = requestObject.type;
                            targetObject["start"] = requestObject.start;
                            targetObject["end"] = requestObject.end;
                            ref.set(targetObject);
                            res.status(200).send({
                                "message": "更新成功"
                            });
                        });
                    }
                }
            }
        });
    } else {
        res.status(403).send({
            "message": '缺少' + lack_fields.join(', ') + '欄位'
        });
    }
});

/* 刪除預約 */
router.delete('/:department/:space/:key', function(req, res) {
    let key = req.params.key;
    let department = req.params.department;
    let space = req.params.department;
    let requestObject = req.body;
    let verify_fields = ["deleteRepeat"];
    let lack_fields = [];
    for(let key in verify_fields) {
        if(!requestObject.hasOwnProperty(verify_fields[key])) {
            lack_fields.push(verify_fields[key]);
        }
    }
    if(lack_fields.length == 0) {
        let parentID = undefined;
        ref = req.database.ref('/reservation/' + department + '/' + space + '/');
        ref.once('value').then(function(snapshot) {
            let spaceReservation = snapshot.val();
            for(let date in spaceReservation) {
                for(let self_key in spaceReservation[date]) {
                    if(self_key == key) {
                        ref.child(date).child(self_key).remove();
                        parentID = self_key;
                    }
                }
            }
            if(parentID == undefined) {
                res.status(404).send({
                    "message": "找不到該筆預約資料"
                });
                return;
            }
            if(requestObject.deleteRepeat == true) {
                for(let date in spaceReservation) {
                    for(let self_key in spaceReservation[date]) {
                        if(spaceReservation[date][self_key].parent == parentID) {
                            ref.child(date).child(self_key).remove();
                            parentID = self_key;
                        }
                    }
                }
            }
            res.status(200).send({
                "message": "刪除成功"
            });
        });
    } else {
        res.status(403).send({
            "message": '缺少' + lack_fields.join(', ') + '欄位'
        });
    }
});

module.exports = router;
