/*
IC3 Data management functions: parsing, sorting, etc.
*/
'use strict'

/**********************************************************
*
*  ic3 data models.
************************************************************/

/*
Generic data structure to hold the device data.
each object will be created by one of the SensorSchema objects defined in
ic3schemas.js
*/
var Ic3Device = function(){
  this.deviceId = "";
  this.name = "";
  this.type = "";
  this.location = null; //latest gps location.
  this.latest_timestamp = 0; //time of latest reading
  this.time = 0; //current time
  this.latest_raw=null; //last raw message
  this.sysinfo = []; //device system information

  this.sensors = []; //array of connected sensors.

  this.network = { ip: "", netmask: "", gw: "", type: "wifi", network: "", status: "online"}; //network settings
  this.alerts = []; //array of triggered alerts
  this.analytics = []; //array of analytics processors.
  this.settings = { samplefreq: 0}; //current operational settings.

};

var Sensor = function(){
  this.id = null; //internal id of the sensor
  this.type = null; //type of sensor
  this.port = null; //device port
  this.name = ""; //friendly name for the sensor
  this.readings = []; //array of readings.
  this.lastSampleTime = null; //time of last reading
  this.timeseries = [];
  this.settings = {}; //sensor settings.
}

var SensorReading = function(){
  this.name = ""; //name of the readings
  this.value = null; //value of the readings
  this.unit = ""; //unit of measure
  this.type = ""; //type of reading (IMG, VAL, 360)
  this.timestamp = null; //timestamp of this reading.
}

//geo reference info.
var GpsLocation = function() {
  this.lat= null;
  this.lon= null;
  this.hae= null;
};

 module.exports = {
   Ic3Device: Ic3Device,
   Sensor: Sensor,
   SensorReading: SensorReading,
   GpsLocation: GpsLocation
 }
