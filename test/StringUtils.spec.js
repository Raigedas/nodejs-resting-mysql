'use strict';

var instance = require('../StringUtils');

var assert = require('assert');

describe('StringUtils', () => {
    it('to camel ', () => {
        assert.equal(
            instance.convertUpperToCamelCaseStyle('SKIPPING_OPTIONAL_DEPENDENCY'),
            'skippingOptionalDependency'
        );
    });
    it('to upper ', () => {
        assert.equal(
            instance.convertCamelToUpperCaseStyle('skippingOptionalDependency'),
            'SKIPPING_OPTIONAL_DEPENDENCY'
        );
    });
});
