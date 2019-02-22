# comfoair

### Reads and controls ventilation devices like Zehnder ComfoAir 350 with **Node.js**

[![npm version](https://badge.fury.io/js/comfoair.svg)](https://badge.fury.io/js/comfoair)
[![Dependency Status](https://david-dm.org/coolchip/node-comfoair.svg)](https://david-dm.org/coolchip/node-comfoair)
[![npm](https://img.shields.io/npm/l/comfoair.svg)](https://www.npmjs.com/package/comfoair)

**Comfoair is an Open Source Node.js implementaion of the communication protocoll done and used by Zehnder. You can use this libary to control your personal ventialtion system.**

This work based on the protocol description at http://www.see-solutions.de/sonstiges/Protokollbeschreibung_ComfoAir.pdf, the very usefull [openHAB binding 'ComfoAir'](
https://www.openhab.org/addons/bindings/comfoair1/), the fantastic [FHEM module 'ComfoAir'](https://wiki.fhem.de/wiki/ComfoAir) and a little bit research of my own. Hope you will like it.

### Supports the following systems (afaik)

* Zehnder ComfoAir 350
* StorkAir WHR930
* Wernig/Santos G90-380
* Paul 370 DC

## How to use

Connect your unit via serial bus and configure the port in your code. The comfoair library using [serialport](https://github.com/node-serialport/node-serialport), so you can use every port (and syntax), that serialport is supporting. The speed (baud) should always be 9600, this is also default.
If your ventilation device - like mine - is too far away from your controling system and you have lan/wlan access, you can pipe your serial port through ethernet with ser2net and socat. Look at this nice description for example: https://www.acmesystems.it/socat.
The comfoair lib can either be uses as stream or simply by calling the given functions.

## Install

Simply

```bash
npm install comfoair
```

## Examples

Depends on how you like it

### By function call

Create an object and call one of the functions, given from the [API](#API).

To get your firmware version and device name:

```javascript
const Comfoair = require('comfoair');

const ventilationConnector = new Comfoair({
    port: '/dev/ttyUSB0',
    baud: 9600
});

ventilationConnector.getFirmwareVersion((err, resp) => {
    ventilationConnector.close();
    if (err) return console.error(err.message);
    console.log(resp);
});
```

To set the ventilation level:

```javascript
const Comfoair = require('comfoair');

const ventilationConnector = new Comfoair({
    port: '/dev/ttyUSB0',
    baud: 9600
});

ventilationConnector.setLevel('high', (err, resp) => {
    ventilationConnector.close();
    if (err) return console.error(err.message);
    console.log(resp);
});
```

### As streaming object

Also you can use it as a duplex stream.

```javascript
const Comfoair = require('comfoair');

const ventilationConnector = new Comfoair({
    port: '/dev/ttyUSB0',
    baud: 9600
});

ventilationConnector.on('data', chunk => {
    console.log(chunk);
    if (chunk.type === 'RES') {
        comfoair.close();
    }
});

const command = {
    name: 'setLevel',
    params: {
        level
    }
});

comfoair.write(command, (err) => {
    if (err) return console.error(err.message);
});
```

## API

#### getBootloaderVersion

Request bootloader version and device type. No parameter required.

```javascript
getBootloaderVersion(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Bootloader version",
        "major": {
            "value": 3,
            "label": "Version Major"
        },
        "minor": {
            "value": 60,
            "label": "Version Minor"
        },
        "beta": {
            "value": 32,
            "label": "Beta"
        },
        "deviceName": {
            "value": "CA350 luxe",
            "label": "Device name"
        }
    }
}
```

#### getFirmwareVersion

Request firmware version and device type. No parameter required.

```javascript
getFirmwareVersion(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Firmware version",
        "major": {
            "value": 3,
            "label": "Version Major"
        },
        "minor": {
            "value": 60,
            "label": "Version Minor"
        },
        "beta": {
            "value": 32,
            "label": "Beta"
        },
        "deviceName": {
            "value": "CA350 luxe",
            "label": "Device name"
        }
    }
}
```

#### getFanState

Request state of the supply and the exhaust fan. No parameter required.

```javascript
getFanState(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Fan state",
        "supplyAir": {
            "value": 35,
            "label": "Supply air",
            "unit": "%"
        },
        "outgoingAir": {
            "value": 35,
            "label": "Outgoing air",
            "unit": "%"
        },
        "rotaitionsSupply": {
            "value": 1138,
            "label": "Rotaitions supply",
            "unit": "rpm"
        },
        "rotaitionsOutgoing": {
            "value": 1120,
            "label": "Rotaitions outgoing",
            "unit": "rpm"
        }
    }
}
```

#### getOperatingHours

Request operating hours of the different modes. No parameter required.

```javascript
getOperatingHours(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Operating hours",
        "away": {
            "value": 13492,
            "label": "away",
            "unit": "h"
        },
        "low": {
            "value": 12833,
            "label": "low",
            "unit": "h"
        },
        "middle": {
            "value": 7699,
            "label": "middle",
            "unit": "h"
        },
        "frostProtection": {
            "value": 662,
            "label": "frost protection",
            "unit": "h"
        },
        "preHeating": {
            "value": 0,
            "label": "preheating",
            "unit": "h"
        },
        "bypassOpen": {
            "value": 10008,
            "label": "bypass open",
            "unit": "h"
        },
        "filter": {
            "value": 1825,
            "label": "filter",
            "unit": "h"
        },
        "high": {
            "value": 1068,
            "label": "high",
            "unit": "h"
        }
    }
}
```

#### getVentilationLevel

Request ventilation levels. No parameter required.

```javascript
getVentilationLevel(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Get ventilation levles",
        "exhaustAway": {
            "value": 15,
            "label": "Exhaust fan level away",
            "unit": "%"
        },
        "exhaustLow": {
            "value": 35,
            "label": "Exhaust fan level low",
            "unit": "%"
        },
        "exhaustMiddle": {
            "value": 50,
            "label": "Exhaust fan level middle",
            "unit": "%"
        },
        "supplyAway": {
            "value": 15,
            "label": "Supply fan level away",
            "unit": "%"
        },
        "supplyLow": {
            "value": 35,
            "label": "Supply fan level low",
            "unit": "%"
        },
        "supplyMiddle": {
            "value": 50,
            "label": "Supply fan level middle",
            "unit": "%"
        },
        "exhaustCurrent": {
            "value": 15,
            "label": "Current exhaust fan level",
            "unit": "%"
        },
        "supplyCurrent": {
            "value": 15,
            "label": "Current supply fan level",
            "unit": "%"
        },
        "currentLevel": {
            "value": 1,
            "label": "Current ventilation level",
            "unit": "%"
        },
        "supplyFanRunning": {
            "value": true,
            "label": "Supply fan is running"
        },
        "exhaustHigh": {
            "value": 70,
            "label": "Exhaust fan level high",
            "unit": "%"
        },
        "supplyHigh": {
            "value": 70,
            "label": "Exhaust fan level high",
            "unit": "%"
        }
    }
}
```

#### getTemparatures

Request current temperatures. No parameter required.

```javascript
getTemparatures(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Temperatures",
        "comfort": {
            "value": 21,
            "label": "comfort",
            "unit": "°C"
        },
        "outsideAir": {
            "value": 11,
            "label": "outside air",
            "unit": "°C"
        },
        "supplyAir": {
            "value": 20.5,
            "label": "supply air",
            "unit": "°C"
        },
        "outgoingAir": {
            "value": 19.5,
            "label": "outgoing air",
            "unit": "°C"
        },
        "exhaustAir": {
            "value": 11.5,
            "label": "exhaust air",
            "unit": "°C"
        },
        "sensorConnected": {
            "value": [],
            "label": "sensor connected"
        },
        "groundHeatExchanger": {
            "value": 0,
            "label": "ground heat exchanger",
            "unit": "°C"
        },
        "preheating": {
            "value": 0,
            "label": "preheating",
            "unit": "°C"
        },
        "cookerHood": {
            "value": 0,
            "label": "cooker hood",
            "unit": "°C"
        }
    }
}
```

#### getTemparatureStates

Request temperature states. No parameter required.

```javascript
getTemparatureStates(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Temperature states",
        "outsideAir": {
            "value": 11,
            "label": "outside air",
            "unit": "°C"
        },
        "supplyAir": {
            "value": 20.5,
            "label": "supply air",
            "unit": "°C"
        },
        "outgoingAir": {
            "value": 19,
            "label": "outgoing air",
            "unit": "°C"
        },
        "exhaustAir": {
            "value": 11.5,
            "label": "exhaust air",
            "unit": "°C"
        }
    }
}
```

#### getFaults

Request operation faults. No parameter required.

```javascript
getFaults(callback);
```

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Operating hours",
        "away": {
            "value": 13492,
            "label": "away",
            "unit": "h"
        },
        "low": {
            "value": 12833,
            "label": "low",
            "unit": "h"
        },        
        "middle": {
            "value": 7699,
            "label": "middle",
            "unit": "h"
        },
        "frostProtection": {
            "value": 662,
            "label": "frost protection",
            "unit": "h"
        },
        "preHeating": {
            "value": 0,
            "label": "preheating",
            "unit": "h"
        },
        "bypassOpen": {
            "value": 10008,
            "label": "bypass open",
            "unit": "h"
        },
        "filter": {
            "value": 1824,
            "label": "filter",
            "unit": "h"
        },
        "high": {
            "value": 1068,
            "label": "high",
            "unit": "h"
        }
    }
}
```

#### setLevel

Set the ventilation level.

| Parameter | Type          | Description                              |
|:----------|:--------------|:-----------------------------------------|
| level     | string/number | 'away', 'low', 'middle', 'high', 1, 2, 3 |

Where 'low' is the same as 1 and so on. The numbers 1 to 3 can also be passed als string.

```javascript
setLevel('high', callback);
```

```json
{
    "type": "ACK"
}
```

#### setComfortTemperature

Set the ventilation level.

| Parameter   | Type   | Description                           |
|:------------|:-------|:--------------------------------------|
| temperature | number | Temperature to be held by the device  |

```javascript
setComfortTemperature(20, callback);
```

```json
{
    "type": "ACK"
}
```

#### setVentilationLevel

Set the rotaition speed of the different ventilation levels for supply and exhaust fan.

| Parameter     | Type   | Description                         |
|:--------------|:-------|:------------------------------------|
| exhaustAway   | number | Speed for away level, exhaust fan   |
| exhaustLow    | number | Speed for low level, exhaust fan    |
| exhaustMiddle | number | Speed for middle level, exhaust fan |
| exhaustHigh   | number | Speed for high level, exhaust fan   |
| supplyAway    | number | Speed for away level, supply fan    |
| supplyLow     | number | Speed for low level, supply fan     |
| supplyMiddle  | number | Speed for middle level, supply fan  |
| supplyHigh    | number | Speed for high level, supply fan    |

```javascript
setVentilationLevel(15, 35, 50, 70, 15, 35, 50, 70, callback);
```

```json
{
    "type": "ACK"
}
```

#### reset

Reset faults/settings/filter timer or run self test.

| Parameter       | Type    | Description       |
|:----------------|:--------|:------------------|
| resetFaults     | boolean | Clear all faults  |
| resetSettings   | boolean | Reset settings    |
| runSelfTest     | boolean | Run self test     |
| resetFilterTime | boolean | Rest filter timer |

```javascript
reset(false, false, false, true, callback);
```

```json
{
    "type": "ACK"
}
```