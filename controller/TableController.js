'use strict';

const config = require('./../Config');
const common = require('../Common');
const util = require('../Util');
const queryController = require('./QueryController');
const stringUtils = require('../StringUtils');

const PayloadEntityHeaderName = 'payload-entity';


exports.select = function(req, res) {
    const query = {};
    query.from = stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName);
    query.excludes = util.readJsonParameterArray(req.query.excludes);
    query.where = util.readJsonParameter(req.query.where, []);
    query.orderBy = util.readJsonParameter(req.query.orderBy, []);
    return queryController.querySelect(req, res, query);
};

exports.insert = function(req, res) {
    let entity = undefined;
    if ((entity = req.query.entity) !== undefined) {
        entity = util.readJsonParameter(entity, {});
    } else if ((entity = req.headers[PayloadEntityHeaderName]) !== undefined) {
        entity = util.readJsonParameter(entity, {});
    } else {
        entity = req.body;
    }
    const tableName = stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName);
    const blobProperty = req.query.blobProperty;
    if (blobProperty !== undefined) {
        entity[blobProperty] = req.body;
    }
    queryController.queryInsert(req, res, tableName, entity, blobProperty);
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
