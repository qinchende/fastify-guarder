// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Connect to Redis DB by ioredis.
Gd.conn.connIORedis = function (c, rw) {
    c = Gd.applyClone(c);

    if (c.h) { c.host = c.h; delete c.h; }
    if (c.p) { c.port = c.p; delete c.p; }
    if (c.pass) { c.password = c.pass; delete c.pass; }

    if (c.n) { c.name = c.n; delete c.n; }
    if (c.s) { c.sentinels = c.s; delete c.s; }

    c.retryStrategy = function(times) { return Math.min(times * 1000, 60*1000); };
    c.sentinelRetryStrategy = function(times) { return Math.min(times * 1000, 60*1000); };

    if (!c.sentinels) rw = 'A';
    rw = (rw || '').toUpperCase();
    if (rw === 'R') { c.role = 'slave'; }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    var IoRedis = require('ioredis');
    var me = new IoRedis(c);
    // redis实例自我检查
    if (c.aof) { c.check = c.check || {}; c.check.aof = c.aof; delete c.aof; }
    if (c.check) { require('../skill/redis_check')(me, c.check); }
    me._cf = c;

    var errTimes = 0, sentinelErrTimes = 0;
    function eventLog(evType, msg) {
        if (evType === 'error') errTimes++;
        if (evType === 'ready') errTimes = sentinelErrTimes = 0;
        Log.log(errTimes + '[' + rw +']' + evType + redisInstanceInfo() + (msg || ''));

        // 连接不上Redis超过30分钟，自动退出当前进程。
        // 防止出现死进程，让守护系统再去重启当前服务。
        if (errTimes > 60) return killMyself();

        // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        // 如果 redis 处于 sentinel 模式，继续后面的逻辑。
        if (!c.sentinels) return;
        // 如果 slave 连接不上，就要主动去连 master。 (master可以当slave来用)
        // Log.log(errTimes);
        if (errTimes >= 9 && me.options.role === 'slave') {
            me.options.role = 'master';
            me.setStatus('end');
            setTimeout(function() {
                Log.log('[DXHJ]Can not find any slave node. I will connect to master node.');
            }, 800);
        }
    }

    function sentinelEventLog(evType, msg) {
        if (evType === 'sentinelError') sentinelErrTimes++;
        Log.log(sentinelErrTimes + '[' + evType + ']' + (msg || ''));

        // 连接不上Redis超过30分钟，自动退出当前进程。
        // 防止出现死进程，让守护系统再去重启当前服务。
        if (c.sentinels && (sentinelErrTimes / c.sentinels.length) > 60) return killMyself();
    }

    function killMyself() {
        Log.log('[Admin]Can not connect to Redis DB. Now ready to exit, bye bye...');
        return process.exit();
    }

    function redisInstanceInfo() {
        var ev = [': [' + (c.name || 'alone')];

        if (me.stream && me.stream.remoteAddress && me.stream.remotePort) {
            ev.push(me.stream.remoteAddress + ":" + me.stream.remotePort);
            if (me.serverInfo) { ev.push(me.serverInfo.role); }
            else { ev.push('-'); }
        } else if (c.host && c.port) {
            ev.push(c.host + ':' + c.port);
            ev.push('-');
        } else {
            ev.push('-:-');
            ev.push('-');
        }
        ev.push(me.status + ']');

        return ev.join(',');
    }

    me.hostPort = function() {
        var hp = [];
        if (me.stream && me.stream.remoteAddress && me.stream.remotePort) {
            hp = [me.stream.remoteAddress, me.stream.remotePort];
        } else if (c.host && c.port) {
            hp = [c.host, c.port];
        } else if (c.name) {
            hp = [c.name];
        }
        return hp.join(':');
    };

    me.on('ready',          function(info) { eventLog('ready',                  info); });
    me.on('close',          function(info) { eventLog('close',                  info); });
    me.on('end',            function(info) { eventLog('end',                    info); });
    me.on('error',          function(info) { eventLog('error',                  info); });
    me.on('drain',          function(info) { eventLog('drain',                  info); });
    me.on('warning',        function(info) { eventLog('warning',                info); });
    me.on('authError',      function(info) { eventLog('authError',              info); });

    me.on('sentinelError',  function(info) { sentinelEventLog('sentinelError',  info); });

    // me.on('idle',           function(info) { eventLog('idle',           info); });
    // me.on('connecting',     function(info) { eventLog('connecting',     info); });
    // me.on('connect',        function(info) { eventLog('connect',        info); });
    // me.on('reconnecting',   function(info) { eventLog('reconnecting',   info); });

    return me;
};
