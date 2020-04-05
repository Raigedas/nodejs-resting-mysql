'use strict';

var Mysql = require('sync-mysql');

const config = require('../Config');


const tableDefinitions = {};
const tablePks = {};

function fetchColumns(tableName) {
    // console.log('fetch table definition for: ' + tableName);
    var connection = new Mysql(config.dbConnection);
    var rows = connection.query(`DESCRIBE ${tableName}`);
    var r = {};
    rows.forEach(e => {
        r[e['Field']] = {
            dataType: e['Type'],
            nullable: e['Null'] && e['Null'].toUpperCase() === 'YES',
            key: e['Key'],
            defaultValue: e['Default'],
        }
    });
    return r;
}

function fetchPkForTable(tableName) {
    const tableColumns = getForTable(tableName);
    var r = [];
    const propertyNames = Object.getOwnPropertyNames(tableColumns);
    propertyNames.forEach(propertyName => {
        if (tableColumns[propertyName].key === 'PRI') {
            r.push(propertyName);
        }
    });
    return r;
}

function getForTable(tableName) {
    if (tableDefinitions[tableName] === undefined) {
        tableDefinitions[tableName] = fetchColumns(tableName);
    }
    return tableDefinitions[tableName];
} 

module.exports.getForTable = getForTable;

module.exports.getPkForTable = function(tableName) {
    if (tablePks[tableName] === undefined) {
        tablePks[tableName] = fetchPkForTable(tableName);
    }
    return tablePks[tableName];
}
