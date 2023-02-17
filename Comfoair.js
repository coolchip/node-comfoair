'use strict';

const EventEmitter = require('events');
const ComfoairStream = require('./ComfoairStream');
const commands = require('./commands');

const queue = require('queue');

const QUEUE_TIMEOUT = 5 * 1000;
const MAX_QUEUE_SIZE = 30;

class Comfoair extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;

        this.comfoair = new ComfoairStream(config);
        this._registerEvents();

        this.q = queue({
            concurrency: 1, // no parallel jobs
            timeout: QUEUE_TIMEOUT,
            autostart: true
        });

        this.q.on('timeout', (next) => {
            this.emit('error', new Error(`Queue timeout of ${QUEUE_TIMEOUT / 1000}s exceeded. Restarting Comfoair module.`));
            this.comfoair.close();
            this.comfoair = new ComfoairStream(config);
            this._registerEvents();

            // empty and restart queue
            this.q.end();
            this.q.start();

            setTimeout(next, 1000);
        });
    }

    _registerEvents() {
        this.comfoair.on('open', () => {
            this.emit('open');
        });
        this.comfoair.on('close', () => {
            this.emit('close');
        });
        this.comfoair.on('error', (err) => {
            this.emit('error', err);
        });
    }

    close(cb) {
        this.comfoair.close(() => {
            this.comfoair = null;

            // empty and stop queue
            this.q.end();
            if (cb) cb();
        });
    }

    open() {
        this.comfoair = new ComfoairStream(this.config);
        this._registerEvents();

        // restart queue
        this.q.start();
    }

    static getAvailableCommands() {
        const list = commands.list();
        return list.map((func) => {
            return {
                name: func.name,
                label: func.label,
                arg: (func.arg.length) ? func.arg.map((arg) => arg) : undefined,
                response: (func.description) ? func.description.map((desc) => {
                    return {
                        name: desc.name,
                        label: desc.label
                    };
                }) : undefined,
            };
        });
    }

    // @todo: Automaticly add functions from commands.js
    getBootloaderVersion(cb) {
        return this._enqueue('getBootloaderVersion', {}, cb);
    }

    getFirmwareVersion(cb) {
        return this._enqueue('getFirmwareVersion', {}, cb);
    }

    getFlapState(cb) {
        return this._enqueue('getFlapState', {}, cb);
    }

    getFanState(cb) {
        return this._enqueue('getFanState', {}, cb);
    }

    getBypassControllerState(cb) {
        return this._enqueue('getBypassControllerState', {}, cb);
    }

    getOperatingHours(cb) {
        return this._enqueue('getOperatingHours', {}, cb);
    }

    getVentilationLevel(cb) {
        return this._enqueue('getVentilationLevel', {}, cb);
    }

    getTemperatures(cb) {
        return this._enqueue('getTemperatures', {}, cb);
    }

    getTemperatureStates(cb) {
        return this._enqueue('getTemperatureStates', {}, cb);
    }

    getFaults(cb) {
        return this._enqueue('getFaults', {}, cb);
    }

    setLevel(level, cb) {
        return this._enqueue('setLevel', {
            level
        }, cb);
    }

    setComfortTemperature(temperature, cb) {
        return this._enqueue('setComfortTemperature', {
            temperature
        }, cb);
    }

    setVentilationLevel(exhaustAway, exhaustLow, exhaustMiddle, exhaustHigh, supplyAway, supplyLow, supplyMiddle, supplyHigh, cb) {
        return this._enqueue('setVentilationLevel', {
            exhaustAway,
            exhaustLow,
            exhaustMiddle,
            supplyAway,
            supplyLow,
            supplyMiddle,
            exhaustHigh,
            supplyHigh
        }, cb);
    }

    reset(resetFaults, resetSettings, runSelfTest, resetFilterTimer, cb) {
        return this._enqueue('reset', {
            resetFaults,
            resetSettings,
            runSelfTest,
            resetFilterTimer
        }, cb);
    }

    runCommand(commandName, params, cb) {
        return this._enqueue(commandName, params, cb);
    }

    _enqueue(commandName, params, cb) {
        const returnError = (err) => {
            if (typeof cb === 'function') return cb(err);
            this.emit('error', err);
        };
        const returnData = (data) => {
            if (typeof cb === 'function') return cb(null, data);
            this.emit('data', data);
        };

        if (!this.comfoair) return returnError(new Error('Connection closed. Please open Connection first.'));

        const commandStructure = commands.byName(commandName);
        if (!commandStructure) {
            return returnError(new Error(`Command "${commandName}" unknown.`));
        }
        const expectAck = !commandStructure.response;

        if (this.q.length >= MAX_QUEUE_SIZE) {
            return returnError(new Error(`Queue size of ${MAX_QUEUE_SIZE} exceeded. Command "${commandName}" discarded.`));
        }

        this.q.push((done) => {
            const cleanUp = () => {
                clearTimeout(timer);
                this.comfoair.removeListener('data', dataHandler);
            };

            const timeout = () => {
                cleanUp();
                returnError(new Error(`Command "${commandName}" timeout exceeded.`));
                done();
            };
            const timer = setTimeout(timeout, 1 * 1000);

            const dataHandler = (chunk) => {
                // if expecting data and get an ACK, return and wait for next data event
                if (chunk.type === 'ACK' && expectAck === false) return;
                cleanUp();
                returnData(chunk);
                done();
            };
            this.comfoair.on('data', dataHandler);

            const executeCommand = () => {
                const chunk = {
                    name: commandName,
                    params
                };
                this.comfoair.write(chunk, 'utf-8', (err) => {
                    if (err) {
                        cleanUp();
                        returnError(new Error(`Comfoair error: ${err.message}`));
                        done();
                    }
                });
            };
            process.nextTick(executeCommand);
        });
    }
}

module.exports = Comfoair;
