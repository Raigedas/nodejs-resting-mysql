'use strict';

const jwt = require('jsonwebtoken');
const fs = require('fs')
const os = require('os');

const common = require('../Common');
const util = require('../Util');
const db = require('./../Db');
const config = require('./../Config');



const privateKey = fs.readFileSync(os.homedir() + '/.ssh/id_rsa', 'utf8');
const publicKey = fs.readFileSync(os.homedir() + '/.ssh/id_rsa.pub.pem', 'utf8');

function buildJwt(payload) {
    return jwt.sign(JSON.stringify(payload), privateKey, {algorithm: 'RS256'});
}

function verifyJwt(token, done) {
    jwt.verify(token, publicKey, {algorithms: ['RS256']}, done);
}


exports.auth = function(req, res, next) {
    if (req.path === '/' || req.path === '/login') return next();

    const authHeader = req.headers.authorization;
    if (authHeader === undefined) {
        res.status(401).send('please authenticate');
        return;
    }

    const authHeaderParts = authHeader.split(" ");
    if (!authHeaderParts || authHeaderParts.length < 1) {
        res.status(401).send('bad authentication data');
        return;
    }

    const token = authHeaderParts[1];

    verifyJwt(token, function(error, result) {
        if (error) {
            console.log('bad token: ' + token);
            res.status(403).send(error);
            return;
        }
        req.query.user = result;
        next();
    })
}


exports.login = function(req, res) {
    config.login(req, db, function(err, result) {
        if (err) {
            util.sendError(res, err);
            return;
        }
        res.send(buildJwt(common.convertObjectStyleToJs(result)));
    });
}
