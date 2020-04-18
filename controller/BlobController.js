'use strict';

const util = require('../Util');
const queryController = require('./QueryController');
const stringUtils = require('../StringUtils');


function selectBlob(req, res) {
    var subject = req.params.id;
    if (subject) {
        subject = util.wrapCurlyIfNeeded(subject);
        subject = JSON.parse(subject);
    }
    if (subject === undefined || subject === null || subject === '') {
        subject = req.body;
    }
    const tableName = stringUtils.convertRoutingApiToUpperCamelStyle(req.params.tableName);
    queryController.querySelectSingle(req, res, tableName, subject, true, queryController.processSelectResultAsBlob);
};

exports.selectBlob = selectBlob;

exports.selectImage = function(req, res) {
    req.query.contentTypeTemplate = 'Image/{0}';
    selectBlob(req, res);
};
