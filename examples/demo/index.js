const restingMysql = require('./../../index'); // require('resting-mysql')


restingMysql.config.dbConnection = require('./DbConnection');

restingMysql.config.login = require('./Login');


restingMysql.config.interceptors.preSelect.push((req, froms, joins, where) => {
    where.push({$or: [{insertedBy: null}, {insertedBy: req.query.user.id}]});
    return true;
});

restingMysql.start();
