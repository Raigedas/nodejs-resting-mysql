'use strict';

const util = require('../Util');

var db = require('./../Db');


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
