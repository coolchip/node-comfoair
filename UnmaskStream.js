'use strict';

const Transform = require('stream').Transform;

// removes the doubled 07 in the stream from comfoair
class UnmaskStream extends Transform {
    constructor() {
        super();
        this.lastByte = 0;
        this.maskSeq = Buffer.from([0x07, 0x07]);
    }

    _transform(chunk, encoding, cb) {
        let data = chunk;

        // last and first byte = 7 -> remove one
        if (this.lastByte === 0x07 && data.readInt8(0) === 0x07) {
            data = data.slice(1);
        }

        // search for pattern
        let position;
        while ((position = data.indexOf(this.maskSeq)) !== -1) {
            // found pattern -> remove one seven and push
            this.push(data.slice(0, position + 1));
            data = data.slice(position + this.maskSeq.length);
        }

        // save last byte and push remaining buffer without sevens
        this.lastByte = data.readInt8(data.length - 1);
        this.push(data);
        cb();
    }
}

module.exports = UnmaskStream;