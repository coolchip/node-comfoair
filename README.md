# comfoair

### Reads and controls ventilation devices like Zehnder ComfoAir 350 with **Node.js**





**Comfoair is an Open Source Node.js implementaion of the communication protocoll done and used by Zehnder. You can use this libary to control your personal ventialtion system.**

This work based on the protocol description at http://www.see-solutions.de/sonstiges/Protokollbeschreibung_ComfoAir.pdf, the very usefull [openHAB binding 'ComfoAir'](https://www.openhab.org/addons/bindings/comfoair/#comfoair-binding), the fantastic [FHEM module 'ComfoAir'](https://wiki.fhem.de/wiki/ComfoAir) and a little bit research of my own. Hope you will like it.

### Supports the following systems (afaik)

* Zehnder ComfoAir 350
* StorkAir WHR930
* Wernig/Santos G90-380
* Paul 370 DC

## Status

| Category         | Status                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Version          | [![npm version](https://badge.fury.io/js/comfoair.svg)](https://badge.fury.io/js/comfoair)                                |
| Dependencies     | [![Dependency Status](https://david-dm.org/coolchip/node-comfoair.svg)](https://david-dm.org/coolchip/node-comfoair)      |
| License          | [![npm](https://img.shields.io/npm/l/comfoair.svg)](https://www.npmjs.com/package/comfoair)                               |

## Install

Simply

```bash
npm install comfoair
```

## How to use

Connect your unit via serial bus and configure the port in your code. The comfoair library using [serialport](https://github.com/node-serialport/node-serialport), so you can use every port (and syntax), that serialport is supporting. The speed (baud) should always be 9600, this is also default.
If your ventilation device - like mine - is too far away from your controling system and you have lan/wlan access, you can pipe your serial port through ethernet with ser2net and socat. Look at this nice description for example: https://www.acmesystems.it/socat.
The comfoair lib can either be uses as stream or simply by calling the given functions.

## Examples

Depends on how you like it

### By function call

Create an object and call one of the functions, given from the [API](#API).

To get your firmware version and device name:

```javascript
const Comfoair = require('comfoair');

const ventilation = new Comfoair({
    port: '/dev/ttyUSB0',
    baud: 9600
});

ventilation.on('error', (err) => {
    console.log('ERROR: ' + err.message);
});

ventilation.on('close', () => {
    console.log('Connection to Comfoair closed');
});

ventilation.on('open', () => {
    console.log('Connected to Comfoair :)');

    ventilation.getTemperatures((err, resp) => {
        if (err) console.log(err.message);
        else console.log(resp);
	
	    ventilation.close();
    });
});
```

To set the ventilation level:

```javascript
const Comfoair = require('comfoair');

const ventilation = new Comfoair({
    port: '/dev/ttyUSB0',
    baud: 9600
});

ventilation.on('error', (err) => {
    console.log('ERROR: ' + err.message);
});

ventilation.on('close', () => {
    console.log('Connection to Comfoair closed');
});

ventilation.on('open', () => {
    console.log('Connected to Comfoair :)');

    ventilation.setLevel('middle', (err, resp) => {
        if (err) console.log(err.message);
        else console.log(resp);

        ventilation.close();
    });
});
```

### As streaming object

Also you can use it as a duplex stream.

```javascript
const ComfoairStream = require('comfoair').ComfoairStream;

const ventilationStream = new ComfoairStream({
    port: '/dev/ttyUSB0',
    baud: 9600
});

ventilationStream.on('error', (err) => {
    console.log('ERROR: ' + err.message);
});

ventilationStream.on('close', () => {
    console.log('Connection to Comfoair closed');
});

ventilationStream.on('data', chunk => {
    console.log(chunk);
    if (chunk.type === 'RES') {
        ventilationStream.close();
    }
});

const command = {
    name: 'getFanState',
    params: {}
};

ventilationStream.on('open', () => {
    console.log('Connected to Comfoair :)');

    ventilationStream.write(command, (err) => {
        if (err) return console.log('ERROR: ' + err.message);
    });
});
```

## API

#### getBootloaderVersion

Request bootloader version and device type. No parameter required.

```javascript
getBootloaderVersion(callback);
```

Response

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

Response

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

Response

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
        "rotationsSupply": {
            "value": 1138,
            "label": "Rotations supply",
            "unit": "rpm"
        },
        "rotationsOutgoing": {
            "value": 1120,
            "label": "Rotations outgoing",
            "unit": "rpm"
        }
    }
}
```

#### getFlapState

Request state of the bypass and preheater. No parameter required.

```javascript
getFlapState(callback);
```

Response

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Flap state",
        "bypass": {
            "value": 0,
            "label": "Bypass",
            "unit": "%"
        },
        "preheat": {
            "value": "Unknown",
            "label": "Preheat"
        },
        "bypassMotorCurrent": {
            "value": 0,
            "label": "Bypass Motor Current",
            "unit": "A"
        },
        "preheatMotorCurrent": {
            "value": 0,
            "label": "Preheat Motor Current",
            "unit": "A"
        }
    }
}
```

#### getOperatingHours

Request operating hours of the different modes. No parameter required.

```javascript
getOperatingHours(callback);
```

Response

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

Response

```json
{
    "type": "RES",
    "valid": true,
    "payload": {
        "description": "Get ventilation levels",
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

#### getTemperatures

Request current temperatures. No parameter required.

```javascript
getTemperatures(callback);
```

Response

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

#### getTemperatureStates

Request temperature states. No parameter required.

```javascript
getTemperatureStates(callback);
```

Response

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

Response

```json
{  
   "description":"Operating faults",
   "currentErrorA":{  
      "value":"A0",
      "label":"current error A"
   },
   "currentErrorE":{  
      "value":0,
      "label":"current error E"
   },
   "lastErrorA":{  
      "value":"A0",
      "label":"last error A"
   },
   "lastErrorE":{  
      "value":0,
      "label":"last error E"
   },
   "penultimateErrorA":{  
      "value":"A0",
      "label":"penultimate error A"
   },
   "penultimateErrorE":{  
      "value":0,
      "label":"penultimate error E"
   },
   "antepenultimateErrorA":{  
      "value":"A0",
      "label":"antepenultimate error A"
   },
   "antepenultimateErrorE":{  
      "value":0,
      "label":"antepenultimate error E"
   },
   "replaceFilter":{  
      "value":true,
      "label":"replace filter"
   },
   "currentErrorEA":{  
      "value":0,
      "label":"current error EA"
   },
   "lastErrorEA":{  
      "value":0,
      "label":"last error EA"
   },
   "penultimateErrorEA":{  
      "value":0,
      "label":"penultimate error EA"
   },
   "antepenultimateErrorEA":{  
      "value":0,
      "label":"antepenultimate error EA"
   },
   "currentErrorAHigh":{  
      "value":0,
      "label":"current error A high"
   },
   "lastErrorAHigh":{  
      "value":0,
      "label":"last error A high"
   },
   "penultimateErrorAHigh":{  
      "value":0,
      "label":"penultimate error A high"
   },
   "antepenultimateErrorAHigh":{  
      "value":0,
      "label":"antepenultimate error A high"
   },
   "type":"RES"
}
```

#### setLevel

Set the ventilation level.

| Parameter | Type          | Description                                         |
|:----------|:--------------|:----------------------------------------------------|
| level     | string/number | 'away', 'low', 'middle', 'high', 0, 1, 2, 3, 'auto' |

Where 'away' is the same as 0, 'low' is the same as 1 and so on. The numbers 0 to 3 can also be passed als string. The setting 'auto' seems to be for the external Panel for the ventilation system and isn't testet.

```javascript
setLevel('high', callback);
```

Response

```json
{
    "type": "ACK"
}
```

#### setComfortTemperature

Set the comfort Temperature.

| Parameter   | Type   | Description                           |
|:------------|:-------|:--------------------------------------|
| temperature | number | Temperature to be held by the device  |

```javascript
setComfortTemperature(20, callback);
```

Response

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

Response

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

Response

```json
{
    "type": "ACK"
}
```

#### runCommand

It is also possible to pass the commands as strings. For this you can use this function.

```javascript

const commandName = 'setLevel';
const params = { level: 'away' };

runCommand(commandName, params, (err, response) => {
    if (err) return console.log(err.message);
    console.log(response);
});
```

### Additional info from [VincentSC](https://github.com/VincentSC)
Zehnder talks about intake, exhaust, supply and extract. Or extract, supply, incoming and outgoing.

This library uses supply, exhaust, outgoing and outside.

![intake-exhaust-supply-extract](https://github.com/coolchip/node-red-contrib-comfoair/blob/master/image1.png)

![image](https://github.com/coolchip/node-red-contrib-comfoair/blob/master/image2.png)

This is my guess how it translates:
- `outside` = intake / incoming
- `supply` = supply 
- `exhaust` = extract
- `outgoing` = exhaust / outgoing

## Migration to 1.x.x

There are only tiny API changes. The main difference is in using this module in streaming Mode. In Version 0.x.x you can simply use the same Module for function calls and streaming. Starting with 1.0.0 you have to choose the streaming module explicit.

0.x.x
```javascript
const Comfoair = require('comfoair');

const ventilationStream = new Comfoair({
    port: '/dev/ttyUSB0',
    baud: 9600
});
```

1.x.x
```javascript
const ComfoairStream = require('comfoair').ComfoairStream;

const ventilationStream = new ComfoairStream({
    port: '/dev/ttyUSB0',
    baud: 9600
});
```
