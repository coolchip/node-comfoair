'use strict';

const Comfoair = require('./index');

const main = function () {
    const commands = Comfoair.getAvailableCommands();
    console.log(JSON.stringify(commands, null, 2));
};

main();
