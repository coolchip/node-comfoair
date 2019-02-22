'use strict';

const Transform = require('stream').Transform;
const commands = require('./commands');

const startSeq = Buffer.from([0x07, 0xF0]);
const endSeq = Buffer.from([0x07, 0x0F]);
const ackSeq = Buffer.from([0x07, 0xF3]);

// parse a chunk from comfoair
class ProtocolParser extends Transform {
    constructor(config) {
        super({
            objectMode: true
        });

        this.config = Object.assign({}, {
            passAcks: true,
            debug: false
        }, config);

        this.buffer = Buffer.alloc(0);
    }

    isChecksumValid(data, checksum) {
        //start value is 173
        let sum = 173 - checksum;
        for (const b of data) {
            sum += b;
        }
        //true, if least significant byte is zero
        return (sum & 0xFF) === 0;
    }

    parseData(data, response) {
        const commandHandler = commands.byRespose(response);
        if (commandHandler) {
            let position = 0;
            const reducer = (accumulator, currentParam) => {
                accumulator[currentParam.name] = {
                    value: currentParam.reader(data.slice(position, position + currentParam.length)),
                    label: currentParam.label,
                };
                if (currentParam.unit) accumulator[currentParam.name].unit = currentParam.unit;
                position += currentParam.length;
                return accumulator;
            };
            const payload = commandHandler.description.reduce(reducer, {
                description: commandHandler.label
            });
            return payload;
        }
        return {};
    }

    _transform(chunk, encoding, cb) {
        let buffer = Buffer.concat([this.buffer, chunk]);

        while (buffer.length >= 2) {
            const head = buffer.slice(0, 2);
            if (head.equals(ackSeq)) {
                // found ack -> push, if necessary
                if (this.config.passAcks) {
                    this.push({
                        type: 'ACK'
                    });
                }
                buffer = buffer.slice(2);
            } else if (head.equals(startSeq)) {
                // found beginning of a response -> search for end
                let endPosition;
                if ((endPosition = buffer.indexOf(endSeq, 2)) !== -1) {
                    // found end -> push full message
                    const type = 'RES';
                    const response = Array.prototype.slice.call(buffer, 2, 4);
                    const telegramLength = buffer.readInt8(4);
                    const data = buffer.slice(5, 5 + telegramLength);
                    const payload = this.parseData(data, response);
                    const checksum = buffer.readInt8(5 + telegramLength);
                    const valid = this.isChecksumValid(buffer.slice(2, buffer.length - 3), checksum);

                    if (this.config.debug) {
                        this.push({
                            type,
                            response,
                            telegramLength,
                            data,
                            payload,
                            checksum,
                            valid
                        });
                    } else {
                        this.push({
                            type,
                            valid,
                            payload,
                        });
                    }
                    buffer = buffer.slice(endPosition + 2);
                } else {
                    // found beginning without end -> wait for more data
                    break;
                }
            } else {
                // remove first unknown byte and check again
                buffer = buffer.slice(1);
            }
        }
        this.buffer = buffer;
        cb();
    }

    _flush(cb) {
        this.buffer = Buffer.alloc(0);
        cb();
    }
}

module.exports = ProtocolParser;