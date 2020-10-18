Gd.Server = {
    lastTM: Number(new Date()),
    diffTM: 0,
    setTM: function(tm) {
        if (!tm) { return; }

        let now = Number(new Date());
        tm = parseInt(tm) || now;
        Gd.Server.lastTM = tm;
        Gd.Server.diffTM = tm - now;
    },
    getTM: function() {
        return Number(new Date()) + Gd.Server.diffTM;
    }
};

//
// // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// // 服务器时间设置，
// // 严格一点的话：可以内网找一台服务器做标准，同步时间差异。 也可以不用这种方式，直接服务器 cron 密集同步时间即可。
// function syncServerTime() {
//     Utl.webReqJson({
//         url: Gd.Server.url,
//         cb: function(err, ret) {
//             Gd.Server.setTM(ret._stamp);
//             Log.log('### SYNC_TIME, Diff: ' + Gd.Server.diffTM);
//
//             setTimeout(syncServerTime, 300 * 1000);
//         }
//     });
// }
// setTimeout(function() {
//     if (global.Env && Env.Server && Env.Server.ENV === 'product') {
//         Gd.Server.url = Env.Server.TIME_SERVER_URL || Gd.Server.url;
//         syncServerTime();
//     }
// }, 3 * 1000);
