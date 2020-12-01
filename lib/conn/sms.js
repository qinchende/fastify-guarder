var SMS_TPL = {
    SMS_001: "验证码：{{code}}，如有疑问请致电：400-886-3311",
    SMS_002: "验证码：{{code}}，如有疑问请致电：400-886-3322",
    SMS_003: "验证码：{{code}}，如有疑问请致电：400-158-5050",
    SMS_004: "运维通知：应用{{name}}出现错误，错误码{{code}}，请尽快核查。"
};

// 短信平台系统
function sms_init(opt) {
    var me = {};
    me.opt = opt || {};

    // cnf: {
    //      pms: {
    //          mobiles: mobiles,
    //          content: content,
    //          tpl_code: 'SMS_001',
    //          tpl_pms: {
    //              code: 12312,
    //              name: '134.62'
    //          }
    //      },
    //      cb: cb
    // }
    me.send = function(cnf, mcb) {
        if (mcb) {
            cnf = {
                pms: cnf,
                cb: mcb
            }
        }
        var _mcb = cnf.cb || function() {};
        cnf.cb = function(err, re) {
            if (err || !re) { return _mcb(err || 'Empty ret.', re);}
            if (re.status === 'success' || re.status === 'suc') {
                return _mcb(null, re);
            }
            return _mcb(re.msg || 'fai', re);
        };

        cnf = Utl.applyIf(cnf || {}, {
            url: opt.host
        });
        cnf.pms = Utl.applyIf(cnf.pms || {}, {
            access_key: opt.access_key
        });

        Utl.webReqJson(cnf, cnf.debug || false);
    };

    // 给管理员发送通知短信
    me.adminNotice = function(mobiles, name, code) {
        name = (name || '').substr(0, 15);
        code = (code || '').substr(0, 20);

        me.send({
            pms: {
                __by_ht:    true,
                mobiles:    mobiles || '13800138000',
                tpl_code:   'SMS_004',
                tpl_pms: {
                    name:   name,
                    code:   code
                }
            },
            cb: function(err, ret) {
                if (err) {
                    Log.log(err);
                    Log.log(ret);
                }
            }
        });
    };

    me.gmAdminNotice = function(mobiles, content){
        me.send({
            pms: {
                __by_ht:    true,
                mobiles:    mobiles || '13800138000',
                content:    content
            },
            cb: function(err, ret) {
                if (err) {
                    Log.log(err);
                    Log.log(ret);
                }
            }
        });
    };

    return me;
}
var Sms = module.exports = function(opt) { TL.global('Sms', sms_init, opt); };