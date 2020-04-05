'use strict';

const util = require('./../Util');
const config = require('./../Config');


function isBinaryLogicalOperator(value) {
    value = value.toUpperCase();
    return value == 'AND' || value == 'OR' || value == 'XOR';
}

function formatOperator(value, operand0, operand1) {
    var isNullOperand = (operand0 === null || operand0 === undefined || operand1 === null || operand1 === undefined);
    switch (value.toLowerCase()) {
        case 'eg': ;
        case 'eq': return isNullOperand ? 'IS' : '=';
        case 'lt': return '<';
        case 'lte': return '<=';
        case 'gt': return '>';
        case 'gte': return '>=';
        case 'ne': return isNullOperand ? 'IS NOT' : '=';
        case 'like': return value.toUpperCase();
        case 'column': return '';
        default: throw new Error('unknow operator ' + value);
    }
}

function formatPropertyValue(value) {
    return util.formatQueryValue(value)
}

function buildObject(buildContext, currentObject, logicalOperator) {
    var propertys = Object.getOwnPropertyNames(currentObject);
    // console.log('buildObject ' + JSON.stringify(currentObject) + ' propertys=' + propertys);
    return buildPropertys(buildContext, currentObject, logicalOperator, propertys);
}

function buildPropertys(buildContext, currentObject, logicalOperator, propertys) {
    // console.log('buildPropertys ' + JSON.stringify(currentObject));
    if (propertys.length === 1) {
        return buildProperty(buildContext, currentObject, propertys[0], currentObject[propertys[0]]);
    }
    if (logicalOperator === undefined || logicalOperator === null) {
        logicalOperator = 'AND';
    }

    var r = ' (';
    for (var i = 0; i < propertys.length; i++) {
        if (i > 0) {
            r += ' ' + logicalOperator;
        }
        r += buildProperty(buildContext, currentObject, propertys[i], currentObject[propertys[i]]);
    }
    r += ')';
    return r;
}

function buildArray(buildContext, currentObject, logicalOperator) {
    // console.log('buildArray ' + JSON.stringify(currentObject));
    if (logicalOperator === undefined || logicalOperator === null) {
        logicalOperator = 'AND';
    }
    var r = ' (';
    for (var i = 0; i < currentObject.length; i++) {
        if (i > 0) {
            r += ' ' + logicalOperator;
        }
        r += buildObject(buildContext, currentObject[i]);
    }
    r += ')';
    return r;
}

function buildProperty(buildContext, currentObject, propertyName, propertyValue) {
    // console.log('buildProperty object=' + JSON.stringify(currentObject)+' properName='+propertyName+' propertyValue='+JSON.stringify(propertyValue));
    if (propertyName.startsWith('$')) {
        var operator = propertyName.substring(1).toUpperCase();
        if (isBinaryLogicalOperator(operator)) {
            if (Array.isArray(propertyValue) && (typeof propertyValue !== 'string')) {
                return buildArray(buildContext, propertyValue, operator);
            } else {
                return buildObject(buildContext, propertyValue, operator);
            }
        } else {
            if (operator === 'COLUMN') {
                return config.propertyNameConverter.toDb(propertyValue);
            }
            return '(' + operator + ' ' + buildObject(buildContext, propertyValue) + ')';
        }
    } else {
        var operator = formatOperator('eq', propertyName, propertyValue);
        if (typeof propertyValue === 'object' && propertyValue !== null) {
            return '(' 
                    + config.propertyNameConverter.toDb(propertyName) + ' ' 
                    + buildOperatorAndOperand(buildContext, propertyName, propertyValue) + ')';
        }
        return '(' 
                + config.propertyNameConverter.toDb(propertyName) + ' ' 
                + operator + ' ' 
                + formatPropertyValue(propertyValue) + ')';
    }
}

function buildOperatorAndOperand(buildContext, operand0, currentObject) {
    var propertyName = Object.getOwnPropertyNames(currentObject)[0];
    var propertyValue = currentObject[propertyName];
    var operator = propertyName.substring(1).toUpperCase();
    return formatOperator(operator, operand0, propertyValue) + ' ' 
            + (typeof propertyValue === 'object' ? buildObject(buildContext, propertyValue) : formatPropertyValue(propertyValue));
}

exports.build = function(where) {
    var buildContext = {where, parameterIndex: 0};
    // console.log('build cond ' + JSON.stringify(where));
    return Array.isArray(where) ? buildArray(buildContext, where) : buildObject(buildContext, where);
}
