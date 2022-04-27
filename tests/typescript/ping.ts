import Hydra from 'hydra'

const hydra = new Hydra()
const config = {
  hydra: {
    serviceName: 'ping',
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
  
  hydra.proxyMessage((method: string, bdy: any, msg) => {
    console.log('proxyMessage', method, bdy, msg)
  })

  let { username, rawMsg } = await hydra.call('ping', { username: 'life' }, 'pong')
  /*
  {
    username: 'i am pong',
    rawMsg: {
      to: '68889b484bd74d81ac0b18666a8b1b27@ping:/',
      frm: 'pong:/',
      mid: '40bb62bf-a443-4213-aee6-f45a94958a9f',
      rmid: '441777e9-2e01-4ecc-b426-fe54b6882c7d',
      ts: '2022-04-27T12:20:00.826Z',
      typ: 'ping',
      ver: 'UMF/1.4.6'
      bdy: { username: 'life' }
    }
  }
  */
  console.log('ping ret', username, rawMsg)
})

export {};