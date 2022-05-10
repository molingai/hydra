const redis = require('ioredis');

async function test() {
  let db = redis.createClient({db: 0, host: '127.0.0.1', port: 6379});
  db.on('ready', () => {
    console.log('connceted');
  });
  // await db.connect()
  console.log(await db.set('life', 'you'));
  console.log(await db.get('life'));

  // OK 98 null
  console.log(await db.select(0), await db.lpush('x', 1), await db.get('life'));

  // [ [ null, 'OK' ], [ null, 99 ], [ null, null ] ]
  let ret2 = await db.multi().select(0).lpush('x', 1).get('life').exec();
  console.log(ret2);

  // [ [ null, 'you' ] ]
  console.log(await db.multi().set('key1', 'xx').incr('life').exec());
  console.log(await db.get('key1'), await db.get('life'));

  console.log('------pipeline-----');
  // [ [ null, 'xx' ], [ null, 'you' ] ]
  console.log(await db.pipeline().get('key1').get('life').exec());

  let db2 = db.duplicate();
  let sret = await db2.subscribe('life');
  console.log('sret', sret);
  // db2.on('mess')
  // await db2.unsubscribe('life')
  db2.on('message', (body) => {});
  // let db3 = db.duplicate()
  // let db4 = db.duplicate()
  // await Promise.all([db2.quit(), db3.quit(), db4.quit()])
  // await db2.quit()
  // await sleep(100)
  await db.quit();
  try {
    await db2.quit();
    await db2.quit();
  } catch (e) {
    console.error('>>>>>>>');
  }
  console.log('done');
}

// function sleep(timeout) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, timeout);
//   });
// }
async function test2() {
  for (let i = 0; i < 1; ++i) {
    await test();
  }
}
test2();
