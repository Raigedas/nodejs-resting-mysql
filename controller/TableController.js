'use strict';

const config = require('./../Config');
const common = require('../Common');
const util = require('../Util');
const queryController = require('./QueryController');
const stringUtils = require('../StringUtils');


exports.select = function(req, res) {
    const query = {};
    query.from = stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName);
    query.where = util.readJsonParameter(req.query.where, []);
    query.orderBy = util.readJsonParameter(req.query.orderBy, []);
    return queryController.querySelect(req, res, query);
};

exports.insert = function(req, res) {
    queryController.queryInsert(req, res, stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName), req.body);
};

exports.update = function(req, res) {
    queryController.queryUpdate(req, res, stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName), req.body);
};

exports.delete = function(req, res) {
    var subject = req.params.id;
    if (subject) {
        subject = util.wrapCurlyIfNeeded(subject);
        subject = JSON.parse(subject);
    }
    if (subject === undefined || subject === null || subject === '') {
        subject = req.body;
    }
    queryController.queryDelete(req, res, stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName), subject);
};
