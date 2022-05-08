const {Hydra} = require('../../index');
const Utils = require('../../lib/utils');

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

async function registerServiceBlue() {
  const blue = await registerService('blue', false);
  blue.rpcMethods({
    async ping(name) {
      await Utils.sleep(SECOND * 1);
      return 'pong' + name;
    },
    async log(name) {
        console.log('log', name)
        return 1
    },
    async longFunc(name) {
      await Hydra.getUtilsHelper().sleep(SECOND * 6);
      return 'pong' + name;
    }
  });
  return blue;
}
async function test() {
  const client = await registerService('client', true);

  const blue = await registerServiceBlue();
  const blue2 = await registerServiceBlue();

  console.log('-', await client.rpcCall('blue.ping', 'life'));
  // console.log('-', await client.rpcCall('blue.getServiceName'));
  console.log('getInstanceID-', await client.rpcCall('blue.getInstanceID'));
  console.log('getInstanceID-', await client.rpcCall('blue.getInstanceID'));
  console.log('getInstanceID-', await client.rpcCall('blue.getInstanceID'));
  console.log('getInstanceID-', await client.rpcCall('blue.getInstanceID'));

  console.log('no need ret', await client.rpcSend('blue.getInstanceID'))
  console.log('no need ret', await client.rpcSend('blue.log', 'me'))

  let to = await client.rpcCall('blue.getInstanceID');
  console.log('getInstanceID-------', to, await client.rpcCall(to + '@blue.getInstanceID'));

   try {
      await client.rpcCall(`blue.longFunc`)
  } catch(err) {
      console.log('-------', err)
      // expect(err).to.not.be.null;
  }

  await client.shutdown();
  await blue.shutdown();
  await blue2.shutdown();
}

test();
