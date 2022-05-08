function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

async function test() {
  // let name = require.resolve('./rpc2');
  // delete require.cache[name];
  // const RPC = require('./rpc')
  const RPC = require('./rpc3');
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

  await service1.quit();
  await client1.quit();
}

async function main() {
  for (let i = 0; i < 1; ++i) {
    // console.log(i)
    await test();
    // await sleep(100)
  }
}

main();
