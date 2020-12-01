// 希望将所有 global 对象，放入 global.Gd 中。
Gd.global = function(key, fun, opt) {
    if (Gd[key]) { return Gd[key]; }

    if (Object.prototype.toString.call(fun) === '[object Function]') {
        fun = fun(opt);
    }
    return Gd[key] = global[key] = fun;
};
Gd.define = function(key, fun, opt) {
    if (Gd.Outs[key]) { return Gd.Outs[key]; }

    if (Object.prototype.toString.call(fun) === '[object Function]') {
        fun = fun(opt);
    }
    return Gd.Outs[key] = global[key] = fun;
};
Gd.apply = function(t, c, def) {
    t = t || {};
    if (def) { Gd.apply(t, def); }
    if (t && c && typeof c === 'object') {
        for (let i in c) {
            if (c.hasOwnProperty && !c.hasOwnProperty(i)) { continue; }
            t[i] = c[i];
        }
    }
    return t;
};

Gd.apply(Gd, {
    emptyFn: function() {},

    forEach: function(obj, cb) {
        let len = obj.length;
        if (len !== undefined) {
            for (let i = 0; i < len; i++) {
                if (cb.call(obj[i], i, obj[i]) === false) { break; }
            }
        } else if (obj.toString() === '[object Object]') {
            for (let k in obj) {
                if (obj.hasOwnProperty && !obj.hasOwnProperty(k)) { continue; }
                if (cb.call(obj[k], k, obj[k]) === false) { break; }
            }
        }
    },

    // 返回一个集合的所有 keys 数组。
    getKeys: function(obj) {
        let keys = [];
        for (let k in obj || {}) {
            if (obj.hasOwnProperty && !obj.hasOwnProperty(k)) { continue; }
            keys.push(k);
        }
        return keys;
    },

    applyStrict: function(t, c) {
        t = t || {};
        if (t && c && typeof c === 'object') {
            for (let p in c) {
                if (c.hasOwnProperty && !c.hasOwnProperty(p)) { continue; }
                if (c[p]) { t[p] = c[p]; }
            }
        }
        return t;
    },

    applyIf: function(t, c) {
        t = t || {};
        if (t && c && typeof c === 'object') {
            for (let p in c) {
                if (c.hasOwnProperty && !c.hasOwnProperty(p)) { continue; }
                if (t[p] === undefined) { t[p] = c[p]; }
            }
        }
        return t;
    },

    applyIfStrict: function(t, c) {
        t = t || {};
        if (t && c && typeof c === 'object') {
            for (let p in c) {
                if (c.hasOwnProperty && !c.hasOwnProperty(p)) { continue; }
                if (t[p] === undefined && c[p]) { t[p] = c[p]; }
            }
        }
        return t;
    },

    // 目前支持 Function 和 object
    // 得到的都将是一个Object.
    applyClone: function(c) {
        let t = {};
        let keys = Object.getOwnPropertyNames(c);
        if (typeof c == 'object') { keys = keys.concat(Object.getOwnPropertyNames(Object.getPrototypeOf(c))); }
        for (let i = 0; i < keys.length; i++) { t[keys[i]] = c[keys[i]]; }
        return t;
    }
});
