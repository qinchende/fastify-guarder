Gd.conn.connMQTT = function (opt) {
    let me = {};

    var mqtt = require('mqtt');
    let client = me.client  = mqtt.connect(opt.url, opt);

    client.on('connect', function () {
        Log.log(`Broker ${opt.url} connected.`);
    });

    client.on('message', function (topic, message) {
        // message is Buffer
        Log.log('Broker: ' + message.toString());
        //client.end()
    });

    return me;
};
