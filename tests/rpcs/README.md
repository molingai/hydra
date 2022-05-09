结果:

RPC5(TCP) 0.3s > 
RPC2(redis pubsub) 0.7s > 
RPC1(redis pubsub duplicate) 4.2s > 
RPC3(redis lpush brpop) 5s > 
RPC4(HTTP) 6.4s

RPC1 和 RPC3 总是 duplicate 导致性能下降

还是用pub sub的性能好
