'use strict';

const cors = require('cors');

module.exports = function(app) {
    const authController = require('./controller/AuthController');
    const tableController = require('./controller/TableController');
    const blobController = require('./controller/BlobController');
    const queryController = require('./controller/QueryController');

    app.use(cors());

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
        next();
    });

    app.use(authController.auth);

    app.get('/login', authController.login);
    

    app.route('/table/:tableName')
        .get(tableController.select)
        .post(tableController.insert)
        .put(tableController.update)
        .delete(tableController.delete)
        ;
    app.route('/table/:tableName/:id')
        .delete(tableController.delete)
        ;

    app.route('/query/select')
        .get(queryController.selectRequest)
        ;

    app.route('/table-blob/:tableName/:id')
        .get(blobController.selectBlobById)
        ;

    app.route('/table-image/:tableName/:id')
        .get(blobController.selectImageById)
        ;

    app.route('/query-blob/:tableName')
        .get(blobController.selectBlob)
        ;

    app.route('/query-image/:tableName')
        .get(blobController.selectImage)
        ;

};
