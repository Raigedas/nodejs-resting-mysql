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

function convertNamesForSelectColumns(query) {
    const elements = query.select.split(',');
    const table = query.froms[0];
    let r = '';
    elements.forEach((element,i) => {
        if (i > 0) {
            r += ', ';
        }
        const parts = element.split('.');
        if (parts.length > 1) {
            const columnName = config.propertyNameConverter.toDb(parts[1]);
            const tableName = query.tables.find(i => i.alias === parts[0]).tableName;
            var columnDefinitions = tableDefinitions.getForTable(config.propertyNameConverter.toDb(tableName));
            r += config.propertyNameConverter.toDb(parts[0]) + '.';
            r += columnDefinitions[columnName] !== undefined ? columnName : parts[1];
        } else {
            const columnName = config.propertyNameConverter.toDb(parts[0]);
            var columnDefinitions = tableDefinitions.getForTable(config.propertyNameConverter.toDb(table.tableName));
            r += columnDefinitions[columnName] !== undefined ? columnName : parts[0];
        }
    });
    return r;
}

function countSelectTables(select) {
    const elements = select.split(',');
    const r = {};
    elements.forEach(element => {
        const parts = element.split('.');
        const tableName = parts.length > 1 ? parts[0] : '_default_';
        if (r[tableName]) {
            r[tableName]++;
        } else {
            r[tableName] = 1;
        }
    });
    return Object.getOwnPropertyNames(r).length;
}

function generateInsertColumns(tableName, entity) {
    var tableColumnNames = tableDefinitions.getColumnsForTable(config.propertyNameConverter.toDb(tableName));
    const propertyNames = Object.getOwnPropertyNames(entity);
    var r = '';
    var i = 0;
    propertyNames.forEach(v => {
        const columnName = config.propertyNameConverter.toDb(v)
        if (tableColumnNames.indexOf(columnName) < 0) {
            return;
        }
        if (i > 0) {
            r += ', ';
        }
        r += columnName;
        i++;
    });
    return r;
}

function generateInsertValues(tableName, entity) {
    var tableColumnNames = tableDefinitions.getColumnsForTable(config.propertyNameConverter.toDb(tableName));
    const propertyNames = Object.getOwnPropertyNames(entity);
    var r = '';
    var i = 0;
    propertyNames.forEach(v => {
        const columnName = config.propertyNameConverter.toDb(v)
        if (tableColumnNames.indexOf(columnName) < 0) {
            return;
        }
        if (i > 0) {
            r += ', ';
        }
        r += util.formatQueryValue(entity[v]);
        i++;
    });
    return r;
}

function generateAssignments(tableName, entity) {
    var columnNames = tableDefinitions.getColumnsForTable(config.propertyNameConverter.toDb(tableName));
    const pkColumns = tableDefinitions.getPkForTable(config.propertyNameConverter.toDb(tableName));
    columnNames = columnNames.filter(v => pkColumns.indexOf(v) < 0 );
    
    var r = '';
    var i = 0;
    columnNames.forEach((columnName) => {
        const propertyValue = entity[config.propertyNameConverter.toJs(columnName)];
        if (propertyValue === undefined) {
            return;
        }
        if (i > 0) {
            r += ', ';
        }
        r += columnName + ' = ' + util.formatQueryValue(propertyValue);
        i++;
    });
    return r;
}

function defaultIfNone(value, defaultValue) {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return value;
}

function generateConditionsForPk(tableName, entity) {
    const pkColumns = tableDefinitions.getPkForTable(config.propertyNameConverter.toDb(tableName));
    const r = [];
    pkColumns.forEach(pkColumn => {
        const condition = {};
        const pkProperty = config.propertyNameConverter.toJs(pkColumn);
        condition[pkProperty] = entity[pkProperty];
        r.push(condition)
    });
    return r;
}

function queryInsert(req, res, tableName, entity) {
    config.interceptors.preInsert.forEach(e => {
        if (!(entity = e(req, tableName, entity))) {
            res.status(403).send('not authorized');
            return;
        }
    });

    var q = 'INSERT INTO ';
    q += config.propertyNameConverter.toDb(tableName);
    q += ' (';
    q += generateInsertColumns(tableName, entity);
    q += ') ';
    q += ' VALUES(';
    q += generateInsertValues(tableName, entity);
    q += ') ';
    console.log('doInsert ' + q +' ');
    return db.promisedQuery(q)
        .then((rows) => {
            const selectQuery = {};
            selectQuery.from = tableName;
            selectQuery.where = generateConditionsForPk(tableName, entity);
            querySelect(req, res, selectQuery, false);
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send(err);
        });
}

function queryDelete(req, res, tableName, entity) {
    config.interceptors.preDelete.forEach(e => {
        if (!(entity = e(req, tableName, entity))) {
            res.status(403).send('not authorized');
            return;
        }
    });

    var where = generateConditionsForPk(tableName, entity);

    var q = 'DELETE FROM ';
    q += config.propertyNameConverter.toDb(tableName);
    q += ' ';
    q += 'WHERE ';
    q += conditionBuilder.build(where);
    console.log('queryDelete ' + q +' ');
    return db.promisedQuery(q)
        .then((rows) => {
            res.status(200).send({deleted: rows.affectedRows});
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send(err);
        });
}

function queryUpdate(req, res, tableName, entity) {
    config.interceptors.preUpdate.forEach(e => {
        if (!(entity = e(req, tableName, entity))) {
            res.status(403).send('not authorized');
            return;
        }
    });

    var where = generateConditionsForPk(tableName, entity);

    var q = 'UPDATE ';
    q += config.propertyNameConverter.toDb(tableName);
    q += ' ';
    q += 'SET ';
    q += generateAssignments(tableName, entity);
    q += ' ';
    q += 'WHERE ';
    q += conditionBuilder.build(where);
    console.log('queryUpdate ' + q +' ');
    return db.promisedQuery(q)
        .then((rows) => {
            res.status(200).send({updated: rows.affectedRows});
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).send(err);
        });
}

function querySelect(req, res, query, triggerPreSelectInterceptors = true) {
    console.log('querySelect: ' + JSON.stringify(query) );
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

    if (triggerPreSelectInterceptors) {
        config.interceptors.preSelect.forEach(e => {
            if (!e(req, query)) {
                res.status(403).send('not authorized');
                return;
            }
        });
    }

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
        query.selectTableCount = query.tables.length;
    } else {
        query.selectTableCount = countSelectTables(query.select);
        query.select = convertNamesForSelectColumns(query);
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
    
    processSelectResultAsRowset(req, res, query, db.promisedQuery(q, []));
};

function processSelectResultAsRowset(req, res, query, queryPromise) {
    queryPromise.then((rows)=>{
        var r = rows;
        if (query.selectTableCount > 1) {
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
}

function selectRequest(req, res) {
    querySelect(req, res, req.query.query);
};


exports.queryInsert = queryInsert;

exports.queryDelete = queryDelete;

exports.queryUpdate = queryUpdate;

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
