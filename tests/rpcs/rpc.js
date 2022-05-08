const ioredis = require('ioredis');
const uuid = require('uuid').v4;

const redisdb = ioredis.createClient({db: 0, host: '127.0.0.1', port: 6379});
const rpcMethodKey = 'rpc-method'; // map 存 { methodName => serviceName }

redisdb.on('ready', () => {
  console.log('ready');
});
redisdb.on('error', (error) => {
  console.log('error', error);
});
// const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

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

class RPC {
  constructor(serviceName = '') {
    this.redisdb = redisdb;
    this.serviceName = serviceName;

    // 不是服务, 只是调用方, 不用处理别人的调用
    if (!serviceName) {
      return;
    }

    this.instanceId = uuid();
    this._rpcHandlers = {}; // methodName => fn

    const sub = this.redisdb.duplicate();
    // 收到别人的调用, 处理, 并将结果发到channel中
    sub.on('message', async(channel, message) => {
      // console.log('get call message', message)
      const {id, methodName, args} = JSON.parse(message);
      const handler = this._rpcHandlers[methodName];
      const data = await handler.apply(handler, args);
      // console.log(data)
      // 将结果发到channel 为 id
      let publishRet = await this.redisdb.publish(id, JSON.stringify(data));
      // console.log(publishRet)
    });
    // 监听别人的调用
    // sub.subscribe(`rpc:${this.instanceId}`);
    sub.subscribe(`rpc-call:${this.serviceName}`);
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

  // 访问其它 rpc method
  async call(methodName, ...args) {
    const id = uuid();
    // 通过methodName找到serviceName
    const serviceName = await this.redisdb.hget(rpcMethodKey, methodName);
    // const instanceIds = R.map(R.prop('instanceID'), await this.getServicePresence(serviceName));
    // if (!serviceName || instanceIds.length == 0){
    //     const allMethods = R.keys(await this.redisdb.hgetallAsync(rpcMethodKey));
    //     const closest = didyoumean(methodName, allMethods);
    //     const suggest = closest ? `Did you mean "${closest}"?` : '';
    //     throw new Error(`No Service registered for "${methodName}" method. ${suggest}`);
    // }
    // 调用
    const result = new Promise(async(resolve, reject) => {
      const sub = this.redisdb.duplicate();
      sub.on('message', (channel, message) => {
        // console.log('get message', message)
        resolve(JSON.parse(message));
        sub.unsubscribe();
        sub.quit();
      });
      // 监听channel id, 结果
      // console.log(id)
      await sub.subscribe(id);
      let publishRet = await this.redisdb.publish(`rpc-call:${serviceName}`, JSON.stringify({id, methodName, args}));
      // console.log(publishRet) // 1
    });
    return result;
  }
}

module.exports = RPC;
