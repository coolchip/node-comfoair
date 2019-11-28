'use strict';

const Comfoair = require('./index');
const ComfoairStream = require('./index').ComfoairStream;

const myPort = '/dev/ttyUSB0';
const baud = 9600;

const byCall = function (level, cb) {
    const vent = new Comfoair({
        port: myPort,
        baud
    });

    const handleError = (err) => {
        console.error(err.message);
        vent.close(cb);
    };

    vent.on('error', (err) => {
        console.log(err.message);
    });

    vent.on('close', () => {
        console.log('vent by call closed');
    });

    vent.on('open', () => {
        console.log('vent by call opened');

        if (level) {
            vent.setLevel(level, (err, resp) => {
                if (err) return console.error(err.message);
                console.log(resp);
            });
        }

        vent.getBootloaderVersion((err, resp) => {
            if (err) return handleError(err);
            console.log(resp);
            vent.getTemperatures((err, resp) => {
                if (err) return handleError(err);
                console.log(resp);
                vent.getTemperatureStates((err, resp) => {
                    if (err) return handleError(err);
                    console.log(resp);
                    vent.getFaults((err, resp) => {
                        if (err) return handleError(err);
                        console.log(resp);
                        vent.getOperatingHours((err, resp) => {
                            if (err) return handleError(err);
                            console.log(resp);
                            vent.getVentilationLevel((err, resp) => {
                                vent.close();
                                if (err) return handleError(err);
                                console.log(resp);
                                vent.close(cb);
                            });
                        });
                    });
                });
            });
        });
    });
};

const byStreaming = function (level, cb) {
    const vent = new ComfoairStream({
        port: myPort,
        baud
    });

    vent.on('error', (err) => {
        console.log(err.message);
    });

    vent.on('close', () => {
        console.log('vent by stream closed');
    });

    vent.on('data', chunk => {
        console.log(chunk);
        if (chunk.type === 'RES') {
            vent.close();
            return cb();
        }
    });

    const commands = [];

    if (level) {
        commands.push({
            name: 'setLevel',
            params: {
                level
            }
        });
    } else {
        commands.push({
            name: 'getFanState',
            params: {}
        });
    }

    commands.forEach(command => {
        vent.write(command, (err) => {
            if (err) return console.error(err.message);
        });
    });
};

const main = function () {
    byCall(null, () => {
        console.log('END BY CALL');
        byStreaming(null, () => {
            console.log('END BY STREAMING');
        });
    });
};

main();
