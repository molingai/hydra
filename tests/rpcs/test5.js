let net = require('net')

var client = new net.Socket()
let PORT = 3001
let HOST = 'localhost'

client.connect(PORT, HOST, () => {
  console.log('connect to ' + HOST + ':' + PORT)
  // client.write('I am happyGloria.') // 建立连接后立即向服务器发送数据，服务器将收到这些数据

  // setInterval(() => {
  //     client.write('I am happyGloria.') // 建立连接后立即向服务器发送数据，服务器将收到这些数据
  // }, 2000)
})

let _resolve
client.on('data', (data) => {
  // console.log('DATA: ' + data)
  _resolve(data + '')
})

client.on('close', function() {
  console.log('Connection closed')
})

function request(i) {
  client.write(i + '')
  return new Promise((resolve) => {
    _resolve = resolve
  })
}

async function test() {
  const s = Date.now();
  for (let i = 0; i < 3000; ++i) {
    let ret = await request(i)
    // console.log(ret)
  }
  const e = Date.now();
  console.log((e - s) / 1000);
}

test()
