/*
 * Created by zjj on 2017/11/15.
 *
 * 
 */

//
var redis = require('redis');
var log4js = require('log4js');
var async = require('async');
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

// 选择数据库，默认为0
// client.select(3, function() { /* ... */ });

// 可选
redisClient.on('ready', function(err) {
	if (err) {
		logger.error(err);
	} else {
		logger.info('connect redis server OK');
	}
})

// 必须使用，监听error
redisClient.on("error", function(err) {
	logger.error("Error：" + err);
});

//添加商品表（商品ID对应商品名称）
for (var i = 0; i < 5; i++) {
	async.waterfall([
		function(cb) {
			// 建立ID索引值（0开始自增，全局唯一）
			redisClient.incr("id", function(err, res) {
				if (res) {
					logger.info("incr Success---" + "res:" + res); //ok
					cb(null, res)
				} else {
					logger.error("incr Failed---" + "res:" + res); //error
				}
			})
		},
		function(id, cb) {
			redisClient.hmset("goodsIdtoName", ["商品" + id, id], function(err, res) {
				if (res) {
					logger.info("hmset Success---" + "res:" + res); //ok
					cb(null, id)
				} else {
					logger.error("hmset Failed---" + "res:" + res); //error
				}
			})
		},
	], function(err, results) {
		if (err) {
			logger.error(err);
			return;
		} else {
			redisClient.quit();
		}
	});
}

//添加购物车表并对商品+数量（商品ID对应数量）
async.waterfall([
	function(cb) {
		//对商品ID为5的数量+1
		redisClient.hincrby("cart", 5, 1, function(err, res) {
			if (res) {
				logger.info("hincrby Success---" + "res:" + res); //ok
				cb(null, res)
			} else {
				logger.error("hincrby Failed---" + "res:" + res); //error
			}
		})
	},
], function(err, results) {
	if (err) {
		logger.error(err);
		return;
	} else {
		redisClient.quit();
	}
});




//------------------------------------------------------------------



//字符串(set, get)
// var strData = { name: "zjj", age: "30" };
//----------------------------------------------------------------
// redisClient.set("我测试", JSON.stringify(strData), function(err, res) {
// 	if (res) {
// 		logger.info("set Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("set Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.set("profile", JSON.stringify(strData), 'NX', 'EX', '10', function(err, res) {
// 	if (res) {
// 		logger.info("Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("set Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.get("我测试", function(err, res) {
// 	if (res) {
// 		logger.info("get Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("get Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.incr("count", function(err, res) {
// 	if (res) {
// 		logger.info("incr Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("incr Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.exists("profile", function(err, res) {
// 	if (res) {
// 		logger.info("key profile Exist---" + "res:" + res); //ok
// 	} else {
// 		logger.error("key profile Not Exist---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.del("profile", function(err, res) {
// 	if (res) {
// 		logger.info("del profile Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("del profile Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.expire("profile", 10, function(err, res) {
// 	if (res) {
// 		logger.info("expire profile Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("expire profile Failed---" + "res:" + res); //error
// 	}
// })
// List的常用案例
// 正如你可以从上面的例子中猜到的，list可被用来实现聊天系统。还可以作为不同进程间传递消息的队列。关键是，你可以每次都以原先添加的顺序访问数据。这不需要任何SQL ORDER BY 操作，将会非常快，也会很容易扩展到百万级别元素的规模。
// 例如在评级系统中，比如社会化新闻网站 reddit.com，你可以把每个新提交的链接添加到一个list，用LRANGE可简单的对结果分页。
// 在博客引擎实现中，你可为每篇日志设置一个list，在该list中推入博客评论，等等。
//----------------------------------------------------------------
// redisClient.hmset("profile", ["username", "zjj", "userid", "567"], function(err, res) {
// 	if (res) {
// 		logger.info("hmset profile Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("hmset profile Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.hget("profile", "username", function(err, res) {
// 	if (res) {
// 		logger.info("hget username Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("hget username Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.hmget("profile", "username", "userid", function(err, res) {
// 	if (res) {
// 		logger.info("hmget  Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("hmget  Failed---" + "res:" + res); //error
// 	}
// })
//----------------------------------------------------------------
// redisClient.hincrby("profile", "userid", 10, function(err, res) {
// 	if (res) {
// 		logger.info("hincrby  Success---" + "res:" + res); //ok
// 	} else {
// 		logger.error("hincrby  Failed---" + "res:" + res); //error
// 	}
// })


//客户端退出连接
// redisClient.quit();