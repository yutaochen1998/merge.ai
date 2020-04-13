const suite = require('mocha').suite;
const test = require('mocha').test;
const assert = require('assert');

suite("placeholder 1", function() {
    test("testing placeholder 1", function () {
        let tmp = 1;
        assert.equal(tmp, 1, "placeholder 1 incorrect");
    })
});