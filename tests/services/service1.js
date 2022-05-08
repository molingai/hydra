const {Hydra} = require('../../index');
const hydra = new Hydra();
const config = {
  hydra: {
    serviceName: 'service1',
    redis: {
      host: '127.0.0.1',
      port: 6379,
      db: 15
    }
  }
};

hydra.init(config).then(async() => {
  let ret = await hydra.registerService();
  /*
    {
      serviceName: 'service_1',
      serviceIP: '192.168.1.75',
      servicePort: 46738
    }
  */
  console.log('registerService success', ret);
  console.log('hydra.getInstanceID()', hydra.getInstanceID());
  hydra.on('message', function(msg) {
    // sometimes lost service2's reply message
    console.log(`Received object message: ${msg.mid}: ${JSON.stringify(msg)}`);
  });
  // 使用 sendMessage 时，会将消息发送到随机选择的可用服务实例
  let message1 = hydra.createUMFMessage({
    to: 'service2:/',
    from: hydra.getInstanceID() + '@service1:/',
    body: {
      name: 'hello ' + new Date()
    }
  });
  console.log('send msg', message1);
  hydra.sendMessage(message1).catch((e) => {
    console.error(e);
  });
});

const config2 = {
  hydra: {
    serviceName: 'service1-1',
    redis: {
      host: '127.0.0.1',
      port: 6379,
      db: 15
    }
  }
};
const hydra2 = new Hydra();
hydra2.init(config2).then(async() => {
  let ret = await hydra2.registerService();
  /*
    {
      serviceName: 'service_1',
      serviceIP: '192.168.1.75',
      servicePort: 46738
    }
  */
  console.log('registerService success', ret);
  console.log('hydra.getInstanceID()', hydra2.getInstanceID());
  hydra2.on('message', function(msg) {
    // sometimes lost service2's reply message
    console.log(`Received object message: ${msg.mid}: ${JSON.stringify(msg)}`);
  });
  // 使用 sendMessage 时，会将消息发送到随机选择的可用服务实例
  let message1 = hydra2.createUMFMessage({
    to: 'service2:/',
    from: hydra2.getInstanceID() + '@service1-1:/',
    body: {
      name: 'hello ' + new Date()
    }
  });
  console.log('send msg', message1);
  hydra2.sendMessage(message1).catch((e) => {
    console.error(e);
  });
});
