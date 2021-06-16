'use strict';

const __routerFn__ = Symbol('__routerFn__');
const __handlerInit__ = Symbol('__handlerInit__');
const __controllerInit__ = Symbol('__controllerInit__');

/** http方法名 */
const HTTP_METHOD_ENUM = [ 'get', 'post', 'delete', 'put', 'patch' ];
const BASE_CONTROLLER_ROUTERS = [];

class RouterDecorator {
  constructor() {
    /** 动态生成RouterDecorator路由方法（等同 HTTP METHOD 方法） */
    HTTP_METHOD_ENUM.forEach(method => {
        this[method] = (url, desc, ...middlewares) => (target, handler) => this[__routerFn__](target, handler, method, url, desc, ...middlewares);
    });
  }
  
  /**
   * 路由信息获取函数
   * @param {string} target 执行类
   * @param {string} handler 执行的方法名称
   * @param {string} method
   * @param {string} url
   * @param {string} desc
   * @param {...Middleware[]} middlewares
   */
  [__routerFn__](target, handler, method, url, desc, ...middlewares) {
    const routerOption = {
      method,
      url,
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

    /** 推入路由配置 */
    RouterDecorator.__router__ = RouterDecorator.__router__ || [];
    RouterDecorator.__router__.push(routerOption);
  }

  /**
   * 路由权限获取函数
   * @param {string} permission
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  permission(permission) {
    return function(target, handler) {
      let controller = target.constructor.name;
      if (typeof target === 'function') {
        controller = target.name;
      }
      const option = {
        controller,
        handler,
        permission,
      };
      RouterDecorator.__permission__.push(option);
    };
  }

  /**
   * 装饰Controller class的工厂函数
   * 为一整个Controller添加prefix
   * 可以追加中间件
   * @param {string} prefix
   * @param {string} desc
   * @param {[]} baseFn 配置通用的接口 可选 page、add、update、delete、info、list
   * @param {...Middleware[]} middlewares
   * @return 装饰器函数
   * @memberof RouterDecorator
   */
  prefix(prefix, desc, baseFn = [], ...middlewares) {
    return function(target) {
      RouterDecorator.__prefix__[target.name] = {
        prefix,
        desc: desc || '',
        middlewares,
        baseFn,
        target,
      };
      return target;
    };
  }

  /** 解析 Handler 路由 */
  static [__handlerInit__](app, options, basePrefix, rt) {

    const prefixData = RouterDecorator.__prefix__[rt.controller] || basePrefix;
    // 全局路径+Controller配置路径+方法的设置路径
    rt.fullUrl = `${options.prefix}${prefixData.prefix}${rt.url}`;
    rt.desc = (prefixData.desc ? `${prefixData.desc}-` : '') + rt.desc;

    // 权限
    const handlerPerm = RouterDecorator.__permission__.find(p => p.controller === rt.controller && p.handler === rt.handler);
    const controllerPerm = RouterDecorator.__permission__.find(p => p.controller === rt.controller && !p.handler);
    if (handlerPerm) {
      const prefixPerm = controllerPerm && controllerPerm.permission ? `${controllerPerm.permission}_` : '';
      rt.permission = `${prefixPerm}${handlerPerm.permission}`;
    }

    console.log(`controller handler register URL [ ${rt.method.toUpperCase()} ] ${rt.fullUrl} , ${rt.controller}.${rt.handler} , ${rt.permission} , ${rt.desc}`);

    if (RouterDecorator.routers.filter(f => f.url === rt.fullUrl).length === 0) {
      app.router[rt.method](rt.fullUrl, ...prefixData.middlewares, ...rt.middlewares, async ctx => {
        const ist = new rt.constructorFn(ctx);
        await ist[rt.handler](ctx);
      });

      RouterDecorator.routers.push({ method: rt.method, url: rt.fullUrl, controller: rt.controller, handler: rt.handler, permission: rt.permission, desc: rt.desc });
    }
  }

  /** 解析 Controller 通用路由 */
  static [__controllerInit__](app, options, basePrefix, cl) {
    const prefixData = RouterDecorator.__prefix__[cl] || basePrefix;

    const baseRouters = BASE_CONTROLLER_ROUTERS.filter(b => prefixData.baseFn.includes(b.url.replace('/', '')));
    baseRouters.forEach(t => {
      const t2 = JSON.parse(JSON.stringify(t));
      // 全局路径+Controller配置路径+内置方法路径
      t2.fullUrl = `${options.prefix}${prefixData.prefix}${t2.url}`;
      t2.desc = (prefixData.desc ? `${prefixData.desc}-` : '') + t2.desc;

    // 权限
      const controllerPerm = RouterDecorator.__permission__.find(f => f.controller === cl && !f.handler);
      if (controllerPerm) {
        t2.permission = `${controllerPerm.permission}_${t2.handler}`;
      }

      console.log(`controller register URL [ ${t2.method.toUpperCase()} ] ${t2.fullUrl} , ${cl}.${t2.handler} , ${t2.permission} , ${t2.desc}`);

      app.router[t2.method](t2.fullUrl, ...prefixData.middlewares, ...t2.middlewares, async ctx => {
        const ist = new prefixData.target(ctx);
        await ist[t2.handler](ctx);
      });

      RouterDecorator.routers.push({ method: t2.method, url: t2.fullUrl, controller: cl, handler: t2.handler, permission: t2.permission, desc: t2.desc });
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
      desc: '',
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
 * 记录各个routerUrl的路由权限
 * @private
 * @static
 * @type {Array}
 * @memberof RouterDecorator
 */
RouterDecorator.__permission__ = [];

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

/** 暴露实例的prefix和http的各个方法 */
exports.Router = new RouterDecorator();
