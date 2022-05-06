const redis = require('redis');
async function test() {
  let db = redis.createClient({db: 0, host: '127.0.0.1', port: 6379});
  db.on('ready', () => {
    console.log('connceted');
  });
  db.set('life', 'you');
  db.get('life', (err, ret) => {
    console.log('get', ret); // you
  });
  db.lpush('x', 1, (err, ret) => {
    console.log('lpush', ret); // 95
  });
  db.select(0, (err, ret) => {
    console.log('select', ret); // OK
  });
  // [ 'OK', 96, you ]
  db.multi().select(0).lpush('x', 1).get('life').exec((err, ret) => {
    console.log(ret);
  });
}
test();
/*
this.redisdb.batch()
      .expire(`${redisPreKey}:${this.serviceName}:${this.instanceID}:health`, KEY_EXPIRATION_TTL)
      .expire(`${redisPreKey}:${this.serviceName}:${this.instanceID}:health:log`, ONE_WEEK_IN_SECONDS)
      .exec();
  this.redisdb.del(`${redisPreKey}:${this.serviceName}:${this.instanceID}:presence`, () => {
      this.redisdb.quit();
      Promise.all(promises).then(resolve);
    });

  this.redisdb.keys(pattern, (err, result) => {
      if (err) {
        resolve([]);
      } else {
        resolve(result);
      }
    });

  this.redisdb.scan(cursor, 'MATCH', pattern, 'COUNT', KEYS_PER_SCAN, (err, result) => {
        if (!err) {

this.redisdb.set(`${redisPreKey}:${serviceName}:service`, serviceEntry, (err, _result) => {
    if (err) {

        this.redisdb.duplicate();


        let trans = this.redisdb.multi();
    [
      `[get]/${this.serviceName}`,
      `[get]/${this.serviceName}/`,
      `[get]/${this.serviceName}/:rest`
    ].forEach((pattern) => {
      routes.push(pattern);
    });

this.redisdb.smembers(routesKey, (err, result) => {
    if (err) {
      reject(err);
    } else {
      resolve(result);
    }
  });

this.redisdb.closing


this.redisdb.multi()
      .select(HYDRA_REDIS_DB)
      .lpush(key, entry)
      .ltrim(key, 0, MAX_ENTRIES_IN_HEALTH_LOG - 1)
      .exec();

this.redisdb.hgetall(`${redisPreKey}:nodes`, (err, data) => {

lpush

rpoplpush

lrem

rpush

hget
hset
hkeys
*/
