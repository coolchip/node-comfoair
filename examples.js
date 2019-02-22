'use strict';

const Comfoair = require('./Comfoair');

const myPort = '/home/sebastian/dev/ttyV0';
const mySpeed = 9600;

const byCall = function (level, cb) {
    const vent = new Comfoair({
        port: myPort,
        baud: mySpeed
    });

    if (level) {
        vent.setLevel(level, (err, resp) => {
            if (err) return console.error(err.message);
            console.log(resp);
        });
    }

    vent.getBootloaderVersion((err, resp) => {
        if (err) return console.error(err.message);
        console.log(resp);
        vent.getTemparatures((err, resp) => {
            if (err) return console.error(err.message);
            console.log(resp);
            vent.getTemparatureStates((err, resp) => {
                if (err) return console.error(err.message);
                console.log(resp);
                vent.getFaults((err, resp) => {
                    if (err) return console.error(err.message);
                    console.log(resp);
                    vent.getOperatingHours((err, resp) => {
                        if (err) return console.error(err.message);
                        console.log(resp);
                        vent.getVentilationLevel((err, resp) => {
                            vent.close();
                            if (err) return console.error(err.message);
                            console.log(resp);
                            cb();
                        });
                    });
                });
            });
        });
    });
};

const byStreaming = function (level, cb) {
    const vent = new Comfoair({
        port: myPort,
        baud: mySpeed
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