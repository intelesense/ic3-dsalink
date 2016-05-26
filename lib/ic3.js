var xml2js = require('xml2js'),
cot = require('./cotschemas'),
ic3model = require('./ic3model'),
_ = require("lodash"),
xml_parser = new xml2js.Parser(),
data = {};

module.exports = {
  update: update
}
/*
Receives data from the comm wire and updates the appropriate data objects.
*/
function update (message, callback){
  console.log("Last packet " + new Date().toISOString());
  parseMessage(message,function(err, ic3object){
    if(err){
      callback(err);
    }else{
      data.last = ic3object;
      data.summary = summary(ic3object);
      callback(null, data);
    }
  })
};

/********************************************************************
*
*    FUNCTIONS FOR PARSING THE INCOMING DATA.
*********************************************************************/
function summary(ic3obj){
    var summ = {};
    summ.name = ic3obj.name
    summ.timestamp = ic3obj.latest_timestamp || 0;
    summ.location = ic3obj.location || {};
    summ.readings = _.reduce(ic3obj.sensors, function(result, sensor){
        return  _.union((result || []), sensor.readings);
    });
    return summ;
}
function parseMessage(message, callback){
    //message in COT xml
    xml_parser.parseString(message, function (err, jsobject) {
        if(err){
          console.log("ERROR: ", err);
          callback(err);
        }else{
            //COT to IC3.
            cot.buildIc3Object(jsobject,function(err, ic3object){
               if(err){
                  console.log("ERROR: ", err);
                  callback(err);
                }else{
                  callback(null, ic3object);
                }
            });
        }
    });
};
