Gd.hookRequestDefault = (fty, opts) => {
    fty.register(require('fastify-formbody'));

    fty.addHook('onRequest',        Gd.reqStart);
    fty.addHook('preHandler',       Gd.mixBodyAndQuery);
    fty.addHook('onSend',           Gd.resSend);
    fty.addHook('onResponse',       Gd.reqEnd);
};

Gd.getPost = (fty, url, opts, handler) => {
    if (!handler && typeof opts === 'function') {
        handler = opts;
        opts = {}
    }
    Gd.applyIf(opts, {
        config: {},
        prefixTrailingSlash: 'no-slash'
    });

    // 约定好一定规则的URL，是不需要检查是否登录的
    if (url.indexOf('/r_') >= 0) {
        opts.config.loginCheck = false;
    }

    fty.get(url, opts, handler);
    fty.post(url, opts, handler);
};

Gd.isNeedLogin = (req, res) => {
    return req.context.config.loginCheck !== false;
};

Gd.reqStart = (req, res, done) => {
    req.GdTips = {
        reqTM:      Gd.Server.getTM(),
        pathname:   _getPathname(req.raw.url)
    };
    res.GdTips = {};

    // 如果路径没有匹配上，是否直接返回404错误？？？
    if (!req.context.config.url) {
        return res.code(404).send('O(∩_∩)O');
    }
    done();
};

function _getPathname(url) {
    let idx = url.indexOf('?');
    if (idx < 0) idx = url.indexOf('#');
    if (idx < 0) idx = url.indexOf(';');

    if (idx >= 0) return url.slice(0, idx);
    return url;
}

Gd.resSend = (req, reply, payload, done) => {
    reply.GdTips.data = payload;

    done(null, payload);
};

Gd.reqEnd = (req, reply, done) => {
    if (!reply.skipLog) Gd.reqLog(req, reply, done);
};

// 合并 get && post 请求传入的参数
Gd.mixBodyAndQuery = function(req, reply, done) {
    // 感兴趣的朋友了解：req.body|req.query|req.params 的区别
    // req.body     是POST提交
    // req.query    是GET提交
    // req.params   是URL中正则匹配的提交
    req.pms = Gd.apply(req.query || {}, req.body, req.params);
    req.pmsOrigin = Object.assign({}, req.pms);
    done();
};
