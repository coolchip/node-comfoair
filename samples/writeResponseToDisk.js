'use strict';

const fs = require('fs');
const SerialPort = require('serialport');

const port = new SerialPort('/dev/ttyV0', {
    baudRate: 9600
});

// Open errors will be emitted as an error event
port.on('error', (err) => {
    console.log('Error: ', err.message);
});

const startSeq = Buffer.from([0x07, 0xF0]);
const endSeq = Buffer.from([0x07, 0x0F]);
const ackSeq = Buffer.from([0x07, 0xF3]);

const calcCheckSum = function (data) {
    let sum = 173;
    let last = 0;
    for (const b of data) {
        if (b === 7 && last === 7) {
            //two successive sevens are added only one time
            last = 0;
        } else {
            sum += b;
            last = b;
        }
    }
    //return least significant byte
    return sum & 0xFF;
};

const sendCommand = function (command, data, callback) {
    const dataLength = Buffer.from([data.length]);

    const msgLength = command.length + dataLength.length + data.length;
    const msg = Buffer.concat([command, dataLength, data], msgLength);

    const checksum = Buffer.from([calcCheckSum(msg)]);

    const totalLength = startSeq.length + msg.length + checksum.length + endSeq.length;
    const req = Buffer.concat([startSeq, msg, checksum, endSeq], totalLength);
    console.log('req:', req);

    port.write(req, (err) => {
        if (err) return callback(err);
        callback(null, 'message written');
    });
};

const sendAcknowledge = function (callback) {
    port.write(ackSeq, (err) => {
        if (err) return callback(err);
        callback(null, 'acknowledge written');
    });
};

let res = Buffer.from([]);
const outFile = './operatingHours.bin';

//Switches the port into "flowing mode"
port.on('data', (data) => {
    console.log('res:', data);

    fs.appendFileSync(outFile, data);

    const totalLength = res.length + data.length;
    res = Buffer.concat([res, data], totalLength);

    if (res.slice(-2, res.length).compare(endSeq) === 0) {
        sendAcknowledge((err, msg) => {
            if (err) return console.log('Error on write: ', err.message);
            console.log(msg);

            port.close((err) => {
                if (err) return console.log('Error: ', err.message);
            });
        });
    }
});

const command = Buffer.from([0x00, 0xDD]);
const data = Buffer.from([]);

sendCommand(command, data, (err, msg) => {
    if (err) return console.log('Error on write: ', err.message);
    console.log(msg);
});
