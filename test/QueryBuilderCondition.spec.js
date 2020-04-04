'use strict';

var instance = require('../controller/QueryBuilderCondition');

var assert = require('assert');

describe('QueryBuilderWhere', () => {
    it('build', () => {
        assert.equal(
            instance.build({id: 1}).replace(/ /g, ""),
            '(ID = 1)'.replace(/ /g, "")
        );
        assert.equal(
            instance.build({id: null}),
            '(ID IS NULL)'
        );
        assert.equal(
            instance.build({id: 1, user: 999}).replace(/ /g, ""),
            '((ID = 1) AND (USER = 999))'.replace(/ /g, "")
        );
        assert.equal(
            instance.build({id: {$gt: 1}}).replace(/ /g, ""),
            '(ID > 1)'.replace(/ /g, "")
        );
        assert.equal(
            instance.build({company: "org"}),
            '(COMPANY = \'org\')'
        );
        assert.equal(
            instance.build({company: {$like: "%org%"}}),
            '(COMPANY LIKE \'%org%\')'
        );
        assert.equal(
            instance.build({
                id: 1, 
                user: 999, 
                $or: [
                    {
                        age: 21}, 
                        {age: {$lt: 22}
                    }
                ]
            }).replace(/ /g, ""),
            '((ID = 1) AND (USER = 999) AND ((AGE = 21) OR (AGE < 22)))'.replace(/ /g, "")
        );
        assert.equal(
            instance.build({
                id: 1, 
                user: 999, 
                $or: {yourAge: 20, myAge: 20}
            }).replace(/ /g, ""),
            '((ID = 1) AND (USER = 999) AND ((YOUR_AGE = 20) OR (MY_AGE = 20)))'.replace(/ /g, "")
        );
        assert.equal(
            instance.build({
                $or: [
                    {insertedBy: null}, 
                    {insertedBy: 2}
                ]
            }).replace(/ /g, ""),
            '((INSERTED_BY IS NULL) OR (INSERTED_BY = 2))'.replace(/ /g, "")
        );
        assert.equal(
            instance.build([
                {
                    title: {$like: '%th%'}
                },
                {
                    $or: [
                        {insertedBy: null}, 
                        {insertedBy: 2}
                    ]
                }
            ]).replace(/ /g, ""),
            ' ((TITLE LIKE \'%th%\') AND ((INSERTED_BY IS NULL) OR (INSERTED_BY = 2)))'.replace(/ /g, "")
        );
        assert.equal(
            instance.build({
                "cm.model":{$eq: {$column:"m.id"}}
            }).replace(/ /g, ""),
            ' (CM.MODEL = M.ID)'.replace(/ /g, "")
        );
    });
});
