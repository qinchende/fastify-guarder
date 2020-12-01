Gd.RenderCode = {
    NotLogin: 110
};

(function() {
    let me = {};

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // JSON common
    me.suc = function(res, obj) {
        me.renderResult(res, obj, 'suc');
    };

    me.fai = function(res, obj) {
        me.renderResult(res, obj, 'fai');
    };

    me.exc = function(res, e) {
        let desc = "";
        for (let keys in e) {
            if (!e.hasOwnProperty(keys)) { continue; }
            desc += "[" + keys + "]:[" + e[keys] + ']; ';
        }
        me.fai(res, {msgCode: -1, msg: 'Exception: ' + e.toString() + desc});
    };

    me.renderResult = function(res, obj, t) {
        obj = gen_render_val(res, obj, t);

        if (res.request.pms && res.request.pms.result_fmt === 'xml') {
            return me.render_result_xml(res, obj, t);
        }
        else { res.send(obj); }
    };

    me.renderDirect = function(res, msg) {
        return function(err, ret) {
            if (err) { return me.fai(res, {msg: msg || err.message || err}); }
            me.suc(res, ret);
        }
    };

    me.render = function(res, msg) {
        return function(err, ret) {
            if (err) { return me.fai(res, {msg: msg || err.message || err}); }
            me.suc(res, {record: ret});
        }
    };
    me.renderRedis = me.renderRes = function(res, err, ret, ext) {
        if (err) { return me.fai(res, {msg: err || ''}); }

        if (ret instanceof Array) {
            ret = { records: ret };
        } else {
            ret = { record: ret };
        }
        me.suc(res, me.apply(ret, ext));
    };

    me.redirect = function(req, res, val, t) {
        if (typeof val === 'string') { val = {msg: val, tg: t} }

        let rt = encodeURIComponent(JSON.stringify(gen_render_val(res, val, t)));
        return res.redirect(req.pms['back_url'] + '?result_val=' + rt);
    };

    function gen_render_val(res, obj, t) {
        obj = obj || {};
        if (typeof obj == 'string') { obj = {msg: obj}; }
        if (res.back_token) {obj.tok = res.back_token;}     // 返回 new tok.
        if (res.need_stamp !== false) {obj._stamp = obj._stamp || Gd.Server.getTM();}   // 返回服务器时间搓

        if (t === 'suc') {
            return Gd.applyIf(obj, {status: 'suc', msgCode: 1, msg: 'Suc!'});
        } else {
            return Gd.applyIf(obj, {status: 'fai', msgCode: 0, msg: 'Fai!'});
        }
    }
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // XML
    me.render_suc_xml = function(res, obj){
        obj.succmsg = obj.msg ||'suc';
        let xml = some_thing_to_xml(obj);
        xml = '<?xml version="1.0" encoding="UTF-8"?><hash>{{0}}</hash>'.format([xml]);
        res.header('Content-Type','application/xml');
        return res.send(xml);
    };

    me.render_fai_xml = function(res, obj){
        obj.errmsg = obj.msg ||'fai';
        let xml = "";
        for(let k in obj){
            if (!obj.hasOwnProperty(k)) { continue; }
            if(typeof obj[k] == 'function')continue;
            xml += "<"+k+">"+obj[k]+"</"+k+">";
        }
        xml = '<?xml version="1.0" encoding="UTF-8"?><hash>{{0}}</hash>'.format([xml]);
        res.header('Content-Type','text/html;charset=utf8');
        return res.send(xml);
    };

    me.render_exc_xml = function(res, e) {
        let desc = "";
        for(let keys in e){
            if (!e.hasOwnProperty(keys)) { continue; }
            desc+="["+keys+"]:["+e[keys] + ']; ';
        }

        return me.render_fai_xml(res, {msgCode: -1, msg: 'Exception: ' + e.toString() + desc});
    };

    me.render_result_xml = function(res, obj, t) {
        if(t === 'suc') {
            me.render_suc_xml(res, obj);
        } else {
            me.render_fai_xml(res, obj);
        }
    };

    function some_thing_to_xml(obj) {
        let xml = "";
        for(let k in obj){
            if (!obj.hasOwnProperty(k)) { continue; }
            if(typeof k != 'string')continue;
            if(typeof obj[k] == 'function')continue;
            let v = obj[k];

            // is array
            if(typeof v!= 'string' && v.length && v.length > 0){
                v = array_to_xml(v, k.replace(/s$/,''));
            }
            // is hash
            if(typeof v == 'object'){
                v = some_thing_to_xml(v);
            }

            xml += "<"+k+">"+v+"</"+k+">";
        }
        return xml;
    }

    function array_to_xml(array,name) {
        let temp = "";
        for(let i = 0; i< array.length; i++){
            if(typeof array[i] == 'function')continue;
            if(array[i]){
                let hash = {}; hash[name] = array[i];
                temp += some_thing_to_xml(hash);
            }
        }
        return temp;
    }

    Gd.apply(Gd, me);
})();