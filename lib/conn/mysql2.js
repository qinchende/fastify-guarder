Gd.conn.connMysql2 = function (cnf) {
    let me = {
        mysql:      require('mysql2'),

        _cache:     {},
        cacheFix:   'cache_sql_',

        connStr:   `${cnf.host}:${cnf.port}/${cnf.database}`.padEnd(32)
    };

    me.pool = me.mysql.createPool(Gd.applyIf(cnf, {
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }));
    me.poolPromise = me.pool.promise();

    me.pool.getConnection(function(err, conn) {
        if (err) {
            Log.log(me.connStr + ' mysql conn error: ' + err + ' | exit(), Bye!');
        } else {
            Log.log(me.connStr + ' mysql connected.');
        }
        me.pool.releaseConnection(conn);
    });

    // cnf.keepInter -> 默认是 10 分钟。
    if (cnf.keepInter !== 0) {
        setInterval(function() {
            me.pool.query("select now() as curr;", function(err, r, fs) {
                if (err) {
                    Log.log(me.connStr + ' mysql keep fai. Error: [' + err + ']');
                } else {
                    Log.log(me.connStr + ' mysql keep suc.');
                }
            });
        }, cnf.keepInter || 600*1000);
    }

    // 带缓存版本的
    me.cacheQuery = function(opt, mcb) {
        if (typeof opt === 'string') { opt = {sql: opt}; }
        if (!mcb && opt.cb) { mcb = opt.cb; }

        let cacheKey = opt.cacheKey || (opt.cacheFix || me.cacheFix) + Gd.md5(opt.sql + JSON.stringify(opt.values || ''));
        let cacheTime = opt.cacheTime || 3600*1000;

        Log.log('mysql2(cache):' + cacheKey + ' -> ' + cacheTime);
        // 要么用 redis 缓存，要么用本地内存缓存
        if (opt.redis) {
            opt.redis.get(cacheKey, function(err, ret) {
                if (ret) { return mcb(null, JSON.parse(ret)); }
                me.pool.query(opt.sql, opt.values || [], function(err, ret) {
                    if (!err) { opt.redis.psetex(cacheKey, cacheTime, JSON.stringify(ret)); }
                    mcb(err, ret);
                });
            });
        } else {
            let keyTime = `${cacheKey}_time`;
            let lastTime = me._cache[keyTime] || 0;

            if (Number(new Date()) - lastTime < cacheTime) return mcb(null, me._cache[cacheKey]);
            me.pool.query(opt.sql, opt.values || [], function(err, ret) {
                if (!err) {
                    me._cache[cacheKey] = ret;
                    me._cache[keyTime] = Number(new Date());
                }
                mcb(err, ret);
            });
        }
    };

    return me;
};
