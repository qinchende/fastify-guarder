const fs = require('fs');

Gd.commonHandler = function (fty, opts) {
    Gd.getPost(fty, '/r_server_time', (req, res) => {
        Gd.suc(res);
    });

    fty.get('/favicon.ico', {config: {loginCheck: false}}, (req, res) => {
        res.skipLog = true;
        res.send('O(∩_∩)O');
    });

    fty.setNotFoundHandler({}, function (req, res) {
        Gd.renderResult(res, {msg: 'Not found.', msgCode: 404}, 'fai');
    });

    fty.setErrorHandler(function (error, req, res) {
        Gd.renderResult(res, {msg: error.toString(), msgCode: 500}, 'fai');
    });

    // 打印路由数，供调试查看
    if (opts.printRouteTree) {
        fty.ready(() => {
            Log.log("The routes tree:");
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            console.log(fty.printRoutes());
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        });
    }
};

// 递归遍历所有的路由处理函数，注册加入路由树
Gd.routeDir = function (fty, absPath, relPath, curUrl) {
    let items = fs.readdirSync(absPath + '/' + relPath);
    let cur, curPath, rt, file, stats;

    for (let i = 0; i < items.length; i++) {
        file = items[i];
        if (file === '.svn') continue;
        if (file.indexOf('_') === 0) continue;

        cur = relPath + '/' + file;
        curPath = absPath + '/' + cur;

        stats = fs.statSync(curPath);
        if (stats.isDirectory()) {
            Gd.routeDir(fty, absPath, cur, curUrl + file + '/');
        } else {
            rt = curUrl + file.replace('.js', '/');
            if (file === 'index.js') rt = curUrl;

            fty.register(require(curPath), {prefix: rt});
        }
    }
};
