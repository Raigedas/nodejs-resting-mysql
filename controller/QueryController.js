'use strict';

const config = require('./../Config');
const queryConditionBuilder = require('./QueryBuilderCondition');
const conditionBuilder = require('./ConditionBuilder');
const common = require('../Common');
const util = require('../Util');
const db = require('./../Db');
const tableDefinitions = require('./TableDefinitions');
const stringUtils = require('../StringUtils');


function generateSelectColumns(table) {
    var alias = table.alias !== undefined && table.alias !== '' ? config.propertyNameConverter.toDb(table.alias) : undefined;
    var columnDefinitions = tableDefinitions.getForTable(config.propertyNameConverter.toDb(table.tableName));
    var columnNames = Object.getOwnPropertyNames(columnDefinitions);
    let columnExcludes = [];
    if (table.excludes) {
        columnExcludes = table.excludes.map(i => config.propertyNameConverter.toDb(i));
    }
    var r = '';
    columnNames.forEach((columnName) => {
        if (columnExcludes.includes(columnName)) {
            return;
        }
        if (r !== '') {
            r += ', ';
        }
        if (alias !== undefined) {
            r += alias + '.' + columnName + ' AS ' + "'" + alias + '.' + columnName + "'";
        } else {
            r += columnName;
        }
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

function removePropertys(toRemovePropertys, entity) {
    toRemovePropertys.forEach(i => {
        delete entity[i];
    });
}

function removeExtraPropertysByTable(tableName, entity) {
    var tableColumnNames = tableDefinitions.getColumnsForTable(config.propertyNameConverter.toDb(tableName));
    const propertyNames = Object.getOwnPropertyNames(entity);
    propertyNames.forEach(v => {
        const columnName = config.propertyNameConverter.toDb(v);
        if (!tableColumnNames.includes(columnName)) {
            delete entity[v];
        }
    });
}

function findInsertColumns(tableName, entity) {
    const propertyNames = Object.getOwnPropertyNames(entity);
    var r = [];
    propertyNames.forEach(v => {
        r.push(config.propertyNameConverter.toDb(v));
    });
    return r;
}

function generateInsertColumns(columnNames) {
    var r = '';
    columnNames.forEach(columnName => {
        if (r !== '') {
            r += ', ';
        }
        r += columnName;
    });
    return r;
}

function generateInsertPlaceHolders(columnNames) {
    var r = '';
    columnNames.forEach(columnName => {
        if (r !== '') {
            r += ', ';
        }
        r += '?';
    });
    return r;
}

function generateInsertValuesArray(entity) {
    const propertyNames = Object.getOwnPropertyNames(entity);
    var r = [];
    propertyNames.forEach(v => {
        r.push(entity[v]);
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

function queryInsert(req, res, tableName, entity, autogeneratedPropertys, blobProperty) {
    if (blobProperty === null) {
        blobProperty = undefined;
    }
    config.interceptors.preInsert.forEach(e => {
        if (!(entity = e(req, tableName, entity, autogeneratedPropertys, blobProperty))) {
            res.status(403).send('not authorized');
            return;
        }
    });
    let blobColumn = undefined;
    let blob = undefined;
    if (blobProperty !== undefined) {
        blobColumn = config.propertyNameConverter.toDb(blobProperty);
        blob = entity[blobProperty];
        delete entity[blobProperty];
    }
    removeExtraPropertysByTable(tableName, entity);
    removePropertys(autogeneratedPropertys, entity);
    const columnNames = findInsertColumns(tableName, entity);
    if (blob !== undefined) {
        columnNames.push(config.propertyNameConverter.toDb(blobProperty));
    }

    var q = 'INSERT INTO ';
    q += config.propertyNameConverter.toDb(tableName);
    q += ' (';
    q += generateInsertColumns(columnNames);
    q += ') ';
    q += ' VALUES(';
    q += generateInsertPlaceHolders(columnNames);
    q += ') ';

    const insertValues = generateInsertValuesArray(entity);
    if (blob !== undefined) {
        insertValues.push(blob);
    }

    console.log('doInsert ' + q +' , ' + insertValues.length + ' value(s)');

    return db.promisedQuery(q, insertValues)
        .then((rows) => {
            const selectQuery = {};
            selectQuery.from = {tableName};
            if (blobProperty !== undefined) {
                selectQuery.from.excludes = [blobProperty];
            }
            selectQuery.where = conditionBuilder.buildConditionForPk(tableName, entity);
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

    var where = conditionBuilder.buildConditionForPk(tableName, entity);

    var q = 'DELETE FROM ';
    q += config.propertyNameConverter.toDb(tableName);
    q += ' ';
    q += 'WHERE ';
    q += queryConditionBuilder.build(where);
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

function queryUpdate(req, res, tableName, autogeneratedPropertys, entity) {
    config.interceptors.preUpdate.forEach(e => {
        if (!(entity = e(req, tableName, autogeneratedPropertys, entity))) {
            res.status(403).send('not authorized');
            return;
        }
    });

    var where = conditionBuilder.buildConditionForPk(tableName, entity);

    removePropertys(autogeneratedPropertys, entity);

    var q = 'UPDATE ';
    q += config.propertyNameConverter.toDb(tableName);
    q += ' ';
    q += 'SET ';
    q += generateAssignments(tableName, entity);
    q += ' ';
    q += 'WHERE ';
    q += queryConditionBuilder.build(where);
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

function querySelectSingle(req, res, tableName, autogeneratedPropertys, entity, triggerPreSelectInterceptors = true, selectResultProcessor = processSelectResultAsRowset) {
    config.interceptors.preSelectSingle.forEach(e => {
        if (!(entity = e(req, tableName, autogeneratedPropertys, entity))) {
            res.status(403).send('not authorized');
            return;
        }
    });

    var where = conditionBuilder.buildConditionForPk(tableName, entity);

    var q = 'SELECT * ';
    q += 'FROM ';
    q += config.propertyNameConverter.toDb(tableName);
    q += ' ';
    q += 'WHERE ';
    q += queryConditionBuilder.build(where);

    console.log('querySelectSingle ' + q +' ');

    selectResultProcessor(req, res, null, db.promisedQuery(q, []));
};

function querySelect(req, res, query, triggerPreSelectInterceptors = true, selectResultProcessor = processSelectResultAsRowset) {
    console.log('querySelect: ' + JSON.stringify(query) );
    if (typeof query === 'string') {
        query = JSON.parse(query);
    }
    query.froms = defaultIfNone(query.froms, []);
    if (query.from) {
        if (typeof query.from === 'string') {
            query.from = {tableName: query.from};
        }
        if (query.excludes !== undefined) {
            query.from.excludes = query.excludes;
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
        if (query.tables.length <= 1 && (query.tables[0].excludes === undefined || !query.tables[0].excludes.length)) {
            query.select = '*';
        } else {
            query.select = '';
            query.tables.forEach((v, i) => {
                if (i > 0) {
                    query.select += ', ';
                }
                query.select += generateSelectColumns(v);
            })
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
                + ' ON ' + queryConditionBuilder.build(e.on) + ' ';
    });
    if (query.where) {
        q += 'WHERE ' + queryConditionBuilder.build(query.where);
    }
    
    selectResultProcessor(req, res, query, db.promisedQuery(q, []));
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

function processSelectResultAsBlob(req, res, query, queryPromise) {
    queryPromise.then((rows)=>{
        if (rows.length) {
            const row = rows[0];
            const columnName = config.propertyNameConverter.toDb(req.query.blobProperty);
            let contentType = req.query.contentType;
            if (contentType === undefined) {
                const contentTypeTemplate = req.query.contentTypeTemplate;
                const dataTypePropery = req.query.dataTypePropery;
                if (contentTypeTemplate !== undefined && dataTypePropery !== undefined) {
                    const dataType = row[config.propertyNameConverter.toDb(dataTypePropery)];
                    contentType = stringUtils.format(contentTypeTemplate, [dataType]);
                }
            }
            if (contentType !== undefined) {
                res.set('Content-Type', contentType);
            }

            // res.set('Content-Length', 'image/' + binaryData.readableLength);
            res.send(row[columnName]);
        } else {
            res.status(404).send('no such record');
        }
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send(err);
    });
}

function selectRequest(req, res) {
    querySelect(req, res, req.query.query);
};


exports.processSelectResultAsBlob = processSelectResultAsBlob;

exports.queryInsert = queryInsert;

exports.queryDelete = queryDelete;

exports.queryUpdate = queryUpdate;

exports.querySelect = querySelect;

exports.selectRequest = selectRequest;

exports.querySelectSingle = querySelectSingle;


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
