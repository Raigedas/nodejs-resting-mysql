const express = require('express'),
    app = express(),
    bodyParser = require('body-parser');
    
const config = require('./Config');
const common = require('./Common');
var db = undefined;
var tableController = undefined;
var blobController = undefined;
var queryController = undefined;

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

exports.app = app;

exports.db = function() {
    if (!db) {
        db = require('./Db');
    }
    return db;
}

exports.tableController = function() {
    if (!tableController) {
        tableController = require('./controller/TableController');
    }
    return tableController;
}

exports.blobController = function() {
    if (!blobController) {
        blobController = require('./controller/BlobController');
    }
    return blobController;
}

exports.queryController = function() {
    if (!queryController) {
        queryController = require('./controller/QueryController');
    }
    return queryController;
}

exports.start = start;
