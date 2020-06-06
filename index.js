const express = require('express'),
    app = express(),
    bodyParser = require('body-parser');
    
const config = require('./Config');
const common = require('./Common');

function start() {
    const port = config.port || process.env.PORT || 3000;
    app.listen(port, '0.0.0.0');

    console.log('Server started on: ' + port);
    
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(bodyParser.raw({type: 'application/octet-stream', limit: '100mb'}))
    
    var routes = require('./routes'); 
    
    routes(app);    
}

exports.config = config;

exports.common = common;
exports.util = require('./Util');

exports.start = start;
