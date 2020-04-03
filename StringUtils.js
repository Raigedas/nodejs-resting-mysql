'use strict';


module.exports.convertCamelToUpperCaseStyle = function(value) {
    value = value.replace(/([A-Z])/g, "_$1");
    return value.toUpperCase();
}

module.exports.convertUpperToCamelCaseStyle = function(value) {
    value = value.replace(/_/g, " ");
    value = value.toLowerCase();

    value = value.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
    return value;
}
