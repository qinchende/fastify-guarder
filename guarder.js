// MIT License
//
// Copyright (c) 2016 - 2020 闪电侠(chende.ren)
//
// NodeJS Guarder for fastify .
//
//     Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 全局对象 Gd 是本包的核心，所有其它对象和方法都放入Gd中
global.Gd = {
    Outs: {},
    MetaInfo: {
        projectName: 'FastifyGuarder',
        designer: 'cd.net(qinchende@qq.com)'
    },
};

require('./lib/core');          // global Gd.xxx
require('./lib/class_ext');
require('./lib/logger');        // global Log.xxx
require('./lib/crypto_sec');
require('./lib/utils');

require('./lib/web/render');
require('./lib/web/req_log');

require('./lib/web/server');
// require('./lib/skill/client');

require('./lib/reg/hook');
require('./lib/reg/route');

// 目前只支持这几种，后期慢慢添加
require('./lib/conn/conn');
require('./lib/conn/ioredis');
require('./lib/conn/mysql2');
require('./lib/conn/mqtt');
require('./lib/conn/sms');

require('./lib/session/base');
require('./lib/session/token');

module.exports = function(outsOptions) {
    Gd.apply(Gd.Outs, outsOptions || {});
    return Gd;
};