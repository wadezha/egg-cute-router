import { Application } from 'egg';
import { Middleware } from 'koa';

/** http装饰器方法类型 */
declare type HttpFunction = (url: string, desc?: string, ...middlewares: Middleware[]) => any;

declare class RouterDecorator {
    constructor ();

    get: HttpFunction;
    post: HttpFunction;
    delete: HttpFunction;
    put: HttpFunction;
    patch: HttpFunction;
    
    permission: (permission: string) => any;
    prefix(prefix: string, desc?: string, baseFn?: any[], ...middlewares: Middleware[]): (target: any) => any;

    static routers;
    static init(app: Application, options?: { prefix: string }): void;
}

/** 暴露注册路由方法 */
export declare const init: typeof RouterDecorator.init;
export declare const routers: typeof RouterDecorator.routers;

export declare const Router:  RouterDecorator;

// declare const _default: RouterDecorator;
// export default _default;
