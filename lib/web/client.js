module.exports = function(me) {

    // 适合 Asy使用的callback
    me.asyCb = function(cb) {
        return function(err, rows, fields) {
            cb && cb(err, rows);
        };
    };

    // ------------------------------------------------------------------------
    // 模拟 jquery.param
    function buildParams(prefix, obj, traditional, add) {
        var name;
        if (me.isArr(obj)) {
            // Serialize array item.
            me.forEach(obj, function(i, v) {
                if (traditional || /\[\]$/.test( prefix )) {
                    // Treat each array item as a scalar.
                    add(prefix, v);
                } else {
                    // Item is non-scalar (array or object), encode its numeric index.
                    buildParams(
                        prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
                        v,
                        traditional,
                        add
                    );
                }
            });
        } else if (!traditional && (typeof obj === "object")) {
            // Serialize object item.
            me.forEach(obj, function(k, v) {
                buildParams(prefix + "[" + k + "]", v, traditional, add);
            });
        } else {
            // Serialize scalar item.
            add(prefix, obj);
        }
    }
    // Serialize an array of form elements or a set of
    // key/values into a query string
    function jquery_param(a, traditional) {
        var prefix,
            s = [],
            add = function(key, value) {
                // If value is a function, invoke it and return its value
                value = me.isFun(value) ? value() : (value == null ? "" : value);
                s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
            };

        // If traditional, encode the "old" way (the way 1.3.2 or older
        // did it), otherwise encode params recursively.
        me.forEach(a, function(k, v) {
            buildParams(k, v, traditional, add);
        });

        // Return the resulting serialization
        return s.join( "&" ).replace( /%20/g, "+" );
    }

    me.param = function(pms, url) {
        var rt = jquery_param(pms || {});
        if (url) {
            if (rt) { url += (url.indexOf('?') < 0 ? '?' : '&') + rt; }
            return url;
        }
        return rt;
    };

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // 手机 APP
    // 判断是否来自不同平台
    me.isReqFromBrowser = function(req) {
        var head = req.headers;
        if (!head['user-agent']) { return false; }
        else if (head['referer'] && head['referer'].indexOf('http') != 0) { return false; }
        return true;
    };
    me.isReqFromIOS = function(req, ua) {
        ua = ua || me.userAgent(req);
        if (!ua) return false;
        return (req.pms['__cm_from'] == 'app_ios') || /com\.9ifund\./.test(ua) || /com\.tl50\./.test(ua);
    };
    me.isReqFromAndroid = function(req, ua) {
        ua = ua || me.userAgent(req);
        if (!ua) return false;
        return (req.pms['__cm_from'] == 'app_az') || /okhttp\//.test(ua);
    };
    me.isReqFromAPP = function(req, ua) {
        if (req._IsReqFromAPP === undefined) {
            ua = ua || me.userAgent(req);
            req._IsReqFromAPP = me.isReqFromIOS(req, ua) || me.isReqFromAndroid(req, ua);
        }
        return req._IsReqFromAPP;
    };
    // 验证请求的合法性
    // add by cd.net on 2017-01-12
    me.isStampRight = function(req) {
        // _app_stamp = Number(new Date()) & _stamp_hash = sha1(_app_stamp + '3niW+yuxpzYt@e9vq');
        var stamp = req.pms['_app_stamp'] || '';
        var stamp_hash = req.pms['_stamp_hash'] || '';

        if (stamp && stamp_hash) {
            var hash = me.sha1(stamp + '3niW+yuxpzYt@e9vq');
            if (hash != stamp_hash) { return false; }

            var diff = 60;
            try {
                diff = Math.abs(Date.diff(new Date(), new Date(stamp), 's'));
            } catch (e) {}
            return diff <= 59;
        }
        return false;
    };

    // 收集客户访问信息
    me.collectReqEnv = function(redis, req) {
        var page_key = (req.pms['uid'] || req.pms['id'] || '').toString().substr(0, 32);

        // 0 tok ,1 ip, 2 page_key, 3 客户端环境, 4，屏幕宽度，5 时间, 6. 其它参数
        var info = [req.pms['tok'], Utl.realIP(req), page_key, me.userAgent(req),
            req.pms['width'], Number(new Date()), req.pms['others'] || ''];

        redis.lpush('pool_need_sync', JSON.stringify(info));
    };

    // 收集客户访问信息
    me.anaPageView = function(redis, req) {
        var pid = req.pms['pid'];
        if (!pid) {
            return Utl.loggerExt(req, {msg: 'NOT_PID'});
        }
        // 0 时间, 1 ip, 2 tok, 3 page_id, 4 userAgent, 5 屏幕宽度, 6 其它参数
        var data = [Number(new Date()), Utl.realIP(req), (req.pms['tok'] || ''), pid.substr(0,64), Utl.userAgent(req),
            (req.pms['width'] || '0'), (req.pms['others'] || '')];

        redis.lpush(Cst.fix.dxa_pool_need_sync, JSON.stringify(data));
    };
};