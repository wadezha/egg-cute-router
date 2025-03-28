import { Application } from 'egg';
import { Middleware } from 'koa';

/** http装饰器方法类型 */

declare class RouterDecorator {
    constructor ();

    prefix: (prefix: string, summary?: string, desc?: string, group?: string, baseFn?: any[], ...middlewares: Middleware[]) => (target: any) => any;
    router: (method: string, url: string, summary?: string, desc?: string, ...middlewares: Middleware[]) => any;

    deprecated: (deprecated: boolean = true) => any;
    ignore: (ignore: boolean = true) => any;
    security: (security: string) => any;
    produce: (produce: string) => any;
    consume: (consume: string) => any;

    permission: (permission: string) => any;
    noAuth: (noAuth: boolean = true) => any;
    resubmit: (second: number = 2, times: number = 1) => any;
    transactional: (transactional: boolean = true) => any;

    request: (position: string, type: string, name: string = '', desc: string = '', example: any = '', required: boolean = true, prop: any = {}) => any;
    response: (type: string, name: string = '', desc: string = '', example: string = '', required: boolean = true, prop: any = {}) => any;

    static routers;
    static init(app: Application, options?: { prefix: string }): void;
}

/** 暴露注册路由方法 */
export declare const init: typeof RouterDecorator.init;
export declare const routers: typeof RouterDecorator.routers;

// export declare const Router:  RouterDecorator;
export declare const prefix: (prefix: string, summary?: string, desc?: string, group?: string, baseFn?: any[], ...middlewares: Middleware[]) => (target: any) => any;
export declare const router: (method: string, url: string, summary?: string, desc?: string, ...middlewares: Middleware[]) => any;

export declare const deprecated: (deprecated: boolean = true) => any;
export declare const ignore: (ignore: boolean = true) => any;
export declare const security: (security: string) => any;
export declare const produce: (produce: string) => any;
export declare const consume: (consume: string) => any;

export declare const permission: (permission: string) => any;
export declare const noAuth: (noAuth: boolean = true) => any;
export declare const resubmit: (second: number = 2, times: number = 1) => any;
export declare const transactional: (transactional: boolean = true) => any;

export declare const request: (position: string, type: string, name: string = '', desc: string = '', example: any = '', required: boolean = true, prop: any = {}) => any;
export declare const response: (type: string, name: string = '', desc: string = '', example: string = '', required: boolean = true, prop: any = {}) => any;
