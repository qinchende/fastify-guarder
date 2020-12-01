const sysCrypto = require('crypto');
Gd.apply(Gd, {
    md5: function(str, encoding) {
        return sysCrypto.createHash('md5').update(str).digest(encoding || 'hex');
    },

    sha1: function(str, encoding) {
        return sysCrypto.createHash('sha1').update(str).digest(encoding || 'hex');
    },

    checkMd5: function(src, md5, k) {
        return Gd.md5(src + (k || 'tl')) === md5.toLowerCase();
    },

    checkSha1: function(src, sha1, k) {
        return Gd.sha1(src + (k || 'tl')) === sha1.toLowerCase();
    },

    getMd5: function(source, key) {
        return Gd.md5(source + (key || ''));
    },

    getSha1: function(source, key) {
        return Gd.sha1(source + (key || 'bmc'));
    },

    sesParseKey: function(str, secret) {
        return Gd.sesUnSign(str.slice(2), secret);
    },

    sesGetUid: function(str) {
        let uid = (0 === str.indexOf('t:')) ? str.slice(2, str.lastIndexOf('.')) : false;
        // 太短的uid不可信，不能用
        if (uid && uid.length <= 18) { uid = false; }
        return uid;
    },

    sesParseUid: function(str) {
        return 0 === str.indexOf('t:') ? str.slice(2, str.lastIndexOf('.')) : str;
    },

    sesKey: function(secret) {
        let uid = Gd.sesUid(24);
        return {id: uid, token: 't:' + Gd.sesSign(uid, secret)};
    },

    // 如果传入一个 无效的 uid，这里将自动给创建一个新的uid.
    sesCalcToken: function(uid, secret) {
        return 't:' + Gd.sesSign(uid, secret);
    },

    sesUnSign: function(val, secret) {
        let str = val.slice(0, val.lastIndexOf('.'));
        return Gd.sesSign(str, secret) === val
            ? str
            : false;
    },

    sesSign: function(val, secret) {
        return val + '.' + sysCrypto
            .createHmac('sha256', secret)
            .update(val)
            .digest('base64')
            .replace(/[+=]/g, '');
    },

    sesUid: function(len) {
        return sysCrypto.randomBytes(Math.ceil(len * 3 / 4))
            .toString('base64')
            .replace(/[+=]/g, '')
            .slice(0, len);
    },
});
