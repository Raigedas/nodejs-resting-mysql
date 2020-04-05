'use strict';

const mysql = require('mysql');

exports.checkNull = function(value) {
    return (value === null ? undefined : value);
}

exports.wrapIdToObject = function(id) {
    return (id ? {id} : undefined);
}

function wrapCurlyIfNeeded(value) {
    value = value.trim();
    if (!value.startsWith('{') && !value.startsWith('[')) {
        value = '{' + value + '}';
    }
    return value;
}
exports.wrapCurlyIfNeeded = wrapCurlyIfNeeded;

exports.wrapToArray = function(value) {
    var r = value;
    if (!Array.isArray(value)) {
        r = [];
        if (value) {
            r.push(value);
        }
    }
    return r;
}

exports.readJsonParameter = function(value, defaultValue) {
    if (value) {
        if (typeof value === 'string') {
            value = JSON.parse(wrapCurlyIfNeeded(value));
        }
    } else {
        value = defaultValue;
    }
    return value;
}

exports.sendError = function(res, error) {
    console.log(error);
    res.status(500).send(error);
}

exports.convertObjectStyle = function(subject, propertyNameConverter) {
    var r = {};
    const originalPropertyNames = Object.getOwnPropertyNames(subject);
    for (var i = 0; i < originalPropertyNames.length; i++) {
        r[propertyNameConverter(originalPropertyNames[i])] = subject[originalPropertyNames[i]];
    }
    return r;
}

exports.convertObjectsStyle = function(subjects, propertyNameConverter) {
    const r = [];
    subjects.forEach(element => {
        r.push(this.convertObjectStyle(element, propertyNameConverter));
    });
    return r;
}

exports.formatQueryValue = function(value) {
    if (value === undefined || value === null) {
        return 'NULL';
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    if (isNaN(value)) {
        return mysql.escape(value);
    }
    return value;
}