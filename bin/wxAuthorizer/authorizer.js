/*
 * Created by zjj on 2018/5/1.
 * 执行程序			node ./authorizer.js
 * 程序执行后每隔10分钟检查authorizer_access_token，如果剩余时间小于15分钟，则更新
 */
// log4js
var log4js = require('log4js');
var https = require('https');
log4js.configure({
    appenders: {
        out: {
            type: 'stdout',
            layout: { type: 'colored' }
        },
        log_date: {
            type: 'dateFile',
            filename: '/home/node/myapp/logs/log',
            alwaysIncludePattern: true,
            pattern: "-yyyy-MM-dd.log",
            keepFileExt: true,
        },
    },
    categories: {
        default: { appenders: ['out', 'log_date'], level: 'ALL' }, //默认
    }
})
// mongo
const MongoClient = require('mongodb').MongoClient;
// 连接Redis服务器
var redis = require('redis');
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
redisClient.select(1, (err) => {
    if (err) return console.log(err);
    logger.info('redis db1 switch ok');
});

// const
const logger = log4js.getLogger('default');
const component_appid = "wx805ef435fca595d2"; //第三方平台appid


// main app
//////////////////////////////////////////////////////////////////////////////////////////////
setInterval(() => {
    getAppid().then((data) => {
        return checkAndRefreshToken(data);
    }).then((result) => {
        logger.info("result: ", result);
    }).catch((error) => {
        logger.error(error);
    })
}, 600000)


// function
//////////////////////////////////////////////////////////////////////////////////////////////
// 更新token
function refreshToken(data) {
    return new Promise((resolve, reject) => {
        let key = `${component_appid}_component_access_token`;
        redisClient.get(key, (err, component_access_token) => {
            if (err) return reject(err);
            if (component_access_token) {
                const postData = JSON.stringify({
                    component_appid: component_appid,
                    authorizer_appid: data.authorizer_appid,
                    authorizer_refresh_token: data.authorizer_refresh_token
                });
                const options = {
                    hostname: "api.weixin.qq.com",
                    path: `/cgi-bin/component/api_authorizer_token?component_access_token=${component_access_token}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(postData, 'utf-8')
                    }
                };
                const req = https.request(options, (res) => {
                    res.setEncoding('utf8');
                    let rawData = '';
                    res.on('data', (chunk) => {
                        rawData += chunk;
                    });
                    res.on('end', () => {
                        // 反馈结果
                        let result = JSON.parse(rawData);
                        // 保存
                        let key = `${component_appid}_${data.authorizer_appid}_authorizer_access_token`;
                        redisClient.set(key, result.authorizer_access_token, 'EX', result.expires_in, (err, reply) => {
                            if (err) return reject(err);
                            return resolve();
                        })
                    });
                });
                req.on('error', (e) => {
                    reject(`problem with request: ${e.message}`);
                });
                req.write(postData);
                req.end();
            }
        })
    })
}

//////////////////////////////////////////////////////////////////////////////////////////////
// 判断是否需要更新token
function getTokenTime(data) {
    return new Promise((resolve, reject) => {
        let key = `${component_appid}_${data.authorizer_appid}_authorizer_access_token`;
        redisClient.ttl(key, (err, time) => {
            if (err) return reject(err);
            // 剩余15分钟以内,刷新
            if (time <= 900) {
                return resolve(true);
            } else {
                return resolve(false);
            }
        })
    })
}

//////////////////////////////////////////////////////////////////////////////////////////////
// async 检查token是否即将过期，是则刷新token
async function checkAndRefresh(data) {
    for (let i = 0; i < data.length; i++) {
        let isNeedRefresh = await getTokenTime(data[i]);
        if (isNeedRefresh) {
            await refreshToken(data[i]);
        }
    }
    return "token ok";
}

//////////////////////////////////////////////////////////////////////////////////////////////
// 检查token是否即将过期，是则刷新token
function checkAndRefreshToken(data) {
    return new Promise((resolve, reject) => {
        checkAndRefresh(data).then((result) => {
            resolve(result)
        }).catch((error) => {
            reject(error);
        })
    })
}

//////////////////////////////////////////////////////////////////////////////////////////////
// mongodb crud
async function getAppidFromMongo() {
    const client = await MongoClient.connect("mongodb://mongodb_mongodb_1:27017");
    const db = client.db("wxPlatform");
    let result = await db.collection('account').find({
        component_appid: component_appid
    }, {
        projection: { authorizer_appid: 1, authorizer_refresh_token: 1 }
    }).toArray();
    client.close();
    return result;
}

//////////////////////////////////////////////////////////////////////////////////////////////
// 获取所有已授权的微信公众号appid
function getAppid() {
    return new Promise((resolve, reject) => {
        getAppidFromMongo().then((result) => {
            if (result.length > 0) {
                resolve(result);
            } else {
                reject("appid not exist!");
            }
        })
    })
}