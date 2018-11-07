var express = require('express');
var router = express.Router();
var request = require('request');

router.get('/snapshot', function(req, res) {
    var options = {
        method: 'GET',
        url: 'http://163.22.32.200:3000/snapshot',
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


module.exports = router;