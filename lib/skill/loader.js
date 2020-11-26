require('../tl');
var Env = TL.global('Env', require('../../config/env'));
var shell = require('child_process');

function initRedis() {
    var sent1 = [
        {host: '10.10.11.xxx', port: 11111},
        {host: '10.10.11.xxx', port: 11111},
        {host: '10.10.11.xxx', port: 11111}
    ];
    require('../../config/redis')('loader_scripts');
    if (!global.REDIS) {
        var init = require('../conn/ioredis').connRedis;
        TL.global('REDIS', init({n: 'R61504', s: sent1, pass: '3xet8Mw4zi'}, 'w'));
    }
}
function initIP() {
    var ips = shell.execSync('/sbin/ip a|grep inet|grep -v inet6|grep -v 127.0.0').toString();
    CUR_SERVER = ips.match(/\.\d{1,3}\//)[0].replace('.','').replace('/','');
}
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
var FLAG_KEY = 'check_scripts_flag';
var loopTimes = 0;
var CUR_SERVER, cacheStatus = '[0,0,null]';
var jsProject = process.argv[2] || '',
    jsPath    = (process.argv[3] || '').replace(/\|/gi, ' '),
    jsKey     = process.argv[4] || '';

initIP();
initRedis();
setTimeout(loopCheck, 1000);

function loopCheck() {
    loopTimes++;
    REDIS.hget(FLAG_KEY, jsKey, function(err, status) {
        // [时间搓，启动状态，当前IP]
        cacheStatus = status || cacheStatus;
        status = JSON.parse(cacheStatus);

        if (status[2] === CUR_SERVER) {
            loopTimes = 0;
            if (status[1] >= 1) { keepRunning(); }
            setStamps();
        } else {
            killMyself();

            var diff = Date.diff(new Date(), new Date(status[0]), 's');
            if (diff > 90 && loopTimes > 3) {
                getRights();
            } else { Log.log('I wait.' + loopTimes); }
        }

        setTimeout(loopCheck, 30 * 1000);
    });
}
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function killMyself() {
    var cmd = "ps awx|grep 'node ../{{0}}/{{1}}' |grep -v grep|awk '{print $1}'".format([jsProject, jsPath]);
    var exist = shell.execSync(cmd).toString();
    if (exist) { shell.execSync('kill -9 ' + exist); }
}

function keepRunning() {
    var cmd = "ps awx|grep 'node ../{{0}}/{{1}}' |grep -v grep|awk '{print $1}'".format([jsProject, jsPath]);
    var exist = shell.execSync(cmd).toString();
    if (!exist) {
        Log.log('I am running now.');
        shell.execSync("node ../{{0}}/{{1}} >> _logs_/{{2}}.log 2>&1 &".format([jsProject, jsPath, jsKey]));
    }
}

function setStamps() {
    REDIS.hset(FLAG_KEY, jsKey, JSON.stringify([new Date().format(), 1, CUR_SERVER]));
}

function getRights() {
    Log.log('I am going to run......O(∩_∩)O');
    REDIS.hset(FLAG_KEY, jsKey, JSON.stringify([new Date().format(), 0, CUR_SERVER]));
}
