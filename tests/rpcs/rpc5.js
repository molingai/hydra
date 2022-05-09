let net = require('net')
let PORT = 3001
let HOST = '0.0.0.0'

/**
 * 1. 创建一个TCP服务器实例，调用listen函数开始监听指定端口；
 * 2. 传入net.createServer()的回调函数，作为connection事件的处理函数；
 * 3. 在每个connection事件中，该回调函数接收到的socket对象是唯一的；
 * 4. 该连接自动关联一个socket对象
 * */
let server = net.createServer((socket) => {
    console.log('收到连接 connection: ' + socket.remoteAddress, socket.remotePort)

    // 为这个socket实例添加一个“data”事件处理函数
    socket.on('data', (data) => {
        // console.log('收到数据: ' + socket.remoteAddress + ":" + data);
        socket.write('pong' + data) // 向客户端回发该数据
    })

    socket.on('end', () => {
        console.log('客户端关闭')
    })

    // 客户端关闭事件
    socket.on('close', () => {
        console.log('CLOSED: ' + socket.remoteAddress + ' ' + socket.remotePort);
    })

    // socket.setTimeout(3000) // 设置客户端超时时间，如果客户端一直不输入，超过这个时间，就认为超时了
    // socket.on('timeout', () => {
    //     console.log('超时了')
    //     socket.end(''); // 半关闭 socket。例如，它发送一个 FIN 包。可能服务器仍在发送数据
    // })
})

server.listen(PORT, HOST, () => {
    console.log('服务端的地址是：', server.address())
})

server.on('error', (err) => {
    console.log('error', err)
})

server.on('close', () => {
    //关闭服务器，停止接收新的客户端的请求
    console.log('close事件：服务端关闭');
})

server.on('error', (error) => {
    console.log('error事件：服务端异常：' + error.message);
})