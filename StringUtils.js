'use strict';


function convertCamelToUpperCaseStyle(value) {
    value = value.replace(/([A-Z])/g, "_$1");
    return value.toUpperCase();
}

function convertUpperToCamelCaseStyle(value) {
    value = value.replace(/_/g, " ");
    value = value.toLowerCase();

    value = value.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
    return value;
}


module.exports.convertCamelToUpperCaseStyle = convertCamelToUpperCaseStyle;

module.exports.convertUpperToCamelCaseStyle = convertUpperToCamelCaseStyle;

module.exports.convertRoutingApiToUpperCamelStyle = function(value) {
    value = value.replace('-', '_');
    return convertUpperToCamelCaseStyle(value);
}

module.exports.format = function(template, parameters) {
    var r = template;
    for (let i in parameters) {
      r = r.replace("{" + i + "}", parameters[i])
    }
    return r;
}
