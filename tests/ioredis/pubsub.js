const redis = require('ioredis');
const utils = require('../../lib/utils')

async function main() {
  // https://github.com/luin/ioredis#auto-reconnect
  // maxRetriesPerRequest 重连次数 == null 表示不限制次数
  const subClient = redis.createClient({ db: 0, host: '127.0.0.1', port: 6379, maxRetriesPerRequest: 5 });
  let i = 0
  subClient.on('reconnecting', () => {
    console.log('reconnecting', i++)
  })
  const pubClient = subClient.duplicate()

  const channel = 'channel1'
  subClient.subscribe(channel)
  subClient.on('message', (channel, msg) => {
    console.log(channel, msg)
  })

  for (let i = 0; i < 1000; ++i) {
    pubClient.publish(channel, 'hello' + i)
    await utils.sleep(1000)
  }
}

async function test() {
  await main();
}
test();
