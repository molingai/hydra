const Hydra = require('../../index');

const config = {
  hydra: {
    serviceName: 'blue-service',
    serviceDescription: 'Blue test service',
    serviceIP: '',
    servicePort: 0,
    serviceType: 'test',
    redis: {
      url: '127.0.0.1',
      port: 6379,
      db: 1
    }
  }
};

let count = 0;

const hydra =  new Hydra()
hydra.init(config)
  .then(() => {
    hydra.registerService()
      .then((serviceInfo) => {
        console.log(`Running ${serviceInfo.serviceName} at ${serviceInfo.serviceIP}:${serviceInfo.servicePort}`);
        hydra.on('message', (msg) => {
          console.log(`Received object message: ${msg.mid}: ${JSON.stringify(msg)}`);
        });
        setInterval(() => {
          hydra.sendMessage(hydra.createUMFMessage({
            to: 'red-service:/',
            from: 'blue-service:/',
            body: {
              count
            }
          }));
          count += 1;
        }, 2000);
      });
  });
