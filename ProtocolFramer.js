'use strict';

const Transform = require('stream').Transform;
const bufferReplace = require('buffer-replace');
const commands = require('./commands');
const sequences = require('./sequences');

// parse a chunk from comfoair
class ProtocolFramer extends Transform {
    constructor() {
        super({
            objectMode: true
        });
    }

    genenerateCheckSum(data) {
        // start value is 173
        let sum = 173;
        for (const b of data) {
            sum += b;
        }
        // return least significant byte
        return sum & 0xFF;
    }

    _transform(chunk, encoding, callback) {
        const commandHandler = commands.byName(chunk.name);
        if (!commandHandler) return callback(new Error('Unknown Comfoair command'));

        const command = Buffer.from(commandHandler.command);
        const reducer = (accumulator, currentValue) => {
            const matchingParam = chunk.params[currentValue.name];
            const currentDataFragment = currentValue.writer(matchingParam);
            return accumulator.concat(currentDataFragment);
        };
        const data = Buffer.from(commandHandler.arg.reduce(reducer, []));
        const dataLength = Buffer.from([data.length]);
        const msg = Buffer.concat([command, dataLength, data]);
        const checksum = Buffer.from([this.genenerateCheckSum(msg)]);

        // double 0x07 in data section to meet protocol specs
        const escapedData = bufferReplace(data, sequences.singleSeven, sequences.doubleSeven);

        // send message to comfoair
        const req = Buffer.concat([sequences.start, command, dataLength, escapedData, checksum, sequences.end]);
        this.push(req);
        callback();
    }

    _flush(callback) {
        callback();
    }
}

module.exports = ProtocolFramer;
