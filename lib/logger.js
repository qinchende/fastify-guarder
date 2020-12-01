const Log = module.exports = Gd.global('Log', function() {
    let me = {};

    function _logTime() {
        return `[${(new Date()).format('MM-dd hh:mm:ss')}]`;
    }

    me.log = function(msg) {
        console.log(_logTime() + (JSON.stringify(msg) || ''));
    };

    me.newLine = function(msg, end) {
        console.log('\n' + _logTime() + (JSON.stringify(msg) || '') + (end === true ? '\n' : ''));
    };

    me.p = me.print = function(err, ret) {
        if (err) { me.log(`Err: ${err}`); }
        else { me.log(ret); }
    };

    me.err = function(err, ret) {
        if (err) { me.log(`Err: ${err}`); }
    };

    me.errExit = function(err, ret) {
        if (err) {
            me.log(err);
            me.log(ret);
            process.exit();
        }
    };

    return me;
});