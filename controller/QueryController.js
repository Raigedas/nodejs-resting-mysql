'use strict';

const config = require('./../Config');
const conditionBuilder = require('./QueryBuilderCondition');
const common = require('../Common');
const util = require('../Util');
const db = require('./../Db');
const tableDefinitions = require('./TableDefinitions');


function generateSelectColumns(table) {
    var alias = config.propertyNameConverter.toDb(table.alias);
    var columnDefinitions = tableDefinitions.getForTable(config.propertyNameConverter.toDb(table.tableName));
    var columnNames = Object.getOwnPropertyNames(columnDefinitions);
    var r = '';
    columnNames.forEach((v, i) => {
        if (i > 0) {
            r += ', ';
        }
        r += alias + '.' + v + ' AS ' + "'" + alias + '.' + v + "'";
    });
    return r;
}

function defaultIfNone(value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return value;
}

function querySelect(req, res, query) {
    if (typeof query === 'string') {
        query = JSON.parse(query);
    }
    query.froms = defaultIfNone(query.froms, []);
    if (query.from) {
        if (typeof query.from === 'string') {
            query.from = {tableName: query.from};
        }
        query.froms.push(query.from);
        delete query.from;
    }
    query.joins = defaultIfNone(query.joins, []);
    query.joins.forEach(e => {
        if (!e.on) {
            e.on = e.condition;
        }
        if (!e.joinType) {
            e.joinType = 'INNER';
        }
        e.joinType = e.joinType.toUpperCase();
        if (!e.joinType.includes(' ')) {
            e.joinType = e.joinType + ' JOIN';
        }
    });
    query.tables = query.froms.concat(query.joins);
    query.where = util.wrapToArray(query.where);

    config.interceptors.preSelect.forEach(e => {
        if (!e(req, query)) {
            res.status(500).send('not authorized');
            return;
        }
    });

    if (query.select === undefined || query.select === null) {
        if (query.tables.length <= 1) {
            query.select = '*';
        } else {
            query.select = '';
            query.froms.forEach((v, i) => {
                if (i > 0) {
                    query.select += ', ';
                }
                query.select += generateSelectColumns(v);
            })
            query.joins.forEach(v => {
                query.select += ', ' + generateSelectColumns(v);
            });
        }
    }

    // console.log('columns ' + JSON.stringify(tableColumns.getForTable(config.propertyNameConverter.toDb(from.tableName))) );

    // console.log('select from ' + JSON.stringify(froms) + ' where=' + JSON.stringify(where) 
    //         );

    var q = 'SELECT ' + query.select + ' ';
    q += 'FROM ';
    query.froms.forEach((v, i) => {
        if (i > 0) {
            q += ', ';
        }
        q += config.propertyNameConverter.toDb(v.tableName) 
                + (v.alias ? ' ' + config.propertyNameConverter.toDb(v.alias) : '');
    })
    q += ' ';
    query.joins.forEach(e => {
        // console.log('join ' + JSON.stringify(e) );
        q += e.joinType + ' ' 
                + config.propertyNameConverter.toDb(e.tableName) 
                + (e.alias ? ' ' + config.propertyNameConverter.toDb(e.alias) : '') 
                + ' ON ' + conditionBuilder.build(e.on) + ' ';
    });
    if (query.where) {
        q += 'WHERE ' + conditionBuilder.build(query.where);
    }
    
    return db.promisedQuery(q, [])
        .then((rows)=>{
            var r = rows;
            if (query.tables.length > 1) {
                r.forEach((row) => {
                    var columnNames = Object.getOwnPropertyNames(row);
                    columnNames.forEach((columnName) => {
                        const parts = columnName.split('.');
                        const objectName = config.propertyNameConverter.toJs(parts[0]);
                        const objectPropertyName = config.propertyNameConverter.toJs(parts[1]);
                        if (row[objectName] === undefined) {
                            row[objectName] = {};
                        }
                        row[objectName][objectPropertyName] = util.checkNull(row[columnName]);
                        delete row[columnName];
                    })
                });
            } else {
                r.forEach((row) => {
                    var columnNames = Object.getOwnPropertyNames(row);
                    columnNames.forEach((columnName) => {
                        row[config.propertyNameConverter.toJs(columnName)] = util.checkNull(row[columnName]);
                        delete row[columnName];
                    })
                });
            }
            config.interceptors.postSelect.forEach(e => {
                r = e(req, query, r);
            });
            res.send(r);
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send(err);
        });
};

function selectRequest(req, res) {
    return querySelect(req, res, req.query.query);
};


exports.querySelect = querySelect;

exports.selectRequest = selectRequest;


exports.find = function(req, res) {
    const entity = common.wrapIdToObject(req.params.id);
    dao.getById(req.query.forUser, entity)
        .then((rows)=>{
            if (rows.length) {
                const row = rows[0];
                const binaryData = row.BINARY_DATA;
                res.set('Content-Type', 'image/' + row.FORMAT);
                // res.set('Content-Length', 'image/' + binaryData.readableLength);
                res.send(binaryData);
            } else {
                res.status(404).send('no such image');
            }
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send(err);
        });
    commonController.getAll(req, res, dao, rowsToObject);
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
