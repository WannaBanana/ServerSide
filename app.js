var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var linebot = require('linebot');
var admin = require("firebase-admin");
var helmet = require('helmet');
var fs = require('fs');
var cors = require('cors');

var routes = require('./routes/index');
var user = require('./routes/user');
var register = require('./routes/register');
var room = require('./routes/room');
var reservation = require('./routes/reservation');
var linebot = require('./routes/linebot');
var alert = require('./routes/alert');
var item = require('./routes/item');
var permission = require('./routes/permission');
var notify = require('./routes/notify');
var reverseProxy = require('./routes/reverseProxy');

var app = express();
app.use(cors());

const config = require('./ENV.json');
// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/xn--pss23c41retm.tw/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/xn--pss23c41retm.tw/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/xn--pss23c41retm.tw/chain.pem', 'utf8');
// firebase key
const key = require('./servicePrivateKey.json');

// 初始化 firebase 服務
admin.initializeApp({
    credential: admin.credential.cert(key),
    databaseURL: 'https://ncnusmartschool.firebaseio.com',
    databaseAuthVariableOverride: {
        uid: config.firebase_uid
    }
});

const database = admin.database();

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json({
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf.toString(encoding);
    },
    limit: "50mb"
}));
app.use(bodyParser.urlencoded({"extended": false, "limit": "50mb"}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

app.use(function(req, res, next) {
    req.database = database;
    next();
});

app.use('/', routes);
app.use('/api/user', user);
app.use('/api/register', register);
app.use('/api/room', room);
app.use('/api/reservation', reservation);
app.use('/api/linebot', linebot);
app.use('/api/alert', alert);
app.use('/api/item', item);
app.use('/api/permission', permission);
app.use('/api/notify', notify);
app.use('/reverseProxy',reverseProxy);

var autoOpen = require('./module/autoOpen')(database);
autoOpen.init();

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log(err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var httpServer = http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
});

var httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});

module.exports = app;
