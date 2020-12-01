Gd.Ses.tokenInit = function (opt) {
    if (Gd.Ses.redis) return;   // 这个函数只需要初始化执行一次。

    let me = {};
    let c = me.config = Gd.applyIf(opt || {}, {
        project_key:            'GuarderProject',
        session_key:            'user_id',
        secret:                 '642ajb3sleho3289posr',

        session_ttl_new:        180,                // 刚创建的Token属于临时，有效期很短
        session_ttl:            3600 * 4,           // 默认Token过期时间 -> 4个小时
        prefix:                 'tls_',

        key_ip:                 'tip_',
        key_access:             'tac_',
        tok_access_locks:       'tok_access_locks',
        safe_ips:               ['10.10.'],

        key_danger_ip:          'dip_',
        danger_ips_locks:       'danger_ips_locks',
        danger_ip_ttl:          86400*10,

        secs_url_count_ip:      180,                // 某个接口单位时间单个IP访问次数
        secs_url_expire:        1800,               // 接口访问统计周期

        secs_ip_count:          60,                 // IP token 生成频率
        secs_access_count:      300,                // 每个 token 访问次数
        secs_expire:            300,                // 统计周期  (秒) 5分钟
        secs_lock:              3600*8              // 锁定时长  (秒) 8个小时
    });

    // Redis Ses db.
    let rc = c.redisCnf || {};
    if (rc.redis) me.redis = rc.redis;
    else {
        rc.h = rc.h || rc.host;
        rc.p = rc.p || rc.port;
        if (rc.n || (rc.p && rc.h)) { me.redis = Gd.conn.connIORedis(rc, 'w'); }
    }

    // *****************************************************************************************************************
    // 用现在请求的IP地址给，token 代表的人构造一个新的 token, 这两个token都将指向同一个人。
    me.currIPToken = function(req, origin_tok) {
        return me.theIPToken(Gd.realIP(req), origin_tok);
    };

    // 特定的IP 对应的 token
    me.theIPToken = function(ip, origin_tok) {
        return Gd.sesCalcToken(Gd.sesParseUid(origin_tok), c.secret+ip);
    };

    // 当前请求过来的IP地址和 当初创建这个 token的 IP 地址是否一致。
    // 不一致，肯定是不同人请求的，不能处理。
    me.checkIPToken = function(token_create_ip, the_token) {
        if (!the_token || !token_create_ip) { return false; }
        return Gd.sesParseKey(the_token, c.secret + token_create_ip) !== false;
    };

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // 监控访问频率，给管理员提示
    me.sesFreq = function(req, res, next, skipInnerIP) {
        let req_ip = Gd.realIP(req);
        if (skipInnerIP === true && c.safe_ips.startWith(req_ip)) { return next(); }

        let k_ip = c.project_key + '_' + req.path + '_' + req_ip;
        me.redis.incr(k_ip, function(err, re) {
            if (re > c.secs_url_count_ip) {
                me.redis.zadd(c.tok_access_locks, Number(new Date()), k_ip);
            }
            if (re <= 2) { me.redis.expire(k_ip, c.secs_url_expire); }
            next();
        });
    };

    // 某些特定地址访问频率控制
    me.checkTheIP = function(req, res, next, cnf, skipInnerIP) {
        let req_ip = Gd.realIP(req);
        if (skipInnerIP === true && c.safe_ips.startWith(req_ip)) { return next(); }

        let k_prj_ip = c.key_danger_ip + c.project_key + '.' + req_ip;
        me.redis.exists(k_prj_ip, function(err, ret) {
            if (ret) {
                me.redis.incr(k_prj_ip);
                return res.send('O(∩_∩)O');
            }

            if (cnf) {
                let k_prj_path_ip = c.project_key + '.' + req.path + '.' + req_ip;
                me.redis.incr(k_prj_path_ip, function(err, re) {
                    if (re > cnf.times) {
                        me.redis.zadd(c.tok_access_locks, Number(new Date()), k_prj_path_ip);
                        me.redis.zadd(c.danger_ips_locks, Number(new Date()), k_prj_ip);
                        me.redis.setex(k_prj_ip, c.danger_ip_ttl, re);
                    }
                    if (re <= 2) { me.redis.expire(k_prj_path_ip, cnf.ttl); }
                });
            }
            next();
        });
    };

    // 强制 需要验证 token 的，需要记录客户访问的频率。对访问进行控制，防止被 攻击，被爬虫
    me.sesToken = function(req, res, next, need_login) {
        // add by cd.net on 2013-01-11
        // 每一次的访问，都必须要有一个 token ，没有token的 访问将视为 非法.
        // 第一次没有 token 的情况下，默认造一个 token
        if (!req.pms['tok']) {
            return me.gen_anonymous_token(req, res, function() {
                me.get_session_data(req, res, next, need_login);
            });
        }

        // 请求过来的SID先记录下来
        req._ReqSID = Gd.sesGetUid(req.pms['tok']);
        // 传了 token 就要检查当前 token 合法性：
        // 1. 不正确， 需要分配新的Token。
        // 2. 过期，  用当前Token重建Session记录。
        req.SID = Gd.sesParseKey(req.pms['tok'], c.secret + Gd.realIP(req));

        if (c.checkTokenIP !== true && !req.SID) {
            Gd.loggerExt(req, {SID_MISS: 'Maybe ip changed.'});
            // 不验证IP相同性，直接取SID.
            req.SID = req._ReqSID;
        }

        if (req.SID) {
            me.get_session_data(req, res, next, need_login);
        } else {
            // 无法通过token还原出SID，证明请求非法。
            req._TokenCheckFai = true;

            // 重新生成新的Token.
            me.gen_anonymous_token(req, res, function() {
                me.get_session_data(req, res, next, need_login);
            });
        }
    };

    // 将上一个 Token 删掉，重新创建一个 token
    me.genNewToken = function(req, res, mcb) {
        me.drop(req, res);
        me.gen_anonymous_token(req, res, function(ret) {
            if (ret && ret.id) { mcb(true, ret); }
            else { mcb(false, ret); }
        });
    };
    // =================================================================================================================
    // 生成新的Token，并且限制IP频率
    me.gen_anonymous_token = function(req, res, mcb) {
        let req_ip = Gd.realIP(req);
        // 记录 某个 IP 地址 token 的生成频率
        let k = c.key_ip + c.project_key + '_' + req_ip;
        me.redis.incr(k, function(err, re) {
            if (re > c.secs_ip_count) {
                me.redis.zadd(c.tok_access_locks, Number(new Date()), k);
                // 如果不是安全的IP地址。
                if (!c.safe_ips.startWith(req_ip)) {
                    me.redis.setex(k, c.secs_lock, re);
                    Gd.loggerExt(req, {DENY: 'ip_new_tok: ' + re});
                    return res.send('O(∩_∩)O');
                }
            }
            if (re <= 2) { me.redis.setex(k, c.secs_expire, re); }

            req._TokIsNew = true;
            req._NewTokTtl = c.session_ttl_new;

            let new_token = Gd.sesKey(c.secret + req_ip);
            // me.set(req, res, 'tok', new_token.token);
            me.set(req, res, {});
            req.SID = new_token.id;
            // 自动产生的 token 需要 回传 (第一次产生的 token 要回传，之后用户访问就使用 这个 token)
            req.pms['tok'] = res.back_token = new_token.token;
            mcb && mcb(new_token);
        });
    };

    // 构造 Ses 对象
    // 有 token 但是 token 错误的情况下，需要报错
    me.get_session_data = function(req, res, next, need_login) {
        // 记录 token 访问的频率
        let k = c.key_access + c.project_key + '_' + req.SID;
        me.redis.incr(k, function(err, re) {
            // 如果发现非法用户访问，需要将其加入黑名单，直接 不让访问
            if (re > c.secs_access_count) {
                me.redis.setex(k, c.secs_lock, re);
                me.redis.zadd(c.tok_access_locks, Number(new Date()), k);

                Gd.loggerExt(req, {DENY: 'tok_acc: ' + re});
                return res.send('O(∩_∩)O');
            }
            if (re <= 2) { me.redis.setex(k, c.secs_expire, re); }

            me.check_session(req, res, next, need_login(req, res));
        });
    };

    // 检查 Ses 信息 是否完整
    me.check_session = function(req, res, next, loginNeedCheck) {
        if (!req.SID) { return Gd.fai(res, 'SID错误。'); }

        me._fetch(req, function (err) {
            if (err) { return Gd.fai(res, {msg: '查找SESSION数据失败，请您重新访问系统.', msgCode: Gd.RenderCode.NotLogin}); }
            if (!loginNeedCheck) { return next(); }

            if (req.SES && req.SES[c.session_key]) {
                // add by cd.net on 2014-07-28
                // 如果需要植入当前登录用户的信息
                if (me.config.current) {
                    return me.config.current(req, res, req.SES[c.session_key], function(ys) {
                        if (ys) {
                            next();
                        } else {
                            Gd.fai(res, {msg: '找不到登录用户的信息，请更换用户登录。', msgCode: Gd.RenderCode.NotLogin});
                        }
                    });
                }
                return next();
            }
            // 可能IP变化，导致用户登录验证失败
            if (req._TokenCheckFai === true) {
                return Gd.fai(res, {msg: '登录验证失败（可能您IP地址发生了变化）。', msgCode: Gd.RenderCode.NotLogin});
            }
            return Gd.fai(res, {msg: '您还没有登录，请登录系统。', msgCode: Gd.RenderCode.NotLogin});
        });
    };
    me._fetch = function(req, fn) {
        if (req.SES) { return fn(); }

        let key = c.prefix + req.SID;
        me.redis.get(key, function(err, data){
            me.redis.expire(key, req._NewTokTtl || c.session_ttl);
            req.SES = {};
            try {
                if (data) { req.SES = JSON.parse(data.toString()); }
                fn();
            } catch (err) {
                fn(err);
            }
        });
    };
    // ================================================================================================================
    // Ses Utils.
    me.set = me.add = function(req, res, key, val, fn) {
        if (typeof key == 'string') {
            let _temp = {};
            _temp[key] = val || '';
            key = _temp;
        }
        req.SES = Gd.apply(req.SES || {}, key);
        if ('function' == typeof val) { fn = val; }

        if (fn) {
            me.save(req, function(err, re) {
                if (err || re !== 'OK') {
                    fn(0);
                } else {
                    fn(1);
                }
            });
        } else {
            me.change(req, res);
        }
    };

    me.del = function(req, res, keys) {
        if (req.SES) {
            if (keys instanceof Array) {
                for (let i = 0; i < keys.length; i++) {
                    delete req.SES[keys[i]];
                }
            } else {
                delete req.SES[keys];
            }
            me.change(req, res);
        }
    };

    // 直接从数据库中删除整个 session 记录
    me.drop = function(req, res) {
        req.SES = {};
        if (req.SID) { me.redis.del(c.prefix + req.SID); }
    };

    me.change = function(req, res) {
        // change [end] function
        if (!res.org_end) {
            res.org_end = res.end;
            res.end = function(d, enc) {
                res.end = res.org_end;
                me.save(req, function() { res.end(d, enc); });
            };
        }
    };

    me.save = function(req, fn) {
        try {
            me.redis.setex(c.prefix + req.SID, req._NewTokTtl || c.session_ttl, JSON.stringify(req.SES), function(err, re) {
                fn && fn(err, re);
            });
        } catch (err) {
            fn && fn(err, 'err');
        }
    };

    return Gd.apply(Gd.Ses, me);
};