'use strict';

const crypto = require('crypto');

/**
* @name Utils
* @return {undefined}
*/
class Utils {
  /**
  * @name md5Hash
  * @summary Hashes a key to produce an MD5 hash
  * @param {string} key - input key to hash
  * @return {string} hash - hashed value
  */
  static md5Hash(key) {
    return crypto
      .createHash('md5')
      .update(key)
      .digest('hex');
  }

  /**
   * @name safeJSONStringify
   * @summary Safe JSON stringify
   * @param {object} obj - object to stringify
   * @return {string} string - stringified object.
   */
  static safeJSONStringify(obj) {
    // replaceErrors below credited to Jonathan Lonowski via Stackoverflow:
    // https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
    let replaceErrors = (key, value) => {
      if (value instanceof Error) {
        let error = {};
        Object.getOwnPropertyNames(value).forEach((key) => {
          error[key] = value[key];
        });
        return error;
      }
      return value;
    };
    return JSON.stringify(obj, replaceErrors);
  }

  /**
   * @name safeJSONParse
   * @summary Safe JSON parse
   * @private
   * @param {string} str - string which will be parsed
   * @return {object} obj - parsed object
   *   Returns undefined if string can't be parsed into an object
   */
  static safeJSONParse(str) {
    let data;
    try {
      data = JSON.parse(str);
    } catch (e) {
      data = undefined;
    }
    return data;
  }

  /**
   * @name stringHash
   * @summary returns a hash value for a supplied string
   * @see https://github.com/darkskyapp/string-hash
   * @private
   * @param {object} str - string to hash
   * @return {number} hash - hash value
   */
  static stringHash(str) {
    let hash = 5381;
    let i = str.length;
    while (i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
  }

  /**
  * @name shortID
  * @summary generate a random id composed of alphanumeric characters
  * @see https://en.wikipedia.org/wiki/Base36
  * @return {string} random string id
  */
  static shortID() {
    return (Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString(36);
  }

  /**
  * @name isUUID4
  * @summary determine whether a string is a valid UUID
  * @param {string} str - possible UUID
  * @return {undefined}
  */
  static isUUID4(str) {
    const uuidPattern = '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$';
    return (new RegExp(uuidPattern)).test(str);
  }

  /**
  * @name shuffeArray
  * @summary shuffle an array in place
  * @param {array} a - array elements may be numbers, string or objects.
  * @return {undefined}
  */
  static shuffleArray(a) {
    for (let i = a.length; i; i--) {
      let j = Math.floor(Math.random() * i);
      [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
  }

  /**
   * @name ioToRedisTrxAdapter
   * @summary this function works as an adapter for the ioredis to node redis multi operations result
   * so we don't have to change the code
     redis:
     [ 'OK', 96, you ]
     db.multi().select(0).lpush('x', 1).get('life').exec((err, ret) => {
       console.log(ret);
     });

     ioredis:
     [ [ null, 'OK' ], [ null, 99 ], [ null, null ] ]
     let ret2 = await db.multi().select(0).lpush('x', 1).get('life').exec();

     [ [ null, 'you' ] ]
     console.log(await db.multi().get('life').exec());

     [
      [ null, 'OK' ],
      [
        ReplyError: ERR value is not an integer or out of range
      ]
     ]
     console.log(await db.multi().set('key1', 'xx').incr('life').exec());

   * @param {array} multiResult - this is the output of the multi operation from IORedis
   * @return {array} this is the changed result that the redis package would output
   */
  static ioToRedisMultiAdapter(multiResult) {
    let result = [];
    for (let trx of multiResult) {
      // node_redis的返回结果
      // this is the case where this output is already an output from node_redis package
      if (!Array.isArray(trx)) {
        return multiResult;
      }

      // if the trx index 0 is null then there is no error
      if (!trx[0]) {
        result.push(trx[1]);
        continue;
      }

      // 有错误的情况
      // if there is a value in the first element then this is an error
      if (trx[0]) {
        result.push(trx[0].ReplyError);
      }
    }

    return result;
  }

  /**
   * @name getBatchOrPipeline
   * @summary just a function to see wethere this is instance of node_redis or ioredis
   * and return the right function name for making batch commands.

    pipeline 只是把多个redis指令一起发出去，redis并没有保证这些指定的执行是原子的；
    multi相当于一个redis的transaction的，保证整个操作的原子性，避免由于中途出错而导致最后产生的数据不一致。
    通过测试得知，pipeline方式执行效率要比其他方式高10倍左右的速度，启用multi写入要比没有开启慢一点。

    multi Redis的事务还能保证一个事务内的命令依次执行而不被其他命令插入。
    试想客户端A需要执行几条命令，同时客户端B发送了一条命令，如果不使用事务，则客户端B的命令可能会插入到客户端A的几条命令中执行。
    如果不希望发生这种情况，也可以使用事务

    Redis的事务没有关系数据库事务提供的回滚（rollback）功能 。
    为此开发者必须在事务执行出错后自己收拾剩下的摊子（将数据库复原回事务执行前的状态等）。
    所以, 可能有些命令执行成功了, 有些失败了!!

    https://blog.csdn.net/qmhball/article/details/79074421
    Redis::MULTI方式会将命令逐条发给redis服务端。只有在需要使用事物时才选择Redis::MULTI方式，它可以保证发给redis的一系列命令以原子方式执行。但效率相应也是最低的。
    Redis::PIPELINE方式，可以将一系列命令打包发给redis服务端。如果只是为了一下执行多条redis命令，无需事物和原子性，那么应该选用Redis::PIPELINE方式。代码的性能会有大幅度提升！

   * @param {object} redisDB - take the redisDB instance
   * @return {string} return the function name for making batch commands in each package
   */
  static getBatchOrPipeline(redisDB) {
    // node_redis === multi
    if (redisDB.batch) {
      return 'batch';
    }

    // ioredis
    return 'pipeline';
  }

  /**
   * @name quit
   * @summary this is a function to call the quit function either in node_redis or ioredis
   * @param {object} redisDB - take the redisDB instance
   * @return {string} return the function name for making batch commands in each package
   */
  static quitOrQuit(redisDB) {
    if (redisDB.quitAsync) {
      return redisDB.quitAsync();
    }

    return redisDB.quit();
  }
}

module.exports = Utils;
