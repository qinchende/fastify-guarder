let SMS_TPL = {
    SMS_001: "验证码：{{code}}",
    SMS_002: "验证码：{{code}}",
    SMS_003: "验证码：{{code}}",
    SMS_004: "运维通知：应用{{name}}出现错误，错误码{{code}}，请尽快核查。"
};
Gd.conn.connSmsPlatform = function (options) {
    let me = {};
    me.options = options || {};

    // example
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
    me.send = function (cnf, mcb) {
        if (mcb) {
            cnf = {
                pms: cnf,
                cb: mcb
            }
        }
        let _mcb = cnf.cb || Gd.emptyFn;
        cnf.cb = function (err, re) {
            if (err || !re) {
                return _mcb(err || 'Empty ret.', re);
            }
            if (re.status === 'success' || re.status === 'suc') {
                return _mcb(null, re);
            }
            return _mcb(re.msg || 'fai', re);
        };

        cnf = Utl.applyIf(cnf || {}, {
            url: options.host
        });
        cnf.pms = Utl.applyIf(cnf.pms || {}, {
            access_key: options.access_key
        });

        Utl.webReqJson(cnf, cnf.debug || false);
    };

    // 给管理员发送通知短信
    me.adminNotice = function (mobiles, name, code) {
        name = (name || '').substr(0, 15);
        code = (code || '').substr(0, 20);

        me.send({
            pms: {
                __by_ht: true,
                mobiles: mobiles || options.adminPhone || '13800138000',
                tpl_code: 'SMS_004',
                tpl_pms: {
                    name: name,
                    code: code
                }
            },
            cb: function (err, ret) {
                if (err) {
                    Log.log(err);
                    Log.log(ret);
                }
            }
        });
    };

    return me;
}
