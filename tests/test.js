const Hydra = require('../index.js');
let hydra = new Hydra();

const config = {
  'hydra': {
    'serviceName': 'test-service',
    'serviceDescription': 'Raison d\'etre',
    'serviceIP': '127.0.0.1',
    'servicePort': 5000,
    'serviceType': 'test',
    'redis': {
      'url': 'localhost',
      'port': 6379,
      'db': 1 // for test
    }
  }
};
hydra.init(config).then(() => {
  console.log('ok');
  hydra.registerService().then((_serviceInfo) => {
    console.log(_serviceInfo);
    hydra.shutdown();
  });
});
