const ioredis = require('ioredis');
const uuid = require('uuid').v4;

/*
// 服务方
const service1 = new RPC('service1')
service1.methods({
    ping (name) {
        return 'pong ' + name
    }
})

//  调用方
const client1 = new RPC()
let ret = await client1.call('ping', 'life')
console.log(ret)
*/

const rpcMethodKey = 'rpc-method'; // map 存 { methodName => serviceName }

function log(...args) {
  // console.log(...args)
}

const redisdb = ioredis.createClient({db: 0, host: '127.0.0.1', port: 6379});
redisdb.on('ready', () => {
  log('ready');
});
redisdb.on('error', (error) => {
  log('error', error);
});
const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

class RPC {
  constructor(serviceName = '') {
    this.redisdb = redisdb;
    this.serviceName = serviceName;
    this.instanceId = uuid();

    // 不是服务, 只是调用方, 不用处理别人的调用
    if (!serviceName) {
      return;
    }

    this.initCallMessage();
  }

  quit() {
    let calls = [];
    if (this._callMessageRedis) {
      calls.push(this._callMessageRedis.quit());
    }
    return Promise.all(calls);
  }

  methods(obj) {
    for (let methodName in obj) {
      this.addMethod(methodName, obj[methodName]);
    }
  }

  // 添加method
  addMethod(methodName, fn) {
    this.redisdb.hset(rpcMethodKey, methodName, this.serviceName); // methodName => serviceName
    this._rpcHandlers[methodName] = fn;
  }

  async subscribeUntilSuccess(client, channel) {
    let count = 0;
    while (count++ < 10) {
      let ret = await client.subscribe(channel);
      if (ret) {
        return true;
      }
    }
    throw new Error('subscribe failed: ' + channel);
  }

  async publishUntilSuccess(client, channel, msg) {
    let count = 0;
    while (count++ < 10) {
      let ret = await client.publish(channel, msg);
      if (ret) {
        return true;
      }
      await sleep(10);
      log('publish', channel, ret);
    }
    throw new Error('publish failed: ' + channel + ' ' + msg);
  }

  // 获取别人的调用消息
  async initCallMessage() {
    this._rpcHandlers = {}; // methodName => fn

    const sub = this.redisdb.duplicate();
    this._callMessageRedis = sub;
    // sub.on('ready', () => {
    //     log('rpc-call ready')
    // })
    sub.on('error', (error) => {
      log('rpc-call error', error);
    });
    // 收到别人的调用, 处理, 并将结果发到channel中
    sub.on('message', async(channel, message) => {
      log('get call message', message);
      const {id, instanceId, methodName, args} = JSON.parse(message);
      const handler = this._rpcHandlers[methodName];
      const data = await handler.apply(handler, args);
      // 结果发到id上
      log('lpush...', id);
      let ret = await this.redisdb.lpush(id, JSON.stringify(data));
      log('lpush ret', id, ret);
    });
    // 监听别人的调用, 如果这里没有成功, 别人publish会返回0
    // sub.subscribe(`rpc:${this.instanceId}`);
    await this.subscribeUntilSuccess(sub, `rpc-call:${this.serviceName}`);
  }

  // 访问其它 rpc method
  async call(methodName, ...args) {
    const id = uuid();
    const serviceName = await this.redisdb.hget(rpcMethodKey, methodName);
    log('-', serviceName);
    const result = new Promise(async(resolve, reject) => {
      // 调用
      await this.publishUntilSuccess(this.redisdb, `rpc-call:${serviceName}`, JSON.stringify({id, instanceId: this.instanceId, methodName, args}));
      log('ok');

      // 用新的redis client去阻塞, 如果用旧的会阻塞其它操作
      const sub = this.redisdb.duplicate();
      const ret = await sub.brpop(id, 5); // ['id', ret] 不管用不用await都会阻塞所有
      sub.quit();
      resolve(ret[1]);
    });
    return result;
  }
}

module.exports = RPC;
