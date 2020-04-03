
const crypto = require('crypto');

function buildPasswordHash(password) {
    return crypto.createHash('md5').update(password).digest("hex").toUpperCase();
}

module.exports = function(req, db, done) {
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
        done(null, rows[0]);
    });
}
