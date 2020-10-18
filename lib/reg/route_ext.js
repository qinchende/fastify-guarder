module.exports = function(fty) {
    // add by cd.net 2020-09-25
    // 本来想通过这种方式实现，发现封装的太厉害，底层得不到 prefix 值。
    fty.decorate('getPost', function(url, options, handler) {
        if (!handler && typeof options === 'function') {
            handler = options;
            options = {}
        }
        options = Object.assign({}, options, {
            method: ['GET','POST'],
            url,
            handler: handler || (options && options.handler)
        });
        fty.route(options);
    });
};

//
// const fp = require('fastify-plugin');
// function reqPlugin (fty, opts, done) {
//     fty.decorate('getPost', function(url, options, handler) {
//         if (!handler && typeof options === 'function') {
//             handler = options;
//             options = {}
//         }
//         options = Object.assign({}, options, {
//             method: ['GET','POST'],
//             url,
//             prefixTrailingSlash: 'no-slash',
//             handler: handler || (options && options.handler)
//         });
//         fty.route(options);
//     });
//     done();
// }
// module.exports = fp(reqPlugin);
//