import { EventEmitter } from 'events';

export interface Message {
  /**
   * from
   */
  frm?: string

  to: string

  /**
   * body
   */
  bdy: any

  /**
   * message id
   */
  mid?: string

  /**
   * reply message id
   */
  rmid?: string

  /**
   * version
   */
  ver?: string //

  /**
   * timestamp
   */
  ts?: number //

  /**
   * headers
   */
  hdr?: string

  /**
   * type
   */
  typ?: string

  /**
   * timeout
   */
  tmo?: number
  fwd?: string

  via?: string

  /**
   * authorization
   */
  aut?: string
}

// {"to":"f42089cc42374806b2d1db2b0b215353@service1:/","frm":"service2:/","mid":"332c1b99-0a3d-4c99-b414-1f1f031d49de","rmid":"0a6729c9-9337-448d-9c33-37cec96ee579","ts":"2022-04-27T09:40:53.488Z","ver":"UMF/1.4.6","bdy":{"name":"i got it"}}
export interface MessageReceive {
  /**
   * from
   */
  frm?: string

  to: string

  /**
   * body
   */
  bdy: any

  /**
   * message id
   */
  mid: string

  /**
   * version
   */
  ver: string

  /**
   * timestamp
   */
  ts: number

  /**
   * reply message id
   */
  rmid?: string

  /**
   * headers
   */
  hdr?: string

  /**
   * type
   */
  typ?: string

  /**
   * forward
   */
  fwd?: string
  via?: string
  aut?: string
}

export type CallReply = {
  rawMsg: MessageReceive,
  [name: string]: any
}

interface IUMFHash {
  [name: string]: any
};
export class UMFMessage extends Message {
  public message: IUMFHash = {};
  getTimeStamp(): number
  createMessageID(): string
  createShortMessageID(): string
  toJSON(): any
  toShort(): any
}

export type ServiceRet = {
  serviceName: string // this.serviceName,
  serviceIP: string // this.config.serviceIP,
  servicePort: number // this.config.servicePort
}

export type Service = {
  serviceName: string,

  /**
   * '2022-04-27T10:15:41.541Z'
   */
  registeredOn: String

  /**
   *  from config.serviceType
   */
  type?: string,
}

export type Presence = {
  serviceName: string // 'service1',
  serviceDescription: string // 'not specified',
  version: string // 'unspecified',
  instanceID: string // '969a944f04814c83ac78e1cf16516698',

  /**
   * '2022-04-27T10:20:25.289Z',
   */
  updatedOn: string // '2022-04-27T10:20:25.289Z',

  ip: string // '192.168.1.4',
  port: number // 48150,

  processID: number // 27723,

  /**
   * 'lifedeMacBook-Pro.local',
   */
  hostName: string

  /**
   * 1651054825289
   */
  updatedOnTS: number // 1651054825289
}

type String2Func = {
  [key: string]: Function
}

export class Hydra extends EventEmitter {
  /**
   * @name init
   * @summary Initialize Hydra with config object.
   * @param {object} config - configuration object containing hydra specific keys/values
   * @return {object} promise - resolving if init success or rejecting otherwise
   */
  init(config: any, testMode?: string): Promise<any> // any 是最终的config

  // on(eventName: string, cb: (msg: any) => void)
  on(event: string | symbol, listener: (msg: MessageReceive) => void): this;

  /**
   * @name createUMFMessage
   * @summary Create a UMF style message.
   * @description This is a helper function which helps format a UMF style message.
   *              The caller is responsible for ensuring that required fields such as
   *              "to", "from" and "body" are provided either before or after using
   *              this function.
   * @param {object} message - optional message overrides.
   * @return {object} message - a UMF formatted message.
   */
  createUMFMessage(message: Message): UMFMessage

  /**
   * @name sendMessage
   * @summary Sends a message to all present instances of a  hydra service.
   * @param {string | object} message - Plain string or UMF formatted message object
   * @return {promise} promise - resolved promise if sent or
   *                   error in rejected promise.
   */
  sendMessage(message: UMFMessage): Promise<void>
  sendBroadcastMessage(message: UMFMessage): Promise<void>

  /**
   * @name sendReplyMessage
   * @summary Sends a reply message based on the original message received.
   * @param {object} originalMessage - UMF formatted message object
   * @param {object} messageResponse - UMF formatted message object
   * @return {object} promise - resolved promise if sent or
   *                   error in rejected promise.
   */
  sendReplyMessage(originalMessage: Message, messageResponse: UMFMessage): Promise<void>

  /**
   * @name ready
   * @summary returns promise that resolves when initialization is complete
   * @return {object} promise - resolving if init success or rejecting otherwise
   */
  ready(): Promise<void>

  /**
   * @name _shutdown
   * @summary Shutdown hydra safely.
   */
  shutdown(): Promise

  /**
   * @name registerService
   * @summary Registers this machine as a Hydra instance.
   * @description This is an optional call as this module might just be used to monitor and query instances.
   * @return {object} promise - resolving if registration success or rejecting otherwise
   */
  registerService(): Promise<ServiceRet>

  /**
   * @name getServiceName
   * @summary Retrieves the service name of the current instance.
   * @throws Throws an error if this machine isn't a instance.
   * @return {string} serviceName - returns the service name.
   */
  getServiceName(): string

  /**
   * @name getServiceNodes
   * @summary Retrieve a list of services even if inactive.
   * @return {promise} promise - returns a promise
   */
  getServiceNodes(): Promise<any>

  /**
   * @name getServices
   * @summary Retrieve a list of available instance services.
   * @return {promise} promise - returns a promise which resolves to an array of objects.
   */
  getServices(): Promise<Service[] | null>

  /**
   * @name findService
   * @summary Find a service.
   * @param {string} name - service name - note service name is case insensitive
   * @return {promise} promise - which resolves with service
   */
  findService(name: string): Promise<Service>

  /**
   * @name getServicePresence
   * @summary Retrieve a service / instance's presence info.
   * @param {string} name - service name - note service name is case insensitive
   * @return {promise} promise - which resolves with service presence
   */
  getServicePresence(name: string): Promise<Presence[] | null>

  /**
   * @name hasServicePresence
   * @summary Indicate if a service has presence.
   * @description Indicates if a service has presence, meaning the
   *              service is running in at least one node.
   * @param {string} name - service name - note service name is case insensitive
   * @return {promise} promise - which resolves with TRUE if presence is found, FALSE otherwise
   */
  hasServicePresence(name): Promise<boolean>

  /**
   * @name getInstanceID
   * @summary Return the instance id for this process
   * @return {number} id - instanceID
   */
  getInstanceID(): string

  getInstanceVersion(): string

  // proxy
  proxyMessage(listener: (method: string, bdy: any, msg: MessageReceive) => void): this;
  /*
  请求, 返回回复
  {
  "name":"i got it",
  rawMsg: {
    "to":"3a5c26ac01b2441b942c224655cd7aef@service1:/",
    "frm":"service2:/",
    "mid":"l9rm17wuxv",
    "rmid":"0a076c72-0f63-420f-bfac-352c709c3346",
    "ts":"2022-03-03T02:57:54.492Z",
    "ver":"UMF/1.4.6",
  }
  */
  call (method: string, bdy: any, toServiceName: string, toInstanceId?: string): Promise<CallReply>
  reply (bdy: any, preMsg: Message): Promise<void>
  send (method: string, bdy: any, toServiceName: string, toInstanceId?: string): Promise<UMFMessage>

  // RPC

  /**
   * 调用方法
   * @param methodName [instanceId@]serviceName.functionName 如 service1.ping, instanceId@service1.ping
   * @param args
   */
  rpcCall(methodName: string, ...args: any[]): Promise<any>

  /**
   * 添加多个
   * @param obj
   */
  rpcMethods(obj: String2Func): Hydra

  /**
   * 添加方法
   * @param name
   * @param func
   */
  rpcMethod(name: string, func: Function): Hydra
}

let hydra: Hydra
export default hydra
