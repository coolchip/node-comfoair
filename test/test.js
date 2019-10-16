'use strict';

const assert = require('assert');
// const StreamTest = require('streamtest');
// const UnmaskStream = require('../UnmaskStream');

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.strict.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});

/*
describe('Unmast stream lib', function () {
    // Iterating through versions
    StreamTest.versions.forEach(function (version) {
        describe('for ' + version + ' streams', function () {
            // here goes your code
            it('should work', function (done) {
                const testStreams = [
                    [0x07, 0xF0, 0x00, 0x6A, 0x0D, 0x03, 0x14, 0x20, 0x43, 0x41, 0x33, 0x35, 0x30, 0x20, 0x6C, 0x75, 0x78, 0x65, 0x55, 0x07, 0x0F],
                    [0x07, 0xF0, 0x00, 0x6A, 0x03, 0x01, 0x07, 0x07, 0x03, 0x00, 0x07, 0x0F]
                ];
                const umaskStream = new UnmaskStream();
                StreamTest[version].fromChunks(testStreams)
                    .pipe(umaskStream)
                    .pipe(StreamTest[version](function (err, text) {
                        if (err) {
                            done(err);
                        }
                        assert.strict.equal(text, [0x07, 0xF0, 0x00, 0x6A, 0x03, 0x01, 0x07, 0x03, 0x00, 0x07, 0x0F]);
                        done();
                    }));
            });
        });
    });
});
*/
