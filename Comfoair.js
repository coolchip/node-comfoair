'use strict';

const SerialPort = require('serialport');
const {
    Duplex
} = require('stream');
const commands = require('./commands');
const ProtocolParser = require('./ProtocolParser');
const UnmaskStream = require('./UnmaskStream');

const startSeq = Buffer.from([0x07, 0xF0]);
const endSeq = Buffer.from([0x07, 0x0F]);
const ackSeq = Buffer.from([0x07, 0xF3]);

class Comfoair extends Duplex {
    constructor(options) {
        super({
            objectMode: true
        });

        this.options = Object.assign({}, {
            timeout: 5000
        }, options);

        this.port = new SerialPort(options.port, {
            baudRate: options.baud || 9600
        });

        this.open = false;
        this.port.on('open', err => {
            if (err) return console.error(err.message);
            this.open = true;
        });

        this.port.on('close', err => {
            // push the EOF-signaling 'null' chunk
            this.open = false;
            this.push(null);
        });

        // set up pipe for parsing messages from comfoair
        const unmaskStream = new UnmaskStream();
        const protocolParser = new ProtocolParser({
            passAcks: true,
            debug: options.debug || false
        });
        this.parser = this.port.pipe(unmaskStream).pipe(protocolParser);

        // buffer every received package
        this.readArr = [];
        this.parser.on('data', chunk => {
            this.readArr.push(chunk);
            if (chunk.type === 'RES') {
                // send acknowledge to each received response
                this._sendAcknowledge();
            }
        });
    }

    _calcCheckSum(data) {
        //start value is 173
        let sum = 173;
        for (const b of data) {
            sum += b;
        }
        //return least significant byte
        return sum & 0xFF;
    }

    _sendAcknowledge(cb) {
        this.port.write(ackSeq, cb);
    }

    close(cb) {
        this.port.close(cb);
        this.port = null;
    }

    _read(bytesToRead) {
        const pool = this.readArr;

        // if we have no data, wait till we get some
        if (!this.open || pool.length === 0) {
            this.parser.once('data', () => {
                this._read(bytesToRead);
            });
            return;
        }

        // push out data from buffer
        while (pool.length) {
            const chunk = pool.shift();
            if (!this.push(chunk)) {
                // false from push, stop reading
                break;
            }
        }
    }

    _write(chunk, encoding, cb) {
        const commandHandler = commands.byName(chunk.name);
        if (!commandHandler) return cb(new Error('unknown command'));

        const command = Buffer.from(commandHandler.command);
        const reducer = (accumulator, currentValue) => {
            const matchingParam = chunk.params[currentValue.name];
            const currentDataFragment = currentValue.writer(matchingParam);
            return accumulator.concat(currentDataFragment);
        };
        const data = Buffer.from(commandHandler.arg.reduce(reducer, []));
        const dataLength = Buffer.from([data.length]);
        const msg = Buffer.concat([command, dataLength, data]);
        const checksum = Buffer.from([this._calcCheckSum(msg)]);

        // frame message and send it to comfoair
        const req = Buffer.concat([startSeq, msg, checksum, endSeq]);
        this.port.write(req, cb);
    }

    getBootloaderVersion(cb) {
        return this._send('getBootloaderVersion', {}, cb);
    }

    getFirmwareVersion(cb) {
        return this._send('getFirmwareVersion', {}, cb);
    }

    getFanState(cb) {
        return this._send('getFanState', {}, cb);
    }

    getOperatingHours(cb) {
        return this._send('getOperatingHours', {}, cb);
    }

    getVentilationLevel(cb) {
        return this._send('getVentilationLevel', {}, cb);
    }

    getTemperatures(cb) {
        return this._send('getTemperatures', {}, cb);
    }

    getTemperatureStates(cb) {
        return this._send('getTemperatureStates', {}, cb);
    }

    getFaults(cb) {
        return this._send('getFaults', {}, cb);
    }

    setLevel(level, cb) {
        return this._send('setLevel', {
            level
        }, cb);
    }

    setComfortTemperature(temperature, cb) {
        return this._send('setComfortTemperature', {
            temperature
        }, cb);
    }

    setVentilationLevel(exhaustAway, exhaustLow, exhaustMiddle, exhaustHigh, supplyAway, supplyLow, supplyMiddle, supplyHigh, cb) {
        return this._send('setVentilationLevel', {
            exhaustAway,
            exhaustLow,
            exhaustMiddle,
            exhaustHigh,
            supplyAway,
            supplyLow,
            supplyMiddle,
            supplyHigh
        }, cb);
    }

    reset(resetFaults, resetSettings, runSelfTest, resetFilterTimer, cb) {
        return this._send('reset', {
            resetFaults,
            resetSettings,
            runSelfTest,
            resetFilterTimer
        }, cb);
    }

    runCommand(commandName, params, cb) {
        return _send(commandName, params, cb);
    }

    _send(commandName, params, cb) {
        const commandHandler = commands.byName(commandName);

        // set up timeout, if we get no answer
        const timeoutHandler = () => {
            this.parser.removeListener('data', dataHandler);
            return cb(new Error('Timeout'));
        };
        const timerId = setTimeout(timeoutHandler, this.options.timeout);

        // use callback to return received chunks
        const dataHandler = (chunk) => {
            const expectAck = commandHandler.response ? false : true;
            if (chunk.type === 'ACK' && expectAck === false) return;
            clearTimeout(timerId);
            this.parser.removeListener('data', dataHandler);
            cb(null, chunk);
        };
        this.parser.on('data', dataHandler);

        // prepare chunk for writing to comfoair
        const chunk = {
            name: commandName,
            params
        };
        this._write(chunk, null, (err) => {
            if (err) {
                this.parser.removeListener('data', dataHandler);
                return cb(err);
            }
        });
    }
}

module.exports = Comfoair;