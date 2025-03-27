'use strict';

const __requestFn__ = Symbol('__requestFn__');
const __propertyFn__ = Symbol('__propertyFn__');
const __handlerInit__ = Symbol('__handlerInit__');
const __controllerInit__ = Symbol('__controllerInit__');

/** HTTP请求枚举 */
const HTTP_METHOD_ENUM = [ 'get', 'post', 'delete', 'put', 'patch' ];
const BASE_CONTROLLER_ROUTERS = [];

/** 
 * 程序启动时查找引入RouterDecorator类的Controller文件
 * 找到文件中调用RouterDecorator类的函数reouter[get/post/delete/put/patch], 执行 (即将数据组装后推入 __router__ 中)
 * 找到文件中调用RouterDecorator类的函数[permission/prefix/noAuth/resubmit/transactional], 执行 (即将数据组装后推入 __permission__, __prefix__, __noAuth__, __resubmit__, __transactional__ 中)
 * 初始化路由, 将HTTP请求路由组装路由数据后, 挂载到app.router中
*/
class RouterDecorator {
  constructor() {
  }

  /**
   * 路由HTTP请求函数 ([get/post/delete/put/patch]的公共方法)
   * @param {string} target 执行类
   * @param {string} handler 执行的方法名称
   * @param {string} method 请求方式
   * @param {string} url 请求路径
   * @param {string} summary 名称
   * @param {string} desc 描述
   * @param {...Middleware[]} middlewares 中间键
   */
  router(method, url, summary = '', desc = '', ...middlewares) {
    return (target, handler) => this[__requestFn__](target, handler, method, url, summary, desc, ...middlewares);
  }

  [__requestFn__](target, handler, method, url = '', summary = '', desc, ...middlewares) {
    if (!HTTP_METHOD_ENUM.includes(method)) {
      throw new Error(`The method value must be within ${HTTP_METHOD_ENUM.join(',')}.`);
    }
    const routerOption = {
      method,
      url,
      summary: summary || '',
      desc: desc || '',
      middlewares,
      constructorFn: target.constructor,
      controller: target.constructor.name,
      permission: '',
      handler,
    };
    if (target.constructor.name === 'BaseController') {
      BASE_CONTROLLER_ROUTERS.push(routerOption);
      return;
    }
    const exist = RouterDecorator.__router__.find(p => p.controller === routerOption.controller && p.handler === routerOption.handler);
    if (exist) {
      throw new Error(`There are already multiple router function in ${routerOption.controller} ${routerOption.handler}.`);
    }

    /** 推入路由配置 */
    RouterDecorator.__router__.push(routerOption);
  }

  [__propertyFn__](propKey, propObj) {
    return (target, handler) => {
      let controller = target.constructor.name;
      if (typeof target === 'function') {
        controller = target.name;
      }
      const valKey = `${controller}${handler ? '.' : ''}${handler || ''}`;
      if (propKey !== '__request__' && propKey !== '__response__') {
        Object.assign(RouterDecorator[propKey], { [valKey]: propObj });
        return;
      }
      RouterDecorator[propKey][valKey] = RouterDecorator[propKey][valKey] ?? [];
      RouterDecorator[propKey][valKey].push(propObj);
    }
  }

  /**
   * 是否不启用函数
   * @param {boolean} deprecated 是否不启用
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  deprecated(deprecated = true) {
    return this[__propertyFn__]('__deprecated__', deprecated);
  }

  /**
   * Swagger是否忽略
   * @param {boolean} ignore 是否忽略
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  ignore(ignore = true) {
    return this[__propertyFn__]('__ignore__', ignore);
  }

  /**
   * Swagger鉴权方式
   * @param {string} security Swagger鉴权方式
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  security(security = '') {
    return this[__propertyFn__]('__security__', security);
  }

  /**
   * Swagger produce
   * @param {string} produce 用,隔开的字符串
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  produce(produce = '') {
    return this[__propertyFn__]('__produce__', produce);
  }

  /**
   * Swagger consume
   * @param {string} consume 用,隔开的字符串
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  consume(consume = '') {
    return this[__propertyFn__]('__consume__', consume);
  }

  /**
   * 路由权限函数
   * @param {string} permission 权限
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  permission(permission = '') {
    return this[__propertyFn__]('__permission__', permission);
  }

  /**
   * 路由鉴权函数
   * @param {boolean} noAuth 是否鉴权
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  noAuth(noAuth = true) {
    return this[__propertyFn__]('__noAuth__', noAuth);
  }

  /**
   * 路由重复提交函数
   * @param {number} second 允许N秒请求M次
   * @param {number} times 允许N秒请求M次
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  resubmit(second = 2, times = 1) {
    return this[__propertyFn__]('__resubmit__', (second === 0 || times === 0) ? '' : `${second},${times}`);
  }

  /**
   * 全局事务函数
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  transactional(transactional = true) {
    return this[__propertyFn__]('__transactional__', transactional);
  }

  /**
   * 请求参数Boby函数
   * @param {string} position 参数类型, body/query/path/headers
   * @param {string} type 类型, integer/string/boolean/number/User, array[string]/array[User]
   * @param {string} name 名称
   * @param {string} desc 描述
   * @param {boolean} required 必填
   * @param {boolean} prop 其他属性 'enum,default,trim,format,min,max'
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  request(position, type, name = '', desc = '', example = '', required = true, prop = {}) {
    if (!'body,query,path,headers'.split(',').includes(position)) {
      throw new Error(`The position of request parameter format error`);
    }
    if (!type) {
      throw new Error(`The type of request parameter does not exit`);
    }
    if (!(prop !== null && typeof prop === 'object')) {
      throw new Error(`The prop of request parameter format error`);
    }
    return this[__propertyFn__]('__request__', Object.assign({ position, type, name, desc, example, required }, prop));
  }

  /**
   * 响应参数函数
   * @param {string} type 类型, integer/string/boolean/number/User, array[string]/array[User]
   * @param {string} name 名称
   * @param {string} desc 描述
   * @param {boolean} required 必填
   * @param {boolean} prop 其他属性 'enum,default,trim,format,min,max'
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  response(type, name = '', desc = '', example = '', required = true, prop = {}) {
    if (!type) {
      throw new Error(`The type of response parameter does not exit`);
    }
    if (!(prop !== null && typeof prop === 'object')) {
      throw new Error(`The prop of response parameter format error`);
    }
    return this[__propertyFn__]('__response__', Object.assign({ position: 'response', type, name, desc, example, required }, prop));
  }

  /**
   * 装饰Controller class的工厂函数
   * 为一整个Controller添加prefix
   * 可以追加中间件
   * @param {string} prefix URL前缀
   * @param {string} summary 名称
   * @param {string} desc 描述
   * @param {string} group 分组
   * @param {[]} baseFn 配置通用的接口 可选 page、add、update、delete、info、list
   * @param {...Middleware[]} middlewares
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  prefix(prefix, summary = '', desc = '', group= '', baseFn = [], ...middlewares) {
    return function(target) {
      RouterDecorator.__prefix__[target.name] = {
        prefix,
        summary: summary || '',
        desc: desc || '',
        group: group || '',
        middlewares,
        baseFn,
        target,
      };
      return target;
    };
  }

  /** 找到所有HTTP请求方法路由, 组装路由数据后, 将其挂载到app.router中 */
  static [__handlerInit__](app, options, basePrefix, rt) {

    const r = { method: rt.method, controller: rt.controller, handler: rt.handler, handlerSummary: rt.summary, handlerDesc: rt.desc, };

    const prefixData = RouterDecorator.__prefix__[rt.controller] || basePrefix;
    // 全局路径+Controller配置路径+方法的设置路径
    r.url = `${options.prefix}${prefixData.prefix}${rt.url}`;
    r.controllerSummary = prefixData.summary || '';
    r.controllerDesc = prefixData.desc || '';
    r.controllerGroup = prefixData.group || '';
    // r.fullDesc = (prefixData.desc && rt.desc ? `${prefixData.desc}-` : prefixData.desc) + rt.desc;

    const handlerKey = `${rt.controller}${rt.handler ? '.' : ''}${rt.handler || ''}`;

    // 不启用
    const hDeprecated = RouterDecorator.__deprecated__.hasOwnProperty(handlerKey) ? RouterDecorator.__deprecated__[handlerKey] : null;
    const cDeprecated = RouterDecorator.__deprecated__.hasOwnProperty(rt.controller) ? RouterDecorator.__deprecated__[rt.controller] : null;
    r.deprecated = hDeprecated ? true : (typeof cDeprecated === 'boolean' && cDeprecated ? true : false);

    // Swagger忽略
    const hIgnore = RouterDecorator.__ignore__.hasOwnProperty(handlerKey) ? RouterDecorator.__ignore__[handlerKey] : null;
    const cIgnore = RouterDecorator.__ignore__.hasOwnProperty(rt.controller) ? RouterDecorator.__ignore__[rt.controller] : null;
    r.ignore = hIgnore ? true : (typeof cIgnore === 'boolean' && cIgnore ? true : false);

    // Swagger鉴权方式
    const hSecurity = RouterDecorator.__security__.hasOwnProperty(handlerKey) ? RouterDecorator.__security__[handlerKey] : null;
    const cSecurity = RouterDecorator.__security__.hasOwnProperty(rt.controller) ? RouterDecorator.__security__[rt.controller] : null;
    r.security = hSecurity ? `${cSecurity ? `${cSecurity}:` : ''}${hSecurity}` : '';

    // Swagger Produce
    const hProduce = RouterDecorator.__produce__.hasOwnProperty(handlerKey) ? RouterDecorator.__produce__[handlerKey] : null;
    const cProduce = RouterDecorator.__produce__.hasOwnProperty(rt.controller) ? RouterDecorator.__produce__[rt.controller] : null;
    r.produce = hProduce ? `${cProduce ? `${cProduce}:` : ''}${hProduce}` : '';

    // Swagger Consume
    const hConsume = RouterDecorator.__consume__.hasOwnProperty(handlerKey) ? RouterDecorator.__consume__[handlerKey] : null;
    const cConsume = RouterDecorator.__consume__.hasOwnProperty(rt.controller) ? RouterDecorator.__consume__[rt.controller] : null;
    r.consume = hConsume ? `${cConsume ? `${cConsume}:` : ''}${hConsume}` : '';

    // 权限
    const hPerm = RouterDecorator.__permission__.hasOwnProperty(handlerKey) ? RouterDecorator.__permission__[handlerKey] : null;
    const cPerm = RouterDecorator.__permission__.hasOwnProperty(rt.controller) ? RouterDecorator.__permission__[rt.controller] : null;
    r.permission = hPerm ? `${cPerm ? `${cPerm}:` : ''}${hPerm}` : '';

    // 无需鉴权
    const hAuth = RouterDecorator.__noAuth__.hasOwnProperty(handlerKey) ? RouterDecorator.__noAuth__[handlerKey] : null;
    const cAuth = RouterDecorator.__noAuth__.hasOwnProperty(rt.controller) ? RouterDecorator.__noAuth__[rt.controller] : null;
    r.noAuth = hAuth ? true : (typeof cAuth === 'boolean' && cAuth ? true : false);

    // 重复提交
    const hResubmit = RouterDecorator.__resubmit__.hasOwnProperty(handlerKey) ? RouterDecorator.__resubmit__[handlerKey] : null;
    const cResubmit = RouterDecorator.__resubmit__.hasOwnProperty(rt.controller) ? RouterDecorator.__resubmit__[rt.controller] : null;
    r.resubmit = hResubmit || cResubmit || '';
  
    // 全局事务
    const hTransactional = RouterDecorator.__transactional__.hasOwnProperty(handlerKey) ? RouterDecorator.__transactional__[handlerKey] : null;
    const cTransactional = RouterDecorator.__transactional__.hasOwnProperty(rt.controller) ? RouterDecorator.__transactional__[rt.controller] : null;
    r.transactional = hTransactional ? true : (typeof cTransactional === 'boolean' && cTransactional ? true : false);

    // 请求参数
    r.request = RouterDecorator.__request__.hasOwnProperty(handlerKey) ? RouterDecorator.__request__[handlerKey] : null;

    // 响应参数
    r.response = RouterDecorator.__response__.hasOwnProperty(handlerKey) ? RouterDecorator.__response__[handlerKey] : null;

    console.log(`controller handler register URL [ ${rt.method.toUpperCase()} ] ${r.url} , ${rt.controller}.${rt.handler} , ${r.permission} , ${r.controllerSummary} , ${r.handlerSummary}`);

    if (RouterDecorator.routers.filter(f => f.url === r.url).length === 0) {
      app.router[rt.method](r.url, ...prefixData.middlewares, ...rt.middlewares, async ctx => {
        const ist = new rt.constructorFn(ctx);
        await ist[rt.handler](ctx);
      });

      RouterDecorator.routers.push(r);
    }
  }

  /** 找到标注prefix且设置baseFn的Controller, 组装路由数据后, 将其挂载到app.router中 */
  static [__controllerInit__](app, options, basePrefix, cl) {
    const prefixData = RouterDecorator.__prefix__[cl] || basePrefix;

    const baseRouters = BASE_CONTROLLER_ROUTERS.filter(b => prefixData.baseFn.includes(b.url.replace('/', '')));

    baseRouters.forEach(t => {
      const r = { method: t.method, controller: cl, handler: t.handler, handlerSummary: t.summary, handlerDesc: t.desc, };

      // 全局路径+Controller配置路径+内置方法路径
      r.url = `${options.prefix}${prefixData.prefix}${t.url}`;
      r.controllerSummary = prefixData.summary || '';
      r.controllerDesc = prefixData.desc || '';
      r.controllerGroup = prefixData.group || '';

      // 找到Controller是否不启用
      const cDeprecated = RouterDecorator.__deprecated__.hasOwnProperty(t.controller) ? RouterDecorator.__deprecated__[t.controller] : null;
      r.deprecated = typeof cDeprecated === 'boolean' && cDeprecated ? true : false;

      // Swagger忽略
      const cIgnore = RouterDecorator.__ignore__.hasOwnProperty(t.controller) ? RouterDecorator.__ignore__[t.controller] : null;
      r.ignore = typeof cIgnore === 'boolean' && cIgnore ? true : false;

      // Swagger鉴权方式
      const cSecurity = RouterDecorator.__security__.hasOwnProperty(t.controller) ? RouterDecorator.__security__[t.controller] : null;
      r.security = cSecurity ? `${cSecurity}:${t.handler}` : '';

      // Swagger Produce
      const cProduce = RouterDecorator.__produce__.hasOwnProperty(t.controller) ? RouterDecorator.__produce__[t.controller] : null;
      r.produce = cProduce ? `${cProduce}:${t.handler}` : '';

      // Swagger Consume
      const cConsume = RouterDecorator.__consume__.hasOwnProperty(t.controller) ? RouterDecorator.__consume__[t.controller] : null;
      r.consume = cConsume ? `${cConsume}:${t.handler}` : '';

      // 找到Controller全局权限
      const cPerm = RouterDecorator.__permission__.hasOwnProperty(t.controller) ? RouterDecorator.__permission__[t.controller] : null;
      r.permission = cPerm ? `${cPerm}:${t.handler}` : '';

      // 找到Controller全局鉴权
      const cAuth = RouterDecorator.__noAuth__.hasOwnProperty(t.controller) ? RouterDecorator.__noAuth__[t.controller] : null;
      r.noAuth = typeof cAuth === 'boolean' && cAuth ? true : false;

      // 找到Controller全局重复提交
      const cResubmit = RouterDecorator.__resubmit__.hasOwnProperty(t.controller) ? RouterDecorator.__resubmit__[t.controller] : null;
      r.resubmit = cResubmit || '';

      // 找到Controller全局事务
      const cTransactional = RouterDecorator.__transactional__.hasOwnProperty(t.controller) ? RouterDecorator.__transactional__[t.controller] : null;
      r.transactional = typeof cTransactional === 'boolean' && cTransactional ? true : false;

      // 请求参数
      r.request = null;

      // 响应参数
      r.response = null;

      console.log(`controller register URL [ ${t.method.toUpperCase()} ] ${r.url} , ${cl}.${t.handler} , ${r.permission} , ${r.controllerSummary} , ${r.handlerSummary}`);

      app.router[t.method](r.url, ...prefixData.middlewares, ...t.middlewares, async ctx => {
        const ist = new prefixData.target(ctx);
        await ist[t.handler](ctx);
      });

      RouterDecorator.routers.push(r);
    });
  }

  /**
   * 注册路由
   * 路由信息是通过装饰器收集的
   * @export
   * @param {Application} app eggApp实例
   * @param {string} [options={ prefix: '' }] 举例： { prefix: '/api' }
   */
  static init(app, options = { prefix: '' }) {

    const basePrefix = {
      prefix: '',
      summary: '',
      desc: '',
      group: '',
      middlewares: [],
      baseFn: [],
      target: {},
    };

    /** 解析 Handler 路由 */
    RouterDecorator.__router__.forEach(rt => RouterDecorator[__handlerInit__](app, options, basePrefix, rt));

    /** 解析 Controller 通用路由 */
    Object.keys(RouterDecorator.__prefix__).forEach(cl => RouterDecorator[__controllerInit__](app, options, basePrefix, cl));
  }
}

/**
 * 记录各个Controller的prefix以及相关中间件
 * 最后统一设置
 * @private
 * @static
 * @type {Prefix}
 * @memberof RouterDecorator
 */
RouterDecorator.__prefix__ = {};

/**
 * 记录各个routerUrl的路由配置
 * 最后统一设置
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__router__ = [];

/**
 * 记录各个routerUrl Swagger是否不启用
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__deprecated__ = {};

/**
 * 记录各个routerUrl Swagger是否忽略
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__ignore__ = {};

/**
 * 记录各个routerUrl Swagger鉴权方式
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__security__ = {};

/**
 * 记录各个routerUrl Swagger produce
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__produce__ = {};

/**
 * 记录各个routerUrl Swagger consume
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__consume__ = {};

/**
 * 记录各个routerUrl的路由权限
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__permission__ = {};

/**
 * 记录各个routerUrl的路由鉴权
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__noAuth__ = {};

/**
 * 记录各个routerUrl的路由重复提交
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__resubmit__ = {};

/**
 * 记录各个routerUrl的全局事务, 但不支持微服务分布式事务
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__transactional__ = {};

/**
 * 记录各个routerUrl的请求参数, 分Body, Query, Path三种
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__request__ = {};

/**
 * 记录各个routerUrl的响应参数
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__response__ = {};

/**
 * 记录所有路由信息
 * @public
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.routers = [];


/** 暴露注册路由方法 */
exports.init = RouterDecorator.init;

/** 暴露路由信息 */
exports.routers = RouterDecorator.routers;

const routerInstance = new RouterDecorator();
exports.router = routerInstance.router.bind(routerInstance);
exports.prefix = routerInstance.prefix.bind(routerInstance);

exports.deprecated = routerInstance.deprecated.bind(routerInstance);
exports.ignore = routerInstance.ignore.bind(routerInstance);
exports.security = routerInstance.security.bind(routerInstance);
exports.produce = routerInstance.produce.bind(routerInstance);
exports.consume = routerInstance.consume.bind(routerInstance);

exports.permission = routerInstance.permission.bind(routerInstance);
exports.noAuth = routerInstance.noAuth.bind(routerInstance);
exports.resubmit = routerInstance.resubmit.bind(routerInstance);
exports.transactional = routerInstance.transactional.bind(routerInstance);

exports.request = routerInstance.request.bind(routerInstance);
exports.response = routerInstance.response.bind(routerInstance);

/** 暴露实例的prefix和http的各个方法 */
// exports.Router = new RouterDecorator();
