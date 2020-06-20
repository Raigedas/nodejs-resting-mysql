'use strict';

var mysql = require('mysql');

const config = require('./Config');
// console.log('cfg: ' + JSON.stringify(config));
var pool = mysql.createPool(config.dbConnection);


pool.promisedQuery = function(sql, args) {
    // console.log('promisedQuery sql=' + sql);
    return new Promise((resolve, reject) => {
        if (args !== undefined) {
            this.query(sql, args, ( err, rows ) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        } else {
            this.query(sql, ( err, rows ) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        }
        // setTimeout(() => {
        //     if (args !== undefined) {
        //         this.query(sql, args, (err, rows) => {
        //             if (err) {
        //                 return reject(err);
        //             }
        //             resolve(rows);
        //         });
        //     } else {
        //         this.query(sql, (err, rows) => {
        //             if (err) {
        //                 return reject(err);
        //             }
        //             resolve(rows);
        //         });
        //     }
        // }, 500);
    });
}

module.exports = pool;
