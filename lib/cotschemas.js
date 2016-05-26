/*

Each device has a schema.
This schema transforms the raw object (parsed by docParser) into a Ic3Device
object.

*/
'use strict'

var ic3model = require('./ic3model');
var _ = require("lodash");

function buildIc3Object(input, callback){
   var ic3Obj = new ic3model.Ic3Device();
   ic3Obj.deviceId = new Buffer(input.event.$.uid).toString('base64');
   ic3Obj.name = input.event.$.uid;
   ic3Obj.type = deviceType(input.event.$.uid);
   if(input.event.point && input.event.point.length > 0){
     try{
       ic3Obj.location = {};
       ic3Obj.location.lat = input.event.point[0].$.lat;
       ic3Obj.location.lon = input.event.point[0].$.lon;
       ic3Obj.location.hae = input.event.point[0].$.hae;
       ic3Obj.location.sat = input.event.point[0].$.sat;
     }catch(err){
       console.log("ERROR: ", err);
       ic3Obj.location = null;
     }
   }
   ic3Obj.latest_timestamp = (input.event.$.time)? Date.parse(input.event.$.time) : 0;
   ic3Obj.time = Date.now();
   //ic3Obj.latest_raw = input;

   if(typeof Ic3DeviceFactory.transformers[ic3Obj.type] != "undefined"){
     console.log("Got " + ic3Obj.type, ic3Obj.name);
     var transformer = Ic3DeviceFactory.transformers[ic3Obj.type];
     ic3Obj.sensors = transformer(input.event.detail, ic3Obj);
   }else{
     callback("Ic3Obj error: Unknown device type: " + ic3Obj.type);
   }
   callback(null, ic3Obj);
}

function deviceType(string){
  string = string.toUpperCase();
  if(string.indexOf("ENV") > -1){
    return "vaisala";
  }
  if(string.indexOf("WIND") > -1){
    return "wind";
  }
  if(string.indexOf("IM3") > -1){
    return "im3";
  }
  if(string.indexOf("ANDROID") > -1){
    return "android";
  }
  if(string.indexOf("TRAP") > -1){
    return "trap";
  }

  if(string.indexOf("IC3") > -1){
    return "ic3";
  }

  if(string.indexOf("ICELL") > -1){
    return "icell";
  }

  console.log("ERROR: UNKNOWN TYPE: " + string);
  return "device";

}

var Ic3DeviceFactory = {};

/*Transformation functions*/
Ic3DeviceFactory.transformers = [];

Ic3DeviceFactory.transformers["trap"] = function(input, parent){
  var _sensors = [];
  if(typeof input == "undefined" || input.length == 0){
    return null;
  }
  var sensorMap = input[0];
  var datetime = (sensorMap["_flow-tags_"]) ? sensorMap["_flow-tags_"][0].$.Collaborate_server : "";
  datetime = (datetime.length > 0) ? Date.parse(datetime) : 0;
  _.mapKeys(sensorMap, function(value, key) {
    if(key != "_flow-tags_" && key != "$"){
      var _sensor = new ic3model.Sensor();
      _sensor.type="trap";
      _sensor.name = key;
      _sensor.lastSampleTime = datetime;
      if( key == "TRAP"){
        _.mapKeys(value[0], function(v, k){
          if(k!="$"){
            var _reading = new ic3model.SensorReading();
            _reading.name = k;
            _reading.value = v[0];
            _reading.type = key;
            _reading.timestamp = datetime;
            _sensor.readings.push(_reading);
          }
        });
      }else if(key == "anomaly"){
          var _reading = new ic3model.SensorReading();
          _reading.name = "typeI";
          _reading.value = value[0].typeI[0];
          _reading.timestamp = datetime;
          _sensor.readings.push(_reading);

          _reading = new ic3model.SensorReading();
          _reading.name = "typeII";
          _reading.value = value[0].typeII[0];
          _reading.timestamp = datetime;
          _sensor.readings.push(_reading);
      }
      _sensors.push(_sensor);
    }
  });

  return _sensors;
}

Ic3DeviceFactory.transformers["vaisala"] = function(input, parent){
  var _sensors = [];
  if(typeof input == "undefined" || input.length == 0){
    return null;
  }
  var sensorMap = input[0];
  var datetime = (sensorMap["_flow-tags_"]) ? sensorMap["_flow-tags_"][0].$.Collaborate_server : "";
  datetime = (datetime.length > 0) ? Date.parse(datetime) : 0;
  var value = sensorMap['remarks'];
  var _sensor = new ic3model.Sensor();
  _sensor.type="vaisala";
  _sensor.name = "environmental";
  _sensor.lastSampleTime = datetime;
    var val = value[0];
    var toks = val.split(",");
    toks.forEach(function(entry, index){
      var readingTokens = entry.split("=");
      if(readingTokens.length == 2){
        var _reading = new ic3model.SensorReading();
        _reading.name = readingTokens[0];
        _reading.value = readingTokens[1];
        _reading.type = "env";
        _reading.unit = "";
        _reading.timestamp = datetime;
        _sensor.readings.push(_reading);
      }
    });

  _sensors.push(_sensor);


  return _sensors;
}

Ic3DeviceFactory.transformers["icell"] = function(input, parent){
  var _sensors = [];
  if(typeof input == "undefined" || input.length == 0){
    return null;
  }
  var sensorMap = input[0];
  var datetime = (sensorMap["_flow-tags_"]) ? sensorMap["_flow-tags_"][0].$.Collaborate_server : "";
  datetime = (datetime.length > 0) ? Date.parse(datetime) : 0;
  var value = sensorMap['remarks'];
  var _sensor = new ic3model.Sensor();
  _sensor.type="ic3";
  _sensor.name = "icell";
  _sensor.lastSampleTime = datetime;
    var val = value[0];
    var toks = val.split(",");
    toks.forEach(function(entry, index){
      var readingTokens = entry.split("=");
      if(readingTokens.length == 2){
        var _reading = new ic3model.SensorReading();
        _reading.name = readingTokens[0];
        _reading.value = readingTokens[1];
        _reading.type = "env";
        _reading.unit = "";
        _reading.timestamp = datetime;
        _sensor.readings.push(_reading);
      }
    });

  _sensors.push(_sensor);


  return _sensors;
}


Ic3DeviceFactory.transformers["wind"] = function(input, parent){
  var _sensors = [];
  if(typeof input == "undefined" || input.length == 0){
    return null;
  }
  var sensorMap = input[0];
  var datetime = (sensorMap["_flow-tags_"]) ? sensorMap["_flow-tags_"][0].$.Collaborate_server : "";
  datetime = (datetime.length > 0) ? Date.parse(datetime) : 0;

  _.mapKeys(sensorMap, function(value, key) {
      var _sensor = new ic3model.Sensor();
      _sensor.type="wind";
      _sensor.name = key;
      _sensor.lastSampleTime = datetime;
      if( key == "environmental"){
        value.forEach(function(item, index){
          var _reading = new ic3model.SensorReading();
          _reading.name = item.$.name;
          _reading.value = item._;
          _reading.type = key;
          _reading.timestamp = datetime;
          _sensor.readings.push(_reading);
        });
        _sensors.push(_sensor);
      }

  });

  return _sensors;
}

Ic3DeviceFactory.transformers["ic3"] = function(input, parent){
  var _sensors = [];
  if(typeof input == "undefined" || input.length == 0){
    return null;
  }
  var sensorMap = input[0];
  var datetime = parent.latest_timestamp || 0;

  _.mapKeys(sensorMap, function(value, key) {
      var _sensor = new ic3model.Sensor();
      _sensor.type="ic3";
      _sensor.name = key;
      _sensor.lastSampleTime = datetime;
      if( key == "environmental"){
        value.forEach(function(item, index){
          var _reading = new ic3model.SensorReading();
          _reading.name = item.$.name;
          _reading.value = item._;
          _reading.type = key;
          _reading.timestamp = datetime;
          _sensor.readings.push(_reading);
        });
      }else if(key == "image"){
        var _reading = new ic3model.SensorReading();
        _reading.name = "url"
        _reading.value = value[0].$.url;
        _reading.type = "image";
        _reading.timestamp = datetime;
        _sensor.readings.push(_reading);
      }else if(key == "remarks"){
        var val = value[0];
        var toks = val.split(",");
        var temp = toks[1].split("=");
        var _reading = new ic3model.SensorReading();
        _reading.name = temp[0];
        _reading.value = temp[1];
        _reading.type = "temperature";
        _reading.unit = "C";
        _reading.timestamp = datetime;
        _sensor.readings.push(_reading);
      }
      _sensors.push(_sensor);
  });

  return _sensors;
}

Ic3DeviceFactory.transformers["im3"] = function(input, parent){
  var _sensors = [];
  if(typeof input == "undefined" || input.length == 0){
    return null;
  }
  var sensorMap = input[0];
  var datetime = parent.latest_timestamp || 0;

  _.mapKeys(sensorMap, function(value, key) {
      var _sensor = new ic3model.Sensor();
      _sensor.type="im3";
      _sensor.name = key;
      _sensor.lastSampleTime = datetime;
      if( key == "environmental"){
        value.forEach(function(item, index){
          var _reading = new ic3model.SensorReading();
          _reading.name = item.$.name;
          _reading.value = item._;
          _reading.type = key;
          _reading.timestamp = datetime;
          _sensor.readings.push(_reading);
        });
      }else if(key == "remarks"){
        var val = value[0];
        var toks = val.split(",");
        var temp = toks[1].split("=");
        var _reading = new ic3model.SensorReading();
        _reading.name = temp[0];
        _reading.value = temp[1];
        _reading.type = "temperature";
        _reading.unit = "C";
        _reading.timestamp = datetime;
        _sensor.readings.push(_reading);
      }
      _sensors.push(_sensor);
  });

  return _sensors;
}

module.exports = {
  buildIc3Object: buildIc3Object
}
