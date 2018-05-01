/*
 * Created by zjj on 2018/5/1.
 * 执行程序			node ./authorizer.js
 * 程序执行后每隔10分钟检查authorizer_access_token，如果剩余时间小于20分钟，则更新
 */

setInterval(() => {
    console.log("authorizer");
}, 10000)