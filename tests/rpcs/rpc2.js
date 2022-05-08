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
      this.initCallRetMessage();
      return;
    }

    this.initCallMessage();
    this.initCallRetMessage();
  }

  quit() {
    let calls = [this._callRetMessageRedis.quit()];
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
      // log('get call message', message)
      const {id, instanceId, methodName, args} = JSON.parse(message);
      const handler = this._rpcHandlers[methodName];
      const data = await handler.apply(handler, args);
      // log(data)
      // 将结果发到channel 为 rcp-ret:instanceId
      // let publishRet = await this.redisdb.publish('rpc-ret:' + instanceId, JSON.stringify({ id, data: data }));
      let publishRet = await this.publishUntilSuccess(this.redisdb, `rpc-ret:${instanceId}`, JSON.stringify({id, data: data}));
      log('publish ret', publishRet);
    });
    // 监听别人的调用, 如果这里没有成功, 别人publish会返回0
    // sub.subscribe(`rpc:${this.instanceId}`);
    await this.subscribeUntilSuccess(sub, `rpc-call:${this.serviceName}`);
  }

  // 调用后得到消息, 结果消息
  async initCallRetMessage() {
    this._callResolveM = {}; // id => resolve
    this._callTimerM = {}; // id => setTimeout()
    const sub = this.redisdb.duplicate();
    this._callRetMessageRedis = sub;
    // sub.on('ready', () => {
    //     log('initCallRetMessage ready')
    // })
    sub.on('error', (error) => {
      log('initCallRetMessage error', error);
    });
    sub.on('message', (channel, message) => {
      // log('get ret message', message)
      let ret = JSON.parse(message);
      const resolve = this._callResolveM[ret.id];
      if (resolve) {
        resolve(ret.data);
        delete this._callResolveM[ret.id];
        clearTimeout(this._callTimerM[ret.id]);
        delete this._callTimerM[ret.id];
      }
    });
    // 监听channel id, 结果
    // log(id)
    await this.subscribeUntilSuccess(sub, 'rpc-ret:' + this.instanceId);
  }

  // 访问其它 rpc method
  async call(methodName, ...args) {
    const id = uuid();
    const serviceName = await this.redisdb.hget(rpcMethodKey, methodName);
    log('-', serviceName);
    const result = new Promise(async(resolve, reject) => {
      let timer = setTimeout(() => {
        if (this._callResolveM[id]) {
          delete this._callResolveM[id];
          reject('rpc timeout');
        }
      }, 5000);
      this._callResolveM[id] = resolve;
      this._callTimerM[id] = timer;
      // 调用
      await this.publishUntilSuccess(this.redisdb, `rpc-call:${serviceName}`, JSON.stringify({id, instanceId: this.instanceId, methodName, args}));
      log('ok');
    });
    return result;
  }
}

module.exports = RPC;
