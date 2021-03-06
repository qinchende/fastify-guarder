let _utils = function() {
    let http = require('http'), https = require('https');
    let url = require('url');

    let me = {};

    me.isMobile = function(mobile) {
        return /^1[3-9][0-9]{9}$/.test(mobile);
    };

    me.isEmail = function(email) {
        return /^([a-zA-Z0-9_.\-])+@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email);
    };

    me.isNum = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    me.isArr = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    me.isFun = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    };

    me.isEmptyObject = function(o) {
        o = o || {};
        for (let f in o) {
            if (o.hasOwnProperty && !o.hasOwnProperty(f)) { continue; }
            return false;
        }
        return true;
    };

    me.userAgent = function(req) {
        return (req.raw.headers['user-agent'] || '').toLowerCase();
    };

    // 得到 客户端的真实 IP 地址
    me.realIP = function(req) {
        return req.raw.headers['x-real-ip'] || req.raw.connection.remoteAddress;
    };

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // 模拟 jquery.param
    function buildParams(prefix, obj, traditional, add) {
        var name;
        if (Gd.isArr(obj)) {
            // Serialize array item.
            Gd.forEach(obj, function(i, v) {
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
            Gd.forEach(obj, function(k, v) {
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
                value = Gd.isFun(value) ? value() : (value == null ? "" : value);
                s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
            };

        // If traditional, encode the "old" way (the way 1.3.2 or older
        // did it), otherwise encode params recursively.
        Gd.forEach(a, function(k, v) {
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
    // 代理请求，目前仅支持 GET 请求
    me.webAgent = function(opt, debug) {
        if (opt.squid === true) { return squidAgent(opt, debug); }

        opt = Gd.applyIf(opt || {}, {
            agent: 'http://10.10.xx.xx:8080/agent',
            url: '',
            pms: {}
        });

        let tg = opt.agent;
        tg = me.param(Gd.apply(opt.pms, {real_url: opt.url}), tg);

        web_exec(tg, opt.cb, debug);
    };

    // 采用代理请求，并以Json格式解析返回结果
    me.webAgentJson = function (opt, debug) {
        opt = web_json(opt);
        Gd.webAgent(opt, debug);
    };

    // http 或 https 请求
    me.webReq = function(opt, debug) {
        opt = Gd.applyIf(opt || {}, {
            url: '',
            pms: {}
        });

        let tg = opt.url;
        tg = me.param(Gd.apply(opt.pms, {__by: 'gd'}), tg);

        web_exec(tg, opt.cb, debug);
    };

    // 请求，以Json格式解析返回结果
    me.webReqJson = function (opt, debug) {
        opt = web_json(opt);
        me.webReq(opt, debug);
    };

    function web_exec(tg, cb, debug) {
        let inter = http;
        if (tg && tg.indexOf('https://') === 0) { inter = https; }

        if (debug === true) { console.log(tg); }
        let buf = [], buf_length = 0;
        inter.get(tg,
            // {headers:{
            //     'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
            // }},
            function(r) {
                r.on('data', function(d) {
                    buf.push(d);
                    buf_length += d.length;
                });
                r.on('end', function() {
                    let ret = Buffer.concat(buf, buf_length).toString();
                    if (debug === true) { console.log(ret); }
                    cb && cb(null, ret);
                });
            }).on('error', function(e) {
            cb && cb(e.message, null);
        });
    }

    function web_json(opt) {
        opt = opt || {};
        opt.__cb = opt.cb || function(err, ret) {};
        opt.cb = function(err, ret) {
            let parse = ret;
            try {
                parse = JSON.parse(ret || '{}')
            } catch (e) {
                err += e.toString()
            }
            opt.__cb(err, parse);
        };
        return opt;
    }

    // 另外一种代理，用squid代理请求
    function squidAgent(opt, debug) {
        let tgUrl = me.param(opt.pms, opt.url);
        let mcb = opt.cb;

        Gd.TUNNEL = Gd.TUNNEL || require('tunnel');
        let options = url.parse(tgUrl) || {};
        let inter = http;
        options.agent = Gd.TUNNEL.httpOverHttp;
        if (tgUrl && tgUrl.indexOf('https://') === 0) {
            inter = https;
            options.agent = Gd.TUNNEL.httpsOverHttp;
        }
        options.agent = options.agent({
            proxy: opt.proxy || Gd.Outs.proxy || { host: 'x.x.x.x', port: 8180 }
        });

        if (debug === true) { console.log(options); }
        let buf = [], buf_length = 0;
        inter.request(options, function(r) {
            r.on('data', function(d) {
                buf.push(d);
                buf_length += d.length;
            });
            r.on('end', function() {
                let ret = Buffer.concat(buf, buf_length).toString();
                if (debug === true) { console.log(ret); }
                mcb && mcb(null, ret);
            });
        }).on('error', function(e) {
            mcb && mcb(e.message, null);
        });
    }
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    me.randomLetter = function(len) {
        return Gd.randomSeq(len, "ACDEFGHJKMNPQRSTUVWXYZ");
    };
    me.randomSeq = function(len, set) {
        set = set || "235679ACDEFGHJKMNPQRSTUVWXYZ";
        let code = '';
        for (let i = 0; i < len; i++) { code += set[parseInt(Math.random()*set.length)]; }
        return code;
    };
    // len 最好不要超过15
    me.randomNum = function(len) {
        return(Math.random().toString()).substring(2, 2 + len);
    };
    me.randomInt = function(min, max) {
        if (max === undefined) { max = min; min = 0; }
        return parseInt(Math.random()*(max - min) + min);
    };
    me.nextNum = function(cur, max, cb) {
        max = max || 100000000;
        cur = parseInt(cur);
        cur += 1;
        if (cur.toString().indexOf('4') >= 0) { Gd.nextNum(cur, max, cb); }
        else { cb && cb(cur > max ? 0 : cur); }
    };
    return me;
}
Gd.apply(Gd, _utils());
