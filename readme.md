# Logger

## Usage

* code

```
const Logger = require('@geekberry/logger');

const logger = new Logger({
  tags: { name: 'app' },
  streams: [
    {
      type: 'stream',
      level: 'info',
      stream: process.stdout,
    },
    { 
      type: 'daily',
      level: 'info',
      path: `${__dirname}/log/info.log`,
      days: 2,
    },
    {
      type: 'daily',
      level: 'error',
      path: `${__dirname}/log/error.log`,
      days: 30,
    },
  ]
})

logger.debug({ object: true });
logger.info({ object: true });
logger.error({ object: true });
logger.error('string');
```

* process.stdout print

```
{"name":"app","object":true,"time":"2020-04-28T05:55:36.030Z","level":"info"}
{"name":"app","object":true,"time":"2020-04-28T05:55:36.031Z","level":"error"}
{"name":"app","message":"string","time":"2020-04-28T05:55:36.031Z","level":"error"}
```

* file created

```
/log/info.log
/log/error.log
```
