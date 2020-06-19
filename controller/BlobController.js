'use strict';

const util = require('../Util');
const queryController = require('./QueryController');
const stringUtils = require('../StringUtils');


function selectBlobById(req, res) {
    var subject = req.params.id;
    if (subject) {
        subject = util.wrapCurlyIfNeeded(subject);
        subject = JSON.parse(subject);
    }
    if (subject === undefined || subject === null || subject === '') {
        subject = req.body;
    }
    const tableName = stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName);
    let autogeneratedPropertys = [];
    util.readJsonParameter(req.query.autogeneratedPropertys, []).forEach(i => {
        autogeneratedPropertys.push(i);
    });
    util.readJsonParameter(req.headers['autogenerated-propertys'], []).forEach(i => {
        autogeneratedPropertys.push(i);
    });
    queryController.querySelectSingle(req, res, tableName, subject, autogeneratedPropertys, true, queryController.processSelectResultAsBlob);
};

exports.selectBlobById = selectBlobById;

exports.selectImageById = function(req, res) {
    req.query.contentTypeTemplate = 'Image/{0}';
    selectBlobById(req, res);
};


function selectBlob(req, res) {
    const tableName = stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName);
    const query = util.readJsonParameter(req.query.query, {});
    query.from = {tableName: tableName};
    query.where = util.readJsonParameter(req.query.where, {});
    query.blobProperty = req.query.blobProperty;
    queryController.querySelect(req, res, query, true, queryController.processSelectResultAsBlob);
};

exports.selectBlob = selectBlob;

exports.selectImage = function(req, res) {
    req.query.contentTypeTemplate = 'Image/{0}';
    selectBlob(req, res);
};
