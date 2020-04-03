'use strict';


exports.checkNull = function(value) {
    return (value === null ? undefined : value);
}

exports.wrapIdToObject = function(id) {
    return (id ? {id} : undefined);
}

exports.wrapCurlyIfNeeded = function(value) {
    value = value.trim();
    if (!value.startsWith('{')) {
        value = '{' + value + '}';
    }
    return value;
}

exports.wrapToArray = function(value) {
    var r = value;
    if (value && !Array.isArray(value)) {
        r = [];
        r.push(value);
    }
    return r;
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
