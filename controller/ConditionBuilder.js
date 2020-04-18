
'use strict';

const config = require('./../Config');
const tableDefinitions = require('./TableDefinitions');


function buildConditionForPk(tableName, entity) {
    const pkColumns = tableDefinitions.getPkForTable(config.propertyNameConverter.toDb(tableName));
    const r = [];
    pkColumns.forEach(pkColumn => {
        const condition = {};
        const pkProperty = config.propertyNameConverter.toJs(pkColumn);
        condition[pkProperty] = entity[pkProperty];
        r.push(condition)
    });
    return r;
}

exports.buildConditionForPk = buildConditionForPk;
