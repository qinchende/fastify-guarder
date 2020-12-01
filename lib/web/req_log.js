Gd.reqLog = (req, reply, done) => {
    let pms = req.pmsOrigin, base = {};
    if (!pms) return Gd.reqLogMini(req, reply, done);

    let logOpt = Gd.applyIf(req.loggerOpt || {}, {
        logLength: 512
    });

    // if (req.pms['_'])       { base['_']     = pms['_'];         delete pms['_']; }
    if (pms['_stamp'])  { base['_stamp']= pms['_stamp'];    delete pms['_stamp']; }
    // if (req.pms['jpc'])     { base['jpc']   = pms['jpc'];       delete pms['jpc']; }
    if (pms['tok'])     { base['tok']   = pms['tok'];       delete pms['tok']; }

    let strBase = JSON.stringify(base);
    let params  = JSON.stringify(pms);
    let cookie  = req.raw.headers['cookie'] || '';
    let ret     = _baseReqParams(req, reply);

    let results = reply.GdTips.data || '';
    if (results.length > logOpt.logLength) {
        results = results.substring(0, logOpt.logLength);
    }

    let _log = `\n\
[${ret.method}] ${ret.url} (${ret.ip}/${ret.strTime}/${ret.resCode}) [${ret.delay}|${ret.ms}]\n\
  B: ${strBase}  C: ${cookie}\n\
  P: ${params}\n\
  R: ${results}\n`;
    if (req.loggerExt) _log += `  E: ${JSON.stringify(req.loggerExt)}\n`;

    process.stdout.write(_log);

    done();
};

Gd.reqLogMid = (req, reply, done) => {
    done()
};

Gd.reqLogTiny = (req, reply, done) => {
    done()
};

Gd.reqLogMini = (req, reply, done) => {
    let ret = _baseReqParams(req, reply);
    let _log = `\n[${ret.method}] ${ret.url} (${ret.ip}/${ret.strTime}/${ret.resCode}) [${ret.delay}|${ret.ms}]\n`;

    process.stdout.write(_log);
    done()
};

// 附加日志
Gd.loggerExt = function(req, obj) {
    req.loggerExt = Gd.apply(req.loggerExt || {}, obj);
};

function _baseReqParams(req, reply) {
    let timeNum = Gd.Server.getTM();
    let method  = req.method;
    let strTime = new Date(timeNum).format('MM-dd hh:mm:ss');

    let delay   = 'NA';
    if (req.pms) {
        req.pms['_stamp'] ? (Date.diff(timeNum, req.pms['_stamp'])) : 0;
        if (req.pms['_stamp_init']) { delay = 'NA'; }
    }

    let ms      = timeNum - req.GdTips.reqTM;
    let ip      = Gd.realIP(req);
    let url     = req.GdTips.pathname;
    let resCode = reply.statusCode;

    return {method, strTime, delay, ms, ip, url, resCode};
}

//
// // 自定义一些参数
// Gd.loggerTool = function (opt) {
//     return function(req, res, next) {
//         req.loggerOpt = opt;
//         exports.logger(req, res, next);
//     };
// };
//
// // 打印请求的 日志
// Gd.loggerMini = function(req, res, next) {
//     var log_template_mini = '[{{method}}] {{url}} ({{ip}}/{{time}})[{{delay}}|{{ms}}]\n';
//
//     var timeNum = Gd.Server.getTM();
//
//     var _format = {
//         method: req.method,
//         time:   new Date(timeNum).format('MM-dd hh:mm:ss'),
//         delay:  req.pms['_stamp'] ? (Date.diff(timeNum, req.pms['_stamp'])) : 0,
//         ip:     Utl.realIP(req),
//         url:    req.url
//     };
//     if (req.pms['_stamp_init']) { _format.delay = 'NA'; }
//
//     var _temp_end = res.end;
//     res.end = function(data, encoding) {
//         _temp_end.apply(res, arguments);
//
//         _format.ms = Gd.Server.getTM() - timeNum;
//         var _log = log_template_mini.format(_format);
//         if (req.loggerExt) {
//             _log += 'E: ' + JSON.stringify(req.loggerExt) + '\n';
//         }
//         process.stdout.write(_log);
//     };
//     next();
// };
//
// // 附加日志
// Gd.loggerExt = function(req, obj) {
//     req.loggerExt = Utl.apply(req.loggerExt || {}, obj);
// };
//
// // 获取当前服务器的时间戳
// Gd.current_time = function(req, res) {
//     return Utl.suc(res, {cur_time: Number(new Date())});
// };
