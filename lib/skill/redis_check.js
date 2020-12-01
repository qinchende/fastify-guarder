// create by cd.net on 2019-11-21
// Auto check redis instance status. Auto do something.
function redisAutoCheck(redis, cf) {
    if (!redis || !cf) return;

    var info = {};
    var stat = { infoTimes: 0, aofRewriteTime: 0 };
    var checkInter = Utl.randomInt(60, 180)*1000;
    setInterval(loop, checkInter);

    function loop() {
        stat.now = Number(new Date());

        try {
            if (!readyToAof()) return;
            getInfo(function() {
                aofRewrite();
            });
        } catch (e) {
            Log.log('RedisCheckErr: ' + e);
            if (global.Sms) { global.Sms.adminNotice('13800138000', 'RedisCheckErr', redis.hostPort()) }
        }
    }

    function getInfo(mcb) {
        stat.infoTimes++;
        Log.log(redis.hostPort() + " RedisCheckGetInfo: " + stat.infoTimes);
        redis.info(function(err, ret) {
            if (err || typeof ret !== "string") return;

            var lines = ret.split("\r\n");
            var parts, i;
            for (i = 0; i < lines.length; ++i) {
                parts = lines[i].split(":");
                if (parts[1]) { info[parts[0]] = parts[1]; }
            }
            info._stamps = Number(new Date());
            mcb && mcb();
        });
    }

    function readyToAof() {
        if (!cf.aof) return false;
        // 2小时内刚执行过一次，直接跳过检查
        if (stat.now - stat.aofRewriteTime < 2*3600*1000) return false;

        var begin = cf.aof[0] || '01:00', end = cf.aof[1] || '02:00';
        if (!/^\d{2}:\d{2}$/.test(begin)) { Log.log('Bad time format.[begin]'); return false; }
        if (!/^\d{2}:\d{2}$/.test(end)) { Log.log('Bad time format.[end]'); return false; }

        var time = (new Date(stat.now)).format('hh:mm');
        return time >= begin && time <= end;
    }

    // aof: [开始,结束,增长大小(MB)]
    // aof: ['17:16','18:00',512]
    function aofRewrite() {
        if (info['aof_enabled'] !== '1') return;
        if (info['aof_rewrite_in_progress'] === '1') return;

        var curr = parseInt(info['aof_current_size'] || '0');
        var base = parseInt(info['aof_base_size'] || '0');
        if (curr <= 0 || base <= 0) return;

        // Aof文件增长翻倍 或者 增量大于某个值(MB)  就要执行收缩
        var growSize = cf.aof[2] || 512;
        if (growSize < 64) growSize = 64; // 最小值64MB
        var rate = parseFloat((curr / base).toFixed(2));
        var grow = parseInt((curr - base)/1024/1024);
        if (rate < 2 && grow < growSize) return;

        stat.aofRewriteTime = Number(new Date());
        redis.bgrewriteaof(function(err, ret) {
            Log.log('=AutoRewriteAof=');
            Log.log('++++++++++++++++++++++++++++++++++++++');
            Log.log(redis.hostPort());
            Log.log(info['tcp_port'] + ' -> ' + info['role']);
            Log.log(ret);
            if (err) Log.log(err);
            Log.log('BaseSize: ' + base);
            Log.log('CurrSize: ' + curr);
            Log.log('Rate: ' + rate + ' | Grow(MB): ' + grow);
            Log.log('++++++++++++++++++++++++++++++++++++++');
        });
    }
}
module.exports = redisAutoCheck;