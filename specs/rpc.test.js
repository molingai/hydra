/* eslint no-invalid-this: 0 */
/* eslint semi: ["error", "always"] */

const {Hydra} = require('../index.js');

const redisPort = 6379;
const redisUrl = '127.0.0.1';
const SECOND = 1000;

/**
 * @name getConfig
 * @summary Get a new copy of a config object
 * @param {string} serviceName -
 * @return {object} -
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

/**
 * @name registerService
 * @param {string} serviceName -
 * @param {boolean} flushdb -
 * @return {object} -
 */
async function registerService(serviceName, flushdb) {
  const hydra = new Hydra();
  await hydra.init(getConfig(serviceName));
  flushdb && await hydra.redisdb.flushdb();
  await hydra.registerService();
  return hydra;
}

/**
 * @name registerServiceBlue
 * @return {object} -
 */
async function registerServiceBlue() {
  const blue = await registerService('blue', false);
  blue.rpcMethods({
    async ping(name) {
      await Hydra.getUtilsHelper().sleep(SECOND * 1);
      return 'pong' + name;
    },
    async longFunc(name) {
      await Hydra.getUtilsHelper().sleep(SECOND * 6);
      return 'pong' + name;
    }
  });
  return blue;
}

/**
 * @name Index Tests
 * @summary Hydra Main Test Suite
 */
describe('Hydra Message', function() {
  this.timeout(SECOND * 60);

  beforeEach(() => {});
  afterEach((done) => {
    done();
  });

  /**
   * @description Confirms that hydra can connect to a redis instance
   */
  it('rpc call', async() => {
    const client = await registerService('client', true);
    const blue = await registerServiceBlue();

    expect(await client.rpcCall('blue.ping', 'life')).to.equal('ponglife');

    const instanceID = blue.getInstanceID();
    expect(await client.rpcCall(`${instanceID}@blue.getInstanceID`)).to.equal(instanceID);

    try {
      await client.rpcCall(`${instanceID}@blue.noMethod`);
    } catch (err) {
      expect(err).to.not.be.null;
    }

    try {
      await client.rpcCall('blue.noMethod2');
    } catch (err) {
      console.log(err);
      expect(err).to.not.be.null;
    }

    try {
      await client.rpcCall('blue.longFunc');
    } catch (err) {
      console.log(err);
      // expect(err).to.not.be.null;
    }

    // 让超时的publish处理掉, 不然下面shutdown了导致publish报错
    await Hydra.getUtilsHelper().sleep(SECOND * 2);

    await client.shutdown();
    await blue.shutdown();
  });

  it('rpc call multi blue', async() => {
    const client = await registerService('client', true);
    const blue = await registerServiceBlue();
    const blue2 = await registerServiceBlue();
    expect(await client.rpcCall('blue.ping', 'life')).to.equal('ponglife');
    expect(await client.rpcCall('blue.ping', 'life')).to.equal('ponglife');
    expect(await client.rpcCall('blue.ping', 'life')).to.equal('ponglife');

    const instanceID = blue.getInstanceID();
    const instanceID2 = blue.getInstanceID();
    expect(await client.rpcCall(`${instanceID}@blue.getInstanceID`)).to.equal(instanceID);
    expect(await client.rpcCall(`${instanceID2}@blue.getInstanceID`)).to.equal(instanceID2);

    await client.shutdown();
    await blue.shutdown();
    await blue2.shutdown();
  });
});
