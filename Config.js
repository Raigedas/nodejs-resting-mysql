'use strict';

const stringUtils = require('./StringUtils');

const util = require('./Util');


const config = {}
config.propertyNameConverter = {
    toJs: stringUtils.convertUpperToCamelCaseStyle,
    toDb: stringUtils.convertCamelToUpperCaseStyle,
};
config.interceptors = {};
config.interceptors.preSelect = [];
config.interceptors.postSelect = [];

config.interceptors.postSelect.push((req, tableName, rows) => {
    return util.convertObjectsStyle(rows, config.propertyNameConverter.toJs);
})


module.exports = config;
