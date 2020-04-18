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
config.interceptors.preSelectSingle = [];
config.interceptors.postSelect = [];
config.interceptors.preInsert = [];
config.interceptors.preDelete = [];
config.interceptors.preUpdate = [];

module.exports = config;
