import Hydra from 'hydra'

const hydra = new Hydra()
const config = {
  hydra: {
    serviceName: 'pong',
    redis: {
      host: '127.0.0.1',
      port: 6379,
      db: 15
    },
    timeout: 5000
  }
}

hydra.init(config).then(async () => {
  let ret = await hydra.registerService()
  console.log('registerService success', ret)
  
  hydra.proxyMessage(async (method: string, bdy: any, msg) => {
    console.log('proxyMessage', method, bdy, msg)
     /*
    msg =
    to: 'pong:/',
    frm: '220f07ddca7e4564a4a7406584be7703@ping:/',
    mid: '84f6bdf9-0cd7-402e-997b-ff9c7c82fa0e',
    ts: '2022-04-27T12:16:01.373Z',
    typ: 'ping',
    ver: 'UMF/1.4.6',
    bdy: {}
    */
    if (method === 'ping') {
      await hydra.reply({ username: 'i am pong' }, msg)
    }
  })

  // let pingRet = await hydra.call('ping', {}, 'pong')
  // console.log('ping ret', pingRet)
})

export {};