/*
 * Created by zjj on 2017/11/15.
 *
 * 
 */

//
var https = require('https');
var redis = require('redis');
var log4js = require('log4js');
//

// 日志配置
log4js.configure({
	appenders: {
		out: {
			type: 'stdout',
			layout: { type: 'colored' }
		},
	},
	categories: {
		default: { appenders: ['out'], level: 'debug' } //默认 
	}
});
const logger = log4js.getLogger('default');

// 连接Redis服务器
var portR = '6379';
var ipR = '127.0.0.1';
var optionR = { auth_pass: 'zjj15202185069' };
var redisClient = redis.createClient(portR, ipR, optionR);
redisClient.on('ready', function(err) {
	if (err) {
		logger.error(err);
	} else {
		logger.info('connect redis server OK');
	}
})