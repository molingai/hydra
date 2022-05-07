const Hydra = require('../index.js');

const redisPort = 6379;
const redisUrl = '127.0.0.1';
const SECOND = 1000;

/**
 * @name getConfig
 * @summary Get a new copy of a config object
 * @return {undefined}
 */
function getConfig(serviceName) {
  return Object.assign({}, {
    'hydra': {
      serviceName,
      serviceIP: '',
      redis: {
        'url': redisUrl,
        'port': redisPort,
        'db': 1 // for test
      }
    },
  });
}

async function registerService(serviceName, flushdb) {
  const hydra = new Hydra();
  await hydra.init(getConfig(serviceName));
  flushdb && await hydra.redisdb.flushdb();
  await hydra.registerService();
  return hydra;
}

/**
 * @name Index Tests
 * @summary Hydra Main Test Suite
 */
describe('Hydra Message', function() {
  this.timeout(SECOND * 30);

  beforeEach(() => {});
  afterEach((done) => {
    done();
  });

  /**
   * @description Confirms that hydra can connect to a redis instance
   */
  it('message receive blue->red->blue blue->red->blue', async() => {
    let blue = await registerService('blue-service', true);
    let red = await registerService('red-service', false);
    expect(blue.getServiceName()).to.equal('blue-service');
    expect(red.getServiceName()).to.equal('red-service');

    let msg = {
      to: 'red-service:/',
      from: 'blue-service:/',
      body: {
        count: Math.random() + ''
      }
    };
    let replyMsg = {
      body: {
        name: 'i got it' + Math.random()
      }
    };
    let message1;
    let i = 0;
    await new Promise((resolve) => {
      red.on('message', (message) => {
        // {"to":"red-service:/","frm":"blue-service:/","mid":"1ebc2fd1-6fa9-4249-9ad5-1d1519ca0bfd","ts":"2022-05-06T14:02:09.913Z","ver":"UMF/1.4.6","bdy":{"count":"0.07971331647676316"}}
        console.log(`Red Received object message: ${message.mid}: ${JSON.stringify(message)}`);
        expect(message.bdy.count).to.equal(msg.body.count);
        expect(message.frm).to.equal(msg.from);
        expect(message.to).to.equal(msg.to);

        message1 = message;

        // 回消息
        replyMsg.body.name = 'i got it' + Math.random();
        red.sendReplyMessage(message, red.createUMFMessage(replyMsg));
      });

      blue.on('message', (message) => {
        // {"to":"blue-service:/","frm":"red-service:/","mid":"0ac353b2-4873-4885-9650-56dcae7cb080","rmid":"1ebc2fd1-6fa9-4249-9ad5-1d1519ca0bfd","ts":"2022-05-06T14:02:09.916Z","ver":"UMF/1.4.6","bdy":{"name":"i got it"}}
        console.log(`Blue Received object message: ${message.mid}: ${JSON.stringify(message)}`);
        console.log('');
        expect(message.bdy.name).to.equal(replyMsg.body.name);
        expect(message.frm).to.equal(msg.to);
        expect(message.to).to.equal(msg.from);
        // message.rmid == message1.mid
        expect(message.rmid).to.equal(message1.mid);

        i++;
        if (i > 1) {
          resolve();
        }
      });

      msg.body.count = Math.random() + '';
      blue.sendMessage(blue.createUMFMessage(msg));
      // 2s后再发一次
      setTimeout(() => {
        msg.body.count = Math.random() + '';
        blue.sendMessage(blue.createUMFMessage(msg));
      }, 2000);
    });
    await blue.shutdown();
    await red.shutdown();
  });


  it('message proxy blue->red blue->red red->blue', async() => {
    let blue = await registerService('blue-service', true);
    let red = await registerService('red-service', false);
    expect(blue.getServiceName()).to.equal('blue-service');
    expect(red.getServiceName()).to.equal('red-service');

    blue.proxyMessage((typ, bdy, msg) => {
      console.log('Blue got message', msg);

      expect(typ).to.equal('random');
      expect(bdy.name).to.equal('i am wrong');

      // 回复一个
      blue.reply({ok: 1, data: {typ, name: 'blue'}}, msg);
    });
    red.proxyMessage(async(typ, bdy, msg) => {
      console.log('Red got message', msg);
      if (typ === 'ping') {
        red.reply({ok: 1, data: {date: '2012-12-12', name: bdy.name}}, msg);
      } else if (typ === 'getName') {
        red.reply({ok: 1, data: {name: 'red'}}, msg);
      } else {
        // 不是以回复的形式发送
        console.log('No method to process', typ);
        let {data} = await red.call('random', {name: 'i am wrong'}, 'blue-service');
        expect(data.name).to.equal('blue');
      }
    });

    // 发送1
    let {ok, data} = await blue.call('ping', {name: 'blue'}, 'red-service');
    expect(ok).to.equal(1);
    expect(data.date).to.equal('2012-12-12');
    expect(data.name).to.equal('blue');

    // 发送2
    let {ok: ok2, data: data2} = await blue.call('getName', {name: 'blue'}, 'red-service');
    expect(ok2).to.equal(1);
    expect(data2.name).to.equal('red');

    // 发送3 timeout
    try {
      await blue.call('randomMethod', { }, 'red-service');
    } catch (e) {
      expect(e.message).to.equal('timeout');
    }

    await blue.shutdown();
    await red.shutdown();
  });
});
