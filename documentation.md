![](hydra.png)

# Hydra documentation

Our Hydra documentation has been moved to https://www.hydramicroservice.com/

# Hydra plugins

See the [Plugin documentation](/plugins.md).

# keys

${redisPreKey} === hydra:service

```
2) "hydra:service:blue-service:service"

3) "hydra:service:nodes"

5) "hydra:service:blue-service:1c1d2f8390644ef1b342922014f5910c:presence"

6) "hydra:service:blue-service:1c1d2f8390644ef1b342922014f5910c:health"

4) "hydra:service:blue-service:5b1cc3a22cec47ce9bb26b8755f2ba80:health:log"
1) "hydra:service:blue-service:1c1d2f8390644ef1b342922014f5910c:health:log"
```

## service

一个service一条记录

key:
${redisPreKey}:${serviceName}:service

value: (string)
```
{
    serviceName,
    type: this.config.serviceType,
    registeredOn: this._getTimeStamp()
}
```

## service node

1 service : n service node
1 service : n service instance

1 node(instance) : 1 presence : 1 health : 1 health log(里面有多条日志[])


一个服务可以有多个节点

key:
${redisPreKey}:nodes

value: (map)
{
    instanceId: {
        hostName: "lifedeMacBook-Pro.local"
        instanceID: "1c1d2f8390644ef1b342922014f5910c"
        ip: "192.168.1.4"
        port: 51285
        processID: 8813
        serviceDescription: "Blue test service"
        serviceName: "blue-service"
        updatedOn: "2022-05-07T01:22:19.549Z"
        version: "unspecified"
    }
}


## service presence

key:
${redisPreKey}:${this.serviceName}:${this.instanceID}:presence

value:
instanceID

如 key = hydra:service:blue-service:1c1d2f8390644ef1b342922014f5910c:presence
value = 1c1d2f8390644ef1b342922014f5910c

PRESENCE_UPDATE_INTERVAL 每1秒设置一次, 否则 KEY_EXPIRATION_TTL 3秒后过期会自动删除, 自动删除后不会删除node, 但这些node是没用的, 所以要定期执行命令清理下

所以presence只是表示存活, instance信息在 node里, getServicePresence() 先找 presence再通过instanceId找node

## health
存instance基本的内存信息, 每5秒更新一次, 值3秒过期. 所以有2秒是看不见这个key的 (为什么要这样设计?)

key:
${redisPreKey}:${this.serviceName}:${this.instanceID}:health

value:
```
{
    architecture: "x64"
    hostName: "lifedeMacBook-Pro.local"
    instanceID: "1c1d2f8390644ef1b342922014f5910c"
    memory: {rss: 35241984, heapTotal: 15233024, heapUsed: 14068408, external: 892536, arrayBuffers: 58640}
    nodeVersion: "v16.9.1"
    platform: "darwin"
    processID: 8813
    sampledOn: "2022-05-07T01:36:53.838Z"
    serviceName: "blue-service"
    updatedOn: "2022-05-07T01:36:53.838Z"
    uptimeSeconds: 965.600171146
}
```

## health log
key:
${redisPreKey}:${this.serviceName}:${this.instanceID}:health:log

value: (数组)

一个node(instance)有很多个health log, 一周过期, 记录一些错误日志信息

`this._logMessage('error', msg);`一调用就会插入一条

```
LRANGE hydra:service:blue-service:5b1cc3a22cec47ce9bb26b8755f2ba80:health:log 0 -1
[
    {"ts":"2022-05-07T01:19:14.403Z","serviceName":"blue-service","type":"error","processID":8808,"msg":"Unavailable red-service instances"}"
]
```

## shutdown后, 有什么key还会存在?

* service会存在
* node中[instanceId]还会存在
* presence 会立即删除(即使异常没有shutdown, 也会3秒后过期)
* health 3秒后过期
* health log 一周后过期

# subscribes

## mcMessageChannelClient
对service下的所有instance发消息
${mcMessageKey}:${serviceName}

## mcDirectMessageChannelClient
对某个instance发消息
${mcMessageKey}:${serviceName}:${this.instanceID}

# route

```
let message = hydra.createUMFMessage({
  to: 'hello:[get]/api/getName',
  from: 'website:backend',
  body: {
    to: 'user@someplace.com',
    from: 'marketing@company.com',
    emailBody: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium'
    fallbackToQueue: true
  }
});
hydra.makeAPIRequest(message)
```
通过presence获取到 http://ip:port 后, 调用 http GET http://ip:port/api/getName

Express-Hydra会registerRoutes, 这些routes有什么用? makeAPIRequest 又不会去检查这些routes
```
$ hydra-cli routes
{
  "hello": [
    "[get]/",
    "[GET]/_config/hello"
  ]
}
```

# Hydra-Router有什么用? 

1. 监听http
2. 通过获取hydra内所有注册的routes, 自己绑定这些routes
3. web请求过route, 得到serverName, 再去调用相应的server(通过makeAPIRequest), 返回给web

所以 Hydra-Router就是一个入口, 作路由分发

Hydra-router 甚至将接受 WebSocket 消息并将其路由到其相应的服务。

