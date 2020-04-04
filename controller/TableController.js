'use strict';

const config = require('./../Config');
const conditionBuilder = require('./QueryBuilderCondition');
const common = require('../Common');
const util = require('../Util');
const db = require('./../Db');


exports.select = function(req, res) {
    const tableName = req.params.tableName;
    var where = req.query.where;
    if (where) {
        where = util.wrapCurlyIfNeeded(where);
        // console.log('select where input =' + where);
        where = JSON.parse(where);
    }

    where = util.wrapToArray(where);

    config.interceptors.preSelect.forEach(e => {
        if (!e(req, tableName, where)) {
            res.status(500).send('not authorized');
            return;
        }
    });
    

    console.log('select from ' + tableName + ' where=' + JSON.stringify(where));
    const whereString = where ? 'WHERE ' + conditionBuilder.build(where) : '';

    return db.promisedQuery(`
            SELECT *
            FROM ${config.propertyNameConverter.toDb(tableName)}
            ${whereString}
            `, 
            [])
        .then((rows)=>{
            res.send(common.convertObjectsStyleToJs(rows));
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send(err);
        });
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
