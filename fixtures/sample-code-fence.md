`hugo.test.js`:

```js
const hugo = require('./hugo');
const express = require('express');
const moxios = require('moxios');
const request = require('supertest');

const initHugo = () => {
  const app = express();
  app.use(hugo());
  return app;
}
```
