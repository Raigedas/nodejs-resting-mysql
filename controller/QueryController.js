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

function prepareArgument(value, defaultValue) {
    if (value) {
        if (typeof value === 'string') {
            value = JSON.parse(value);
        }
    } else {
        value = defaultValue;
    }
    return value;
}

function querySelect(req, res, select, froms, from, joins, where, orderBy) {
    froms = prepareArgument(froms, []);
    if (from) {
        if (typeof from === 'string') {
            try {
                from = JSON.parse(from);
            } catch (e) {
                from = {tableName: from};
            }
        }
        froms.push(from);
    }
    joins = prepareArgument(joins, []);
    joins.forEach(e => {
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
    if (where) {
        where = util.wrapCurlyIfNeeded(where);
        // console.log('select where input =' + where);
        where = JSON.parse(where);
    }

    where = util.wrapToArray(where);

    config.interceptors.preSelect.forEach(e => {
        if (!e(req, froms, joins, where)) {
            res.status(500).send('not authorized');
            return;
        }
    });

    if (select === undefined || select === null) {
        if (!joins || !joins.length) {
            select = '*';
        } else {
            select = '';
            froms.forEach((v, i) => {
                if (i > 0) {
                    select += ', ';
                }
                select += generateSelectColumns(v);
            })
            joins.forEach(v => {
                select += ', ' + generateSelectColumns(v);
            });
        }
    }

    // console.log('columns ' + JSON.stringify(tableColumns.getForTable(config.propertyNameConverter.toDb(from.tableName))) );

    // console.log('select from ' + JSON.stringify(froms) + ' where=' + JSON.stringify(where) 
    //         );

    var q = 'SELECT ' + select + ' ';
    q += 'FROM ';
    froms.forEach((v, i) => {
        if (i > 0) {
            q += ', ';
        }
        q += config.propertyNameConverter.toDb(v.tableName) 
                + (v.alias ? ' ' + config.propertyNameConverter.toDb(v.alias) : '');
    })
    q += ' ';
    joins.forEach(e => {
        // console.log('join ' + JSON.stringify(e) );
        q += e.joinType + ' ' 
                + config.propertyNameConverter.toDb(e.tableName) 
                + (e.alias ? ' ' + config.propertyNameConverter.toDb(e.alias) : '') 
                + ' ON ' + conditionBuilder.build(e.on) + ' ';
    });
    if (where) {
        q += 'WHERE ' + conditionBuilder.build(where);
    }
    
    return db.promisedQuery(q, [])
        .then((rows)=>{
            var r = rows;
            if ((froms.length + joins.length) > 1) {
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
                        row[columnName] = undefined;
                    })
                });
            } else {
                r.forEach((row) => {
                    var columnNames = Object.getOwnPropertyNames(row);
                    columnNames.forEach((columnName) => {
                        row[config.propertyNameConverter.toJs(columnName)] = util.checkNull(row[columnName]);
                        row[columnName] = undefined;
                    })
                });
            }
            config.interceptors.postSelect.forEach(e => {
                r = e(req, froms, joins, r);
            });
            res.send(r);
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send(err);
        });
};

function selectRequest(req, res) {
    var select = req.query.select;
    var froms = req.query.froms;
    var from = req.query.from;
    var joins = req.query.joins;
    var where = req.query.where;

    return querySelect(req, res, select, froms, from, joins, where, null);
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
