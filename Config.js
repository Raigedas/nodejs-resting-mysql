'use strict';

const stringUtils = require('./StringUtils');


const config = {}
config.propertyNameConverter = {
    toJs: stringUtils.convertUpperToCamelCaseStyle,
    toDb: stringUtils.convertCamelToUpperCaseStyle,
};
config.preInterceptors = [];
config.postInterceptors = [];


module.exports = config;
