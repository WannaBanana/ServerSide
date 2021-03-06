var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require("fs");
var imagemin = require('imagemin');
var imageminPngquant = require('imagemin-pngquant');

var image2base64 = require('image-to-base64');

router.get('/snapshot', function(req, res) {
    image2base64("http://163.22.32.200:3000/snapshot")
    .then(
        (response) => {
            res.status(200).send('data:image/png;base64,' + response);
        }
    )
    .catch(
        (error) => {
            console.log(error); //Exepection error....
            res.status(500).send(error);
        }
    )
});

router.get('/originSnapshot', function(req, res) {
    image2base64("http://163.22.32.200:3000/snapshot")
    .then(
        (response) => {
            fs.writeFile("./public/images/out.png", response, 'base64', function(err) {
                if(err) {
                    console.log(err);
                    return;
                }
                imagemin(['./public/images/out.png'], 'build/images', {use: [imageminPngquant()]}).then(() => {
                    res.status(200).send({"message": "success"});
                });
            });
        }
    )
    .catch(
        (error) => {
            console.log(error); //Exepection error....
            res.status(500).send(error);
        }
    )
});

router.get('/door', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/door',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.post('/door', function(req, res) {
    var options = {
        method: 'POST',
        url: 'http://163.22.32.200:3000/door',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.put('/door', function(req, res) {
    var options = {
        method: 'PUT',
        url: 'http://163.22.32.200:3000/door',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }

        res.status(response.statusCode).send(body);
    });
});

router.patch('/door', function(req, res) {
    var options = {
        method: 'PATCH',
        url: 'http://163.22.32.200:3000/door',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }

        res.status(response.statusCode).send(body);
    });
});

router.delete('/door', function(req, res) {
    var options = {
        method: 'DELETE',
        url: 'http://163.22.32.200:3000/door',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }

        res.status(response.statusCode).send(body);
    });
});

/* glass */

router.get('/glass', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/glass',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.put('/glass', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/glass',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.patch('/glass', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/glass',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.delete('/glass', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/glass',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

/* rfid */

router.get('/rfid', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/rfid',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.put('/rfid', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/rfid',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.patch('/rfid', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/rfid',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

router.delete('/rfid', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/rfid',
        headers:
        { 'Content-Type': 'application/json' },
        body: req.body,
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(response.statusCode).send(response);
            throw new Error(error);
        }
        res.status(response.statusCode).send(body);
    });
});

module.exports = router;