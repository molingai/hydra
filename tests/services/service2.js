const Hydra = require('../../index')
const hydra = new Hydra()
const config = {
  hydra: {
    serviceName: 'service2',
    redis: {
      host: '127.0.0.1',
      port: 6379,
      db: 15
    }
  }
}

hydra.init(config).then(async () => {
  let ret = await hydra.registerService()
  /*
    {
      serviceName: 'service_1',
      serviceIP: '192.168.1.75',
      servicePort: 46738
    }
  */
  console.log('registerService success', ret)
  
  hydra.on('message', function(msg) {
    // sometimes lost service2's reply message
    console.log(`Received object message: ${msg.mid}: ${JSON.stringify(msg)}`);
    // to send a reply message here or elsewhere in your service use the `sendReplyMessage` call.
    hydra.sendReplyMessage(msg, hydra.createUMFMessage({
      body: {
        name: 'i got it'
      }
    })).then(() => {
      console.log('reply ok')
    })
    let message1 = hydra.createUMFMessage({
      to: msg.frm, // 'service_1:/',
      from: 'service2:/',
      body: {
        name: 'hello2 ' + new Date()
      }
    });
    hydra.sendMessage(message1).catch((e) => {
      console.error(e)
    })
  })

})
