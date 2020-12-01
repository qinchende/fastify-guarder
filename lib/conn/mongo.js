
var mongoose = require('mongoose');

exports.connMongoOpt = function(conf){
    // Connect to mongodb
    var connectMongoOpt = function() {
        // mongoose.Promise = global.Promise;
        return mongoose.createConnection(conf.url, conf.options, function(err, docs){
            if (err) {
                console.log(err);
            } else {
                console.log("Connect mongo:", conf.url," successfully~~~~~");
            }
        });
    };

    // Error handler
    mongoose.connection.on('error', function(err) {
        console.log(err);
    });

    // Reconnect when closed
    mongoose.connection.on('disconnected', function() {
        console.log("Lost, now to reconnect ~~~~~");
        setTimeout(connectMongoOpt, 10000);
    });

    return connectMongoOpt();
};

module.exports = exports;