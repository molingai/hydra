const RPC = require('./rpc');
// const RPC = require('./rpc2')
async function test() {
  // 服务方
  const service1 = new RPC('service1');
  service1.methods({
    ping(name) {
      return 'pong ' + name;
    }
  });

  //  调用方
  const client1 = new RPC();
  const s = Date.now();
  for (let i = 0; i < 3000; ++i) {
    let ret = await client1.call('ping', 'life' + i);
    // console.log(ret)
  }
  const e = Date.now();
  console.log((e - s) / 1000);
}

test();
