'use strict';

const Duplex = require('stream').Duplex;
const SerialPort = require('serialport');
const ProtocolParser = require('./ProtocolParser');
const ProtocolFramer = require('./ProtocolFramer');

class ComfoairStream extends Duplex {
    constructor(options, cb) {
        super({
            objectMode: true
        });

        this.port = new SerialPort(options.port, {
            baudRate: options.baud || 9600
        }, cb);

        this.port.on('open', () => {
            this.emit('open');
        });
        this.port.on('close', () => {
            this.emit('close');
        });
        this.port.on('error', (err) => {
            this.emit('error', err);
        });

        // set up pipe for parsing messages from comfoair
        const protocolParser = new ProtocolParser({
            passAcks: options.passAcks || true
        });
        this.parser = this.port.pipe(protocolParser);
        this.parser.on('data', (chunk) => {
            this.emit('data', chunk);
        });

        // set up pipe for framing messages to comfoair
        this.framer = new ProtocolFramer();
        this.framer.on('error', (err) => {
            this.emit('error', err);
        });
        this.framer.pipe(this.port);
    }

    close(callback) {
        this.port.close(callback);
    }

    _read(size) {
        return this.parser.read(size);
    }

    _write(chunk, encoding, callback) {
        return this.framer.write(chunk, encoding, callback);
    }
}

module.exports = ComfoairStream;
