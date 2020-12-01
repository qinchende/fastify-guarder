// // 解析 multipart/form-data 类型的提交，将参数合并到 body 中
// exports.multipart = function(multer) {
//     return function(req, res, next) {
//         if ((req.headers['content-type'] || '').indexOf('multipart/form-data') < 0) return next();
//
//         multer.any()(req, res, function(err) {
//             if (!err) return next();
//
//             req.pms = {};
//             Utl.fai(res, JSON.stringify(err));
//         });
//     };
// };
//
// // 合并 get && post 请求传入的参数 -> params
// exports.bodyQuery = function(req, res, next){
//     // 这里不能用 req.params ，因为req.params是系统变量，系统用到了
//     // 敢兴趣的朋友了解：req.body|req.query|req.params 的区别
//     req.pms = Utl.apply(req.query || {}, req.body);
//     req.pmsHT = {};
//     next();
// };
//
// // 打印请求的 日志
// var log_template = '\n\
// [{{method}}] {{url}} ({{ip}}/{{time}}) [{{delay}}|{{ms}}]\n\
//   B: {{base}}  C: {{cookie}}\n\
//   P: {{params}}\n\
//   R: {{_results}}\n';
// exports.logger = function(req, res, next) {
//     var logOpt = Utl.applyIf(req.loggerOpt, {
//         logLength: 512
//     });
//     var timeNum = Gd.Server.getTM();
//
//     var pms = Utl.apply({}, req.pms), base = {};
//     if (req.pms['_'])       { base['_']     = pms['_'];         delete pms['_']; }
//     if (req.pms['_stamp'])  { base['_stamp']= pms['_stamp'];    delete pms['_stamp']; }
//     if (req.pms['jpc'])     { base['jpc']   = pms['jpc'];       delete pms['jpc']; }
//     if (req.pms['tok'])     { base['tok']   = pms['tok'];       delete pms['tok']; }
//
//     var _format = {
//         method: req.method,
//         time:   new Date(timeNum).format('MM-dd hh:mm:ss'),
//         delay:  req.pms['_stamp'] ? (Date.diff(timeNum, req.pms['_stamp'])) : 0,
//         ip:     Utl.realIP(req),
//         url:    req._parsedUrl.pathname,
//         base:   JSON.stringify(base),
//         params: JSON.stringify(pms),
//         cookie: req.headers['cookie'] || ''
//     };
//     if (req.pms['_stamp_init']) { _format.delay = 'NA'; }
//
//     var _temp_end = res.end;
//     res.end = function(data, encoding) {
//         _temp_end.apply(res, arguments);
//
//         // 此日志记录方式，要求同时记录 每个 Action 请求，返回的结果值
//         // add by cd.net on 20140220
//         // if (typeof data == 'string') {
//         _format._results = (data || '').toString();
//         // 太长的返回结果，日志太大，会影响性能
//         if (_format._results.length > logOpt.logLength) {
//             _format._results = _format._results.substring(0, logOpt.logLength);
//         }
//         _format._results = _format._results.replace(/^.*\({/, '{').replace(/}\);$/, '}');
//
//         _format.ms = Gd.Server.getTM() - timeNum;
//         var _log = log_template.format(_format);
//         if (req.loggerExt) {
//             _log += '  E: ' + JSON.stringify(req.loggerExt) + '\n';
//         }
//         res.tl_analyse && res.tl_analyse(_format);
//         process.stdout.write(_log);
//     };
//
//     next();
// };
//
// // 自定义一些参数
// exports.loggerTool = function (opt) {
//     return function(req, res, next) {
//         req.loggerOpt = opt;
//         exports.logger(req, res, next);
//     };
// };
//
// // 打印请求的 日志
// var log_template_mini = '[{{method}}] {{url}} ({{ip}}/{{time}})[{{delay}}|{{ms}}]\n';
// exports.loggerMini = function(req, res, next) {
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
// Utl.loggerExt = function(req, obj) {
//     req.loggerExt = Utl.apply(req.loggerExt || {}, obj);
// };
//
// // 获取当前服务器的时间戳
// exports.current_time = function(req, res) {
//     return Utl.suc(res, {cur_time: Number(new Date())});
// };