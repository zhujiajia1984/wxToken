/*
 * Created by zjj on 2017/11/11.
 * 执行程序			node ./token.js
 * 程序执行后每隔60分钟获取access_token并存入redis（redis失效时间120分钟）
 * 显示access_token和jsapi_ticket   https://weiquaninfo.cn/wxPublicAccount/getAccessToken
 */

//
var https = require('https');
var redis = require('redis');
var log4js = require('log4js');
//
const appid = 'wxaed97ec85f7517ba';
const screct = 'fecd688110e195c4ea0e9f3d97797d44';
const url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + screct;
const key = "token";
const keyTicket = "jsapi_ticket";
const keyTicket2 = "api_ticket";
const time = 7200; //2小时
const intervalTime = 3600000; //1小时
// const intervalTime = 10000; //10秒，测试用

// 日志配置
log4js.configure({
    appenders: {
        access_token: {
            type: 'file',
            filename: '/home/node/myapp/logs/access_token.log',
            maxLogSize: 1048576, //单位byte
            keepFileExt: true,
        },
        out: {
            type: 'stdout',
            layout: { type: 'colored' }
        },
    },
    categories: {
        default: { appenders: ['out', 'access_token'], level: 'debug' } //默认 
    }
});
const logger = log4js.getLogger('default');

// 连接Redis服务器
var portR = '6379';
var ipR = 'redis_redis_1';
var optionR = { auth_pass: 'zjj15202185069' };
var redisClient = redis.createClient(portR, ipR, optionR);
redisClient.on('ready', function(err) {
    if (err) {
        logger.error(err);
    } else {
        logger.info('connect redis server OK');
    }
})

// 每隔60分钟获取access_token并存入redis
getAccessToken();
setInterval(function() {
    getAccessToken();
}, intervalTime)


function getAccessToken() {
    https.get(url, function(res) {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'];
        var error = null;
        if (statusCode !== 200) {
            error = "请求失败。状态码: " + statusCode;
        } else if (!/^application\/json/.test(contentType)) {
            error = "无效的 content-type";
        }
        if (error) {
            logger.error(error);
            // 消耗响应数据以释放内存
            res.resume();
            return;
        }

        // 监听事件
        var rawData = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            rawData += chunk;
        });
        res.on('end', function() {
            var data = JSON.parse(rawData);
            var access_token = JSON.stringify(data.access_token);
            logger.info("access_token：" + access_token);
            redisClient.set(key, access_token);
            redisClient.expire(key, time); //过期时间设置
            // 获取jsapi-ticket
            getJsapi_ticket(access_token);
            // 获取api-ticket（微信卡券）
            get_api_ticket(access_token);

        });
    }).on('error', function(e) {
        console.error(e.message);
    })
}


// 获取jsapi-ticket
function getJsapi_ticket(access_token) {
    var token = access_token.substring(1, access_token.length - 1);
    var url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=" + token + "&type=jsapi";
    // logger.info("url_ticket：" + url);
    https.get(url, function(res) {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'];
        var error = null;
        if (statusCode !== 200) {
            error = "请求jsapi-ticket失败。状态码: " + statusCode;
        } else if (!/^application\/json/.test(contentType)) {
            error = "无效的 content-type";
        }
        if (error) {
            logger.error(error);
            // 消耗响应数据以释放内存
            res.resume();
            return;
        }

        // 监听事件
        var rawData = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            rawData += chunk;
        });
        res.on('end', function() {
            var data = JSON.parse(rawData);
            var jsapi_ticket = JSON.stringify(data.ticket);
            logger.info("jsapi_ticket：" + jsapi_ticket);
            redisClient.set(keyTicket, jsapi_ticket);
            redisClient.expire(keyTicket, time); //过期时间设置
        });
    }).on('error', function(e) {
        console.error(e.message);
    })
}

// 获取api-ticket
function get_api_ticket(access_token) {
    var token = access_token.substring(1, access_token.length - 1);
    var url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=" + token + "&type=wx_card";
    // logger.info("url_ticket：" + url);
    https.get(url, function(res) {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'];
        var error = null;
        if (statusCode !== 200) {
            error = "请求jsapi-ticket失败。状态码: " + statusCode;
        } else if (!/^application\/json/.test(contentType)) {
            error = "无效的 content-type";
        }
        if (error) {
            logger.error(error);
            // 消耗响应数据以释放内存
            res.resume();
            return;
        }

        // 监听事件
        var rawData = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            rawData += chunk;
        });
        res.on('end', function() {
            var data = JSON.parse(rawData);
            var api_ticket = JSON.stringify(data.ticket);
            logger.info("api_ticket：" + api_ticket);
            redisClient.set(keyTicket2, api_ticket);
            redisClient.expire(keyTicket2, time); //过期时间设置
        });
    }).on('error', function(e) {
        console.error(e.message);
    })
}

// https.get("https://weiquaninfo.cn/weather/xinzhi", function(res) {
// 	const statusCode = res.statusCode;
// 	var error = null;
// 	if (statusCode !== 200) {
// 		error = "请求失败。状态码: " + statusCode;
// 	}
// 	if (error) {
// 		console.log(error);
// 		// 消耗响应数据以释放内存
// 		res.resume();
// 		return;
// 	}

// 	// 监听事件
// 	var rawData = '';
// 	res.setEncoding('utf8');
// 	res.on('data', function(chunk) {
// 		rawData += chunk;
// 	});
// 	res.on('end', function() {
// 		var data = JSON.parse(rawData);
// 		console.log(data);
// 	});
// }).on('error', function(e) {
// 	console.error(e);
// })