'use strict';

const config = require('./Config');
const util = require('./Util');


const CrudAction = {
    SELECT: 'SELECT',
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
};

exports.CrudAction = CrudAction;

exports.convertObjectStyleToJs = function(subject) {
    return util.convertObjectStyle(subject, config.propertyNameConverter.toJs);
}

exports.convertObjectStyleToDb = function(subject) {
    return util.convertObjectStyle(subject, config.propertyNameConverter.toDb);
}

exports.convertObjectsStyleToJs = function(subjects) {
    return util.convertObjectsStyle(subjects, config.propertyNameConverter.toJs);
}

exports.convertObjectsStyleToDb = function(subjects) {
    return util.convertObjectsStyle(subjects, config.propertyNameConverter.toDb);
}
