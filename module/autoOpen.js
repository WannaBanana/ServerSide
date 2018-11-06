var request = require('request');

module.exports = function (database) {

    var module = {};

    // 儲存已開啟過的空間
    var alreadyOpen = [];
    // 存放 setInterval 物件
    var timer = undefined;
    var ref = database.ref('/reservation');
    var space_ref = undefined;

    function _check() {
        ref.once("value").then(function(snapshot) {
            let reservationObject = snapshot.val();
            if(reservationObject) {
                let date = new Date().toISOString().slice(0, 10);
                for(let department in reservationObject) {
                    for(let space in reservationObject[department]) {
                        if(reservationObject[department][space][date]) {
                            console.log('有預約');
                            for(let key in reservationObject[department][space][date]) {
                                console.log(department, space, date, key, alreadyOpen);
                                if(alreadyOpen.indexOf(key) != -1) {
                                    console.log('有已經開啟的');
                                    if(new Date() > new Date(reservationObject[department][space][date][key].end)) {
                                        console.log('已過期');
                                        // 獲取 ip
                                        space_ref = database.ref('/space/' + department + '/' + space);
                                        space_ref.once("value").then(function(snapshot) {
                                            let spaceObject = snapshot.val();
                                            if(spaceObject && spaceObject.address) {
                                                // 發送關門
                                                var options = {
                                                    method: 'POST',
                                                    url: 'http://' + spaceObject.address + ':3000/door',
                                                    headers:
                                                    { 'Content-Type': 'application/json' },
                                                    body:
                                                    {
                                                        method: 'close'
                                                    },
                                                    json: true
                                                };

                                                request(options, function (error, response, body) {
                                                    if (error) {
                                                        throw new Error(error);
                                                    } else {
                                                        // 陣列移除
                                                        alreadyOpen.splice(alreadyOpen.indexOf(key), 1);
                                                    }
                                                });
                                            } else {
                                                console.log('查無空間');
                                            }
                                        });
                                    }
                                } else {
                                    if(new Date() > new Date(reservationObject[department][space][date][key].start)) {
                                        console.log('已開始');
                                        // 發送開門
                                        var options = {
                                            method: 'POST',
                                            url: 'http://' + spaceObject.address + ':3000/door',
                                            headers:
                                            { 'Content-Type': 'application/json' },
                                            body:
                                            {
                                                method: 'open'
                                            },
                                            json: true
                                        };

                                        request(options, function (error, response, body) {
                                            if (error) {
                                                throw new Error(error);
                                            } else {
                                                // 推入陣列
                                                alreadyOpen.push(key);
                                            }
                                        });
                                    }
                                }
                            }
                        } else {
                            console.log('無預約');
                        }
                    }
                }
            }
        });
    }

    module.init = function () {
        timer = setInterval(_check, 60000);
    };

    module.destory = function () {
        clearInterval(timer);
        timer = undefined;
    };

    return module;
};