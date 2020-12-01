// 微信平台接口
exports.wxInit = function(cnf) {
    var me = {
        opt: cnf || {}
    };
    var API = require('wechat-api');

    // access_token
    me.api = new API(cnf.appID, cnf.appSecret, function (cb) {
        cnf.redis.get(cnf.key.access_token, function(err, val) {
            if (err) { return cb(err); }
            cb(null, JSON.parse(val));
        });
    }, function (token, cb) {
        cnf.redis.setex(cnf.key.access_token, 7000, JSON.stringify(token), cb);
    });

    // 内网情况下，设置代理服务器
    if (cnf.agent === true) {
        var tunnel = require('tunnel');
        var agent = tunnel.httpsOverHttp({
            proxy: {
                host: '10.10.xx.xx',
                port: 8080
            }
        });
        me.api.setOpts({
            beforeRequest:function(options) {
                options.agent = agent;
            }
        });
    }

    // jsapi_ticket or wx_card_ticket
    function _ticketKey(key) {
        if (key === 'jsapi') { key = cnf.key.jsapi_ticket; }
        else if (key === 'wx_card') { key = cnf.key.wx_card_ticket; }
        else { key = false; }

        return key;
    }
    me.api.registerTicketHandle(function (type, cb) {
        type = _ticketKey(type);
        if (type === false) return cb('err');

        cnf.redis.get(type, function(err, val) {
            if (err) { return cb(err); }
            cb(null, JSON.parse(val));
        });
    }, function (type, token, cb) {
        type = _ticketKey(type);
        if (type === false) return cb('err');

        cnf.redis.setex(type, 7000, JSON.stringify(token), cb);
    });

    return me;
};
