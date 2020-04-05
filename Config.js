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
config.interceptors.preInsert = [];

module.exports = config;
