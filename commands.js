'use strict';

const reader = {
    int8(data) {
        return data.readInt8(0);
    },
    int16(data) {
        return data.readInt16BE(0);
    },
    int24(data) {
        // prepend empty byte to get a 32 bit value
        data = Buffer.concat([Buffer.from([0]), data]);
        return data.readInt32BE(0);
    },
    bool(data) {
        return Boolean(data.readInt8(0));
    },
    text(data) {
        return data.toString('ascii');
    },
    temperature(data) {
        return data.readInt8(0) / 2 - 20;
    },
    rotation(data) {
        return Math.round(1875000 / data.readInt16BE(0));
    },
    sensorsConnected(data) {
        const Bit2Bool = function (field, bit) {
            return Boolean(field & bit);
        };
        const field = data.readInt8(0);
        return {
            'outside air': Bit2Bool(field, 0x01),
            'supply air': Bit2Bool(field, 0x02),
            'outgoning air': Bit2Bool(field, 0x04),
            'exhaust air': Bit2Bool(field, 0x08),
            'ground heat exchanger': Bit2Bool(field, 0x10),
            'preheater': Bit2Bool(field, 0x20),
            'cooker hood': Bit2Bool(field, 0x40)
        };
    },
    bypass(data) {
        const bypassValue = data.readInt8(0);
        if (bypassValue === 0xFF) return undefined;
        return bypassValue;
    },
    preheat(data) {
        const preheatValue = data.readInt8(0);
        if (preheatValue === 0) return 'Closed';
        if (preheatValue === 1) return 'Open';
        if (preheatValue === 2) return 'Unknown';
        return preheatValue;
    },
    summerMode(data) {
        const mode = data.readInt16BE(0);
        if (mode === 0) return 'No (winter)';
        if (mode === 1) return 'summer';
        return mode;
    },
    errorA(data) {
        const getBit = function (value) {
            let count = 0;
            while (value > 1) {
                count++;
                value /= 2;
            }
            return count;
        };
        return `A${getBit(data.readInt8(0))}`;
    },
    errorE(data) {
        return data.readInt8(0);
    },
    errorEA(data) {
        return data.readInt8(0);
    },
    errorAhigh(data) {
        return data.readInt8(0);
    },
    filterState(data) {
        return Boolean(data.readInt8(0));
    }
};

const writer = {
    levelValue(value) {
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        return [value];
    },
    temperature(temperature) {
        const normTemperature = (temperature + 20) * 2;
        return [normTemperature];
    },
    bool(value) {
        return [value ? 0x01 : 0x00];
    },
    levelEnum(level) {
        if (level == null) throw new Error('level not set');
        const levels = [{
            key: 'auto',
            value: 0x00
        }, {
            key: 'away',
            value: 0x01
        }, {
            key: '0',
            value: 0x01
        }, {
            key: 'low',
            value: 0x02
        }, {
            key: '1',
            value: 0x02
        }, {
            key: 'middle',
            value: 0x03
        }, {
            key: '2',
            value: 0x03
        }, {
            key: 'high',
            value: 0x04
        }, {
            key: '3',
            value: 0x04
        }];
        level = level.toString();
        const match = levels.find(item => item.key === level);
        if (match) {
            return [match.value];
        }
        throw new Error(`unknown level: ${level}`);
    }
};

const commands = [
    // ****************
    // READING COMMANDS
    // ****************
    {
        name: 'getBootloaderVersion',
        label: 'Bootloader version',
        command: [0x00, 0x67],
        arg: [],
        response: [0x00, 0x68],
        description: [{
            length: 1,
            reader: reader.int8,
            name: 'major',
            label: 'Version Major'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'minor',
            label: 'Version Minor'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'beta',
            label: 'Beta'
        }, {
            length: 10,
            reader: reader.text,
            name: 'deviceName',
            label: 'Device name'
        }]
    },
    {
        name: 'getFirmwareVersion',
        label: 'Firmware version',
        command: [0x00, 0x69],
        arg: [],
        response: [0x00, 0x6A],
        description: [{
            length: 1,
            reader: reader.int8,
            name: 'major',
            label: 'Version Major'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'minor',
            label: 'Version Minor'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'beta',
            label: 'Beta'
        }, {
            length: 10,
            reader: reader.text,
            name: 'deviceName',
            label: 'Device name'
        }]
    },
    {
        name: 'getFlapState',
        label: 'Flap state',
        command: [0x00, 0x0D],
        arg: [],
        response: [0x00, 0x0E],
        description: [{
            length: 1,
            reader: reader.bypass,
            name: 'bypass',
            label: 'Bypass',
            unit: '%'
        }, {
            length: 1,
            reader: reader.preheat,
            name: 'preheat',
            label: 'Preheat'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'bypassMotorCurrent',
            label: 'Bypass Motor Current',
            unit: 'A'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'preheatMotorCurrent',
            label: 'Preheat Motor Current',
            unit: 'A'
        }]
    },
    {
        name: 'getFanState',
        label: 'Fan state',
        command: [0x00, 0x0B],
        arg: [],
        response: [0x00, 0x0C],
        description: [{
            length: 1,
            reader: reader.int8,
            name: 'supplyAir',
            label: 'Supply air',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'outgoingAir',
            label: 'Outgoing air',
            unit: '%'
        }, {
            length: 2,
            reader: reader.rotation,
            name: 'rotaitionsSupply',
            label: 'Rotaitions supply',
            unit: 'rpm'
        }, {
            length: 2,
            reader: reader.rotation,
            name: 'rotaitionsOutgoing',
            label: 'Rotaitions outgoing',
            unit: 'rpm'
        }]
    },

    {
        name: 'getBypassControllerState',
        label: 'Bypass controller state',
        command: [0x00, 0xDF],
        arg: [],
        response: [0x00, 0xE0],
        description: [{
            length: 2,
            reader: reader.int16,
            name: 'ignore',
            label: 'ignore'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'bypassCoefficient',
            label: 'Bypass coefficient'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'bypassLevel',
            label: 'Bypass level'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'bypassAdjustment',
            label: 'Bypass adjustment'
        }, {
            length: 2,
            reader: reader.summerMode,
            name: 'summerMode',
            label: 'Summer mode'
        }]
    },
    {
        name: 'getOperatingHours',
        label: 'Operating hours',
        command: [0x00, 0xDD],
        arg: [],
        response: [0x00, 0xDE],
        description: [{
            length: 3,
            reader: reader.int24,
            name: 'away',
            label: 'away',
            unit: 'h'
        }, {
            length: 3,
            reader: reader.int24,
            name: 'low',
            label: 'low',
            unit: 'h'
        }, {
            length: 3,
            reader: reader.int24,
            name: 'middle',
            label: 'middle',
            unit: 'h'
        }, {
            length: 2,
            reader: reader.int16,
            name: 'frostProtection',
            label: 'frost protection',
            unit: 'h'
        }, {
            length: 2,
            reader: reader.int16,
            name: 'preHeating',
            label: 'preheating',
            unit: 'h'
        }, {
            length: 2,
            reader: reader.int16,
            name: 'bypassOpen',
            label: 'bypass open',
            unit: 'h'
        }, {
            length: 2,
            reader: reader.int16,
            name: 'filter',
            label: 'filter',
            unit: 'h'
        }, {
            length: 3,
            reader: reader.int24,
            name: 'high',
            label: 'high',
            unit: 'h'
        }]
    },
    {
        name: 'getVentilationLevel',
        label: 'Get ventilation levles',
        command: [0x00, 0xCD],
        arg: [],
        response: [0x00, 0xCE],
        description: [{
            length: 1,
            reader: reader.int8,
            name: 'exhaustAway',
            label: 'Exhaust fan level away',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'exhaustLow',
            label: 'Exhaust fan level low',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'exhaustMiddle',
            label: 'Exhaust fan level middle',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'supplyAway',
            label: 'Supply fan level away',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'supplyLow',
            label: 'Supply fan level low',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'supplyMiddle',
            label: 'Supply fan level middle',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'exhaustCurrent',
            label: 'Current exhaust fan level',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'supplyCurrent',
            label: 'Current supply fan level'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'currentLevel',
            label: 'Current ventilation level',
            unit: '%'
        }, {
            length: 1,
            reader: reader.bool,
            name: 'supplyFanRunning',
            label: 'Supply fan is running'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'exhaustHigh',
            label: 'Exhaust fan level high',
            unit: '%'
        }, {
            length: 1,
            reader: reader.int8,
            name: 'supplyHigh',
            label: 'Exhaust fan level high',
            unit: '%'
        }]
    },
    {
        name: 'getTemperatures',
        label: 'Temperatures',
        command: [0x00, 0xD1],
        arg: [],
        response: [0x00, 0xD2],
        description: [{
            length: 1,
            reader: reader.temperature,
            name: 'comfort',
            label: 'comfort',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'outsideAir',
            label: 'outside air',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'supplyAir',
            label: 'supply air',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'outgoingAir',
            label: 'outgoing air',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'exhaustAir',
            label: 'exhaust air',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.sensorsConnected,
            name: 'sensorConnected',
            label: 'sensor connected'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'groundHeatExchanger',
            label: 'ground heat exchanger',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'preheating',
            label: 'preheating',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'cookerHood',
            label: 'cooker hood',
            unit: '°C'
        }]
    },
    {
        name: 'getTemperatureStates',
        label: 'Temperature states',
        command: [0x00, 0x0F],
        arg: [],
        response: [0x00, 0x10],
        description: [{
            length: 1,
            reader: reader.temperature,
            name: 'outsideAir',
            label: 'outside air',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'supplyAir',
            label: 'supply air',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'outgoingAir',
            label: 'outgoing air',
            unit: '°C'
        }, {
            length: 1,
            reader: reader.temperature,
            name: 'exhaustAir',
            label: 'exhaust air',
            unit: '°C'
        }]
    },
    {
        name: 'getFaults',
        label: 'Operating faults',
        command: [0x00, 0xD9],
        arg: [],
        response: [0x00, 0xDA],
        description: [{
            length: 1,
            reader: reader.errorA,
            name: 'currentErrorA',
            label: 'current error A'
        }, {
            length: 1,
            reader: reader.errorE,
            name: 'currentErrorE',
            label: 'current error E'
        }, {
            length: 1,
            reader: reader.errorA,
            name: 'lastErrorA',
            label: 'last error A'
        }, {
            length: 1,
            reader: reader.errorE,
            name: 'lastErrorE',
            label: 'last error E'
        }, {
            length: 1,
            reader: reader.errorA,
            name: 'penultimateErrorA',
            label: 'penultimate error A'
        }, {
            length: 1,
            reader: reader.errorE,
            name: 'penultimateErrorE',
            label: 'penultimate error E'
        }, {
            length: 1,
            reader: reader.errorA,
            name: 'antepenultimateErrorA',
            label: 'antepenultimate error A'
        }, {
            length: 1,
            reader: reader.errorE,
            name: 'antepenultimateErrorE',
            label: 'antepenultimate error E'
        }, {
            length: 1,
            reader: reader.filterState,
            name: 'replaceFilter',
            label: 'replace filter'
        }, {
            length: 1,
            reader: reader.errorEA,
            name: 'currentErrorEA',
            label: 'current error EA'
        }, {
            length: 1,
            reader: reader.errorEA,
            name: 'lastErrorEA',
            label: 'last error EA'
        }, {
            length: 1,
            reader: reader.errorEA,
            name: 'penultimateErrorEA',
            label: 'penultimate error EA'
        }, {
            length: 1,
            reader: reader.errorEA,
            name: 'antepenultimateErrorEA',
            label: 'antepenultimate error EA'
        }, {
            length: 1,
            reader: reader.errorAhigh,
            name: 'currentErrorAHigh',
            label: 'current error A high'
        }, {
            length: 1,
            reader: reader.errorAhigh,
            name: 'lastErrorAHigh',
            label: 'last error A high'
        }, {
            length: 1,
            reader: reader.errorAhigh,
            name: 'penultimateErrorAHigh',
            label: 'penultimate error A high'
        }, {
            length: 1,
            reader: reader.errorAhigh,
            name: 'antepenultimateErrorAHigh',
            label: 'antepenultimate error A high'
        }]
    },
    // ****************
    // WRITING COMMANDS
    // ****************
    {
        name: 'setLevel',
        label: 'Set level',
        command: [0x00, 0x99],
        arg: [{
            writer: writer.levelEnum,
            name: 'level',
            label: 'level'
        }]
    },
    {
        name: 'setComfortTemperature',
        label: 'Set comfort temperature',
        command: [0x00, 0xD3],
        arg: [{
            writer: writer.temperature,
            name: 'temperature',
            label: 'comfort temperature'
        }]
    },
    {
        name: 'setVentilationLevel',
        label: 'Set ventilation level',
        command: [0x00, 0xCF],
        arg: [{
            writer: writer.levelValue,
            name: 'exhaustAway',
            label: 'exhaust away',
            unit: '%'
        }, {
            writer: writer.levelValue,
            name: 'exhaustLow',
            label: 'exhaust low',
            unit: '%'
        }, {
            writer: writer.levelValue,
            name: 'exhaustMiddle',
            label: 'exhaust middle',
            unit: '%'
        }, {
            writer: writer.levelValue,
            name: 'exhaustHigh',
            label: 'exhaust high',
            unit: '%'
        }, {
            writer: writer.levelValue,
            name: 'supplyAway',
            label: 'supply away',
            unit: '%'
        }, {
            writer: writer.levelValue,
            name: 'supplyLow',
            label: 'supply low',
            unit: '%'
        }, {
            writer: writer.levelValue,
            name: 'supplyMiddle',
            label: 'supply middle',
            unit: '%'
        }, {
            writer: writer.levelValue,
            name: 'supplyHigh',
            label: 'supply high',
            unit: '%'
        }]
    },
    {
        name: 'reset',
        label: 'Reset and self test',
        command: [0x00, 0xDB],
        arg: [{
            writer: writer.bool,
            name: 'resetFaults',
            label: 'reset faults'
        }, {
            writer: writer.bool,
            name: 'resetSettings',
            label: 'reset settings'
        }, {
            writer: writer.bool,
            name: 'runSelfTest',
            label: 'run self test'
        }, {
            writer: writer.bool,
            name: 'resetFilterTimer',
            label: 'reset filter operating hours'
        }]
    }
];

module.exports = {
    byRespose(response) {
        return commands.find((element) => {
            if (!element.response) return false;
            return element.response[0] === response[0] && element.response[1] === response[1];
        });
    },
    byName(name) {
        return commands.find((element) => {
            return element.name === name;
        });
    }
};
