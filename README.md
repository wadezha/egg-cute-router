# egg-cute-router

<!--
Description here.
-->

## Install

```bash
$ npm i egg-cute-router --save
```

## Usage

```js
import { Controller } from 'egg';
import { prefix, router, permission, noAuth, resubmit, transactional, request, response, deprecated, ignore, security, produce, consume } from 'egg-cute-router';

@prefix('/home', 'summary', 'desc', 'group')
@deprecated()
@ignore()
@security('apikey')
@produce('application/json,application/xml')
@consume('application/json,application/xml')
@permission('home')
@noAuth()
@resubmit(10, 3)
@transactional()
export default class HomeController extends Controller {
  @router('get', '/index', 'summary', 'desc')
  @request('query', 'number', 'id', 'desc', 'example', true, { min: 1, format: '' })
  @request('query', 'string', 'name', 'desc', 'example', true, { min: 1, format: '' })
  @request('body', 'array[User]', 'uVo')
  @request('body', 'string', 'name', 'desc', 'example', true, { min: 1, format: '' })
  @request('path', 'string', 'name2')
  @response('string', 'name3', 'desc', 'example', true, { min: 1, format: '' })
  @response('User', 'uVo')
  @deprecated()
  @ignore()
  @security('apikey')
  @produce('application/json,application/xml')
  @consume('application/json,application/xml')
  @permission('index')
  @noAuth()
  @resubmit(10)
  @transactional()
  public async index() {
    this.ctx.body = 'Hi World!';
  }
}

```

## Configuration

```js
// {app_root}/app/router.ts
import { Application } from 'egg';
import { init as initRouter } from 'egg-cute-router';

export default (app: Application) => {
  initRouter(app);
};
```


## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
