'use strict';

const config = require('./../Config');
const conditionBuilder = require('./QueryBuilderCondition');
const common = require('../Common');
const util = require('../Util');
const db = require('./../Db');
const queryController = require('./QueryController');


exports.select = function(req, res) {
    const query = {};
    query.from = req.params.tableName;
    query.where = util.readJsonParameter(req.query.where, []);
    query.orderBy = util.readJsonParameter(req.query.orderBy, []);
    return queryController.querySelect(req, res, query);
};

exports.insert = function(req, res) {
    commonController.insert(req, res, dao, rowToObject);
};

exports.update = function(req, res) {
    commonController.updatePrimitives(req, res, dao);
};

exports.delete = function(req, res) {
    commonController.delete(req, res, dao);
};

exports.query = function(req, res) {
    commonController.delete(req, res, dao);
};
