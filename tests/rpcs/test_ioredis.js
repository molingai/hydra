const ioredis = require('ioredis');
const uuid = require('uuid').v4;

const redisdb = ioredis.createClient({db: 0, host: '127.0.0.1', port: 6379});

async function test() {
  // left push
  for (let i = 0; i < 1; i++) {
    console.log('push...', i);
    const id = uuid();
    redisdb.duplicate().brpop(id, 5).then((ret) => {
      console.log('get ret', ret);
    });
    let ret = await redisdb.lpush(id, 2);
    console.log('pushed', ret);
  }

  // Remove and get the last element in a list, or block until one is available
  // let ret2 = await redisdb.brpop('list1', 0)
  // [ 'list1', '1' ]
  // [ 'list1', '2' ]
  // console.log(ret2)
}
test();
