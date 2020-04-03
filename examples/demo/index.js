const restingMysql = require('./../../index'); // require('resting-mysql')


restingMysql.config.dbConnection = {
    connectionLimit: 3,
    host     : 'localhost',
    user     : 'root',
    password : 'admin',
    database : 'db_name',
    multipleStatements: true,
};


const crypto = require('crypto');
function buildPasswordHash(password) {
    return crypto.createHash('md5').update(password).digest("hex").toUpperCase();
}

restingMysql.config.login = function(req, db, done) {
    const username = req.query.username;
    const password = req.query.password;
    if (username === undefined || username === null || password === undefined || password === null) {
        done('missing username or password');
        return
    }
    const passwordHash = buildPasswordHash(password);
    db.query('SELECT * FROM USER WHERE EMAIL = ? AND PASSWORD_HASH = ?', [username, passwordHash], (err, rows) => {
        if (err) {
            done(err);
            return;
        }
        if (rows.length <= 0) {
            done('bad username or password');
            return
        }
        done(null, restingMysql.common.convertObjectStyleToJs(rows[0]));
    });
}

function preInterceptorsWhereUser(req, tableName, where) {
    where.push({$or: [{insertedBy: null}, {insertedBy: req.query.user.id}]});
    return true;
}

restingMysql.config.preInterceptors.push(preInterceptorsWhereUser);

restingMysql.start();
