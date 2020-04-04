'use strict';

var Mysql = require('sync-mysql');

const config = require('../Config');


const data = {};

function fetchColumns(tableName) {
    console.log('fetch table definition for: ' + tableName);
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

module.exports.getForTable = function(tableName) {
    if (data[tableName] === undefined) {
        data[tableName] = fetchColumns(tableName);
    }
    return data[tableName];
} 