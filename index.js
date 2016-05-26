var DS = require('dslink'),
	os = require('os'),
	df = require('node-diskfree'),
	net = require("net"),
	ic3 = require("./lib/ic3"),
	provider = new DS.NodeProvider(),
	gbToBytes = 1024 * 1024 * 1024,
	pollerInterval = 2000,
	linkName = 'ic3-dslink',
	lastAverage;

var config = {
	TCP_HOST: "127.0.0.1",
	TCP_PORT: 8088,
	debug: true
}

var ic3Data = {};

	/****************************************************************************
	** TCP SOCKET HOST
	** for local communication with ic3_d
	****************************************************************************/
	var client = new net.Socket();
	var incommingDataBuffer= "";
	function connectIC3_D(){
	  try{
	  console.log("Starting IC3 Client");
	  client.connect(config.TCP_PORT, config.TCP_HOST, function() {
	      console.log('CONNECTED TO: ' + config.TCP_HOST + ':' + config.TCP_PORT);
	  });
	  // Add a 'data' event handler for the client socket
	  // data is what the server sent to this socket
	  client.on('data', function(data) {
	       if(config.debug){
	        console.log("\n\nSOCKET RECEIVED: " + data);
	       }
	      incommingDataBuffer = incommingDataBuffer + data;
	      var messageStart =incommingDataBuffer.lastIndexOf("<event");   //in case there is a bad incomplete event, skip it
	      var messageEnd =incommingDataBuffer.lastIndexOf("</event>");   //in case there is a bad incomplete event, skip it
	      if (messageStart>-1 && messageEnd>-1){
	          //got a whole message
	          var message = incommingDataBuffer.substring(messageStart,messageEnd+8);
	          processMessage(message);
	      }
	  });
	  // Add a 'close' event handler for the client socket
	  client.on('close', function() {
	      console.log('Connection closed');
	      //reopen connection.
	      client.connect(config.TCP_PORT, config.TCP_HOST, function() {
	          console.log('RE-CONNECTED TO: ' + config.TCP_HOST + ':' + config.TCP_PORT);
	      });
	  });

	  client.on('error', function(err){
	    console.log("Connection Error: ", err);
	  });

	}catch(err){
	  console.log("Error in socket: ", err);
	}
};

var processMessage = function(message){
	ic3.update(message, function(err, ic3object){
		ic3Data = ic3object;
		console.log("got it", ic3object.last.name);
		updateMetrics();
	});
}

var updateMetrics = function () {
	provider.getNode('/device').value = new DS.Value(ic3Data.summary ? ic3Data.summary.name : "NA");
	provider.getNode('/location').value = new DS.Value(ic3Data.summary ? JSON.stringify(ic3Data.summary.location) : "");
	provider.getNode('/time').value = new DS.Value(ic3Data.summary ? ic3Data.summary.timestamp : 0);
	updateSensors();
};

var updateSensors = function () {
	//memory
	if(ic3Data.summary && ic3Data.summary.readings.length > 0){
		provider.getNode('/readings/sensor').value = new DS.Value(ic3Data.summary.readings[0].name);
		provider.getNode('/readings/value').value = new DS.Value(ic3Data.summary.readings[0].value);
	}else{
		provider.getNode('/readings/sensor').value = new DS.Value("");
		provider.getNode('/readings/sensor').value = new DS.Value("");
	}
};

provider.load({
	device: {
		'$type': 'string',
		'?value': ''
	},
	location: {
		'$type': 'string',
		'?value': ''
	},
	time: {
		'$type': 'number',
		'?value': 0
	},
	readings: {
		sensor: {
			'$type': 'string',
			'?value': ''
		},
		value: {
			'$type': 'string',
			'?value': ''
		}
	}
});

(new DS.Link(linkName, provider)).connect();

connectIC3_D();
