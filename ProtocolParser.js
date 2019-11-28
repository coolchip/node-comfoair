'use strict';

const Transform = require('stream').Transform;
const bufferReplace = require('buffer-replace');
const commands = require('./commands');
const sequences = require('./sequences');

// parse a chunk from comfoair
class ProtocolParser extends Transform {
    constructor(config) {
        super({
            objectMode: true
        });

        this.config = Object.assign({}, {
            passAcks: true
        }, config);

        this.buffer = Buffer.alloc(0);
    }

    isChecksumValid(data, checksum) {
        // start value is 173
        let sum = checksum - 173;
        for (const b of data) {
            sum -= b;
        }
        // true, if least significant byte is zero
        return (sum & 0xFF) === 0;
    }

    parseData(data, response) {
        const commandHandler = commands.byRespose(response);
        if (commandHandler) {
            let position = 0;
            const reducer = (accumulator, currentParam) => {
                accumulator[currentParam.name] = {
                    value: currentParam.reader(data.slice(position, position + currentParam.length)),
                    label: currentParam.label
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

    parsePayload(payload) {
        const response = payload.slice(0, 2);
        const telegramLength = payload.slice(2, 3);
        const type = 'RES';

        const invalid = (error) => {
            return {
                type,
                valid: false,
                payload: {},
                error
            };
        };

        // break if length = 0 ... don't know why this happens. when it happens,
        // length is in the next byte. But we ignore this.
        if (telegramLength[0] === 0) {
            return invalid('Frame length is null');
        }

        // search and replace double 0x07 in data section
        const data = payload.slice(3, payload.length - 1);
        const cleanData = bufferReplace(data, sequences.doubleSeven, sequences.singleSeven);
        if (telegramLength[0] !== cleanData.length) {
            return invalid('Invalid frame length');
        }

        // check sum
        const checksum = payload.readUInt8(payload.length - 1);
        const cleanPayload = Buffer.concat([response, telegramLength, cleanData]);
        const valid = this.isChecksumValid(cleanPayload, checksum);
        if (!valid) {
            return invalid('Checksum is invalid');
        }

        // parse data
        try {
            const parsedData = this.parseData(cleanData, response);
            return {
                type,
                valid,
                payload: parsedData
            };
        } catch (e) {
            return invalid(`Error while parsing: ${e.message}]`);
        }
    }

    _transform(chunk, encoding, callback) {
        let buffer = Buffer.concat([this.buffer, chunk]);

        while (buffer.length >= 2) {
            const head = buffer.slice(0, 2);
            if (head.equals(sequences.ack)) {
                // found ack -> push, if necessary
                if (this.config.passAcks) {
                    this.push({
                        type: 'ACK',
                        valid: true
                    });
                }
                buffer = buffer.slice(2);
            } else if (head.equals(sequences.start)) {
                // found start of a response -> search for end
                const indexEndSeq = buffer.indexOf(sequences.end, 2);
                if (indexEndSeq !== -1) {
                    // found end -> push parsed payload
                    const payload = buffer.slice(2, indexEndSeq);
                    const parsedPayload = this.parsePayload(payload);
                    this.push(parsedPayload);
                    buffer = buffer.slice(indexEndSeq + 2);
                } else {
                    // found start without end -> wait for more data
                    break;
                }
            } else {
                // remove first unknown byte and check again
                buffer = buffer.slice(1);
            }
        }
        this.buffer = buffer;
        callback();
    }

    _flush(callback) {
        this.buffer = Buffer.alloc(0);
        callback();
    }
}

module.exports = ProtocolParser;
