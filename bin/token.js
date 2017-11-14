/*
 * Created by zjj on 2017/11/11.
 * 执行程序			node ./token.js
 * 程序执行后每隔60分钟获取access_token并存入redis（redis失效时间120分钟）
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
const time = 7200; //2小时
const intervalTime = 3600000; //1小时
// const intervalTime = 10000; //10秒，测试用

// 日志配置
log4js.configure({
	appenders: {
		wxToken: {
			type: 'file',
			filename: '/home/myapp/logs/log_date/dateLog/wxToken.log'
		},
		out: {
			type: 'stdout',
			layout: { type: 'colored' }
		},
	},
	categories: {
		default: { appenders: ['out'], level: 'debug' } //默认 
	}
});
// const logger = log4js.getLogger('default');

// 连接Redis服务器
var portR = '6379';
var ipR = '127.0.0.1';
var optionR = { auth_pass: 'zjj15202185069' };
var redisClient = redis.createClient(portR, ipR, optionR);
redisClient.on('ready', function(err) {
	if (err) {
		console.log(err);
	} else {
		console.log('connect redis server OK');
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
			console.log(error);
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
			console.log("access_token：" + access_token);
			redisClient.set(key, access_token);
			redisClient.expire(key, time); //过期时间设置
		});
	}).on('error', function(e) {
		console.error(e.message);
	})
}