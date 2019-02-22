// 'use strict';

// const fs = require('fs');
// const path = require('path');

// const UnmaskStream = require('../UnmaskStream');
// const ProtocolParser = require('../ProtocolParser');

// const unmaskStream = new UnmaskStream();
// const protocolParser = new ProtocolParser({
//     passAcks: false
// });

// //const inputFile = fs.createReadStream(path.join('.', 'samples', 'fanState.bin'));
// //const inputFile = fs.createReadStream(path.join('.', 'samples', 'faults.bin'));
// //const inputFile = fs.createReadStream(path.join('.', 'samples', 'firmwareVersion.bin'));
// //const inputFile = fs.createReadStream(path.join('.', 'samples', 'operatingHours.bin'));
// //const inputFile = fs.createReadStream(path.join('.', 'samples', 'temperatures.bin'));
// const inputFile = fs.createReadStream(path.join('.', 'samples', 'tempState.bin'));
// inputFile.pipe(unmaskStream).pipe(protocolParser).pipe(process.stdout);