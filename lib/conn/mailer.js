// 邮件服务系统
// github: https://github.com/andris9/Nodemailer
function mail_init(opt) {
    var me = {};
    opt = me.opt = opt || {};

    if (!opt.agent && opt.host) {
        me.nodemailer = require("nodemailer");
        me.transport = me.nodemailer.createTransport(opt);
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // 可用的方法
    me.send = function(mail, mcb) {
        if (opt.agent) {
            Utl.webReqJson({
                url: opt.agent,
                pms: mail,
                cb: function(err, ret) {
                    mcb(err || ret.err_info, null);
                }
            });
        } else {
            me.transport.sendMail(mail || {}, function(error, response) {
                if (error) { Log.log(error.message); }
                mcb(error, response);
            });
        }
    };

    me.close = function(){
        if (opt.agent) {

        } else {
            me.transport.close();
            Log.log("========== Mailer Server Quit Success.==========");
        }
    };

    return me;
}
var Mailer = module.exports = function(opt) { TL.global('Mailer', mail_init, opt); };
