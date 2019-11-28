'use strict';

module.exports = {
    start: Buffer.from([0x07, 0xF0]),
    end: Buffer.from([0x07, 0x0F]),
    ack: Buffer.from([0x07, 0xF3]),
    doubleSeven: Buffer.from([0x07, 0x07]),
    singleSeven: Buffer.from([0x07])
};
