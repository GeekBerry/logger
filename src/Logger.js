const LogStream = require('./LogStream');
const DailyFileStream = require('./DailyFileStream');

class Logger {
  constructor({
    tags = {},
    streams = [],
  } = {}) {
    this.tags = tags;

    this.streams = streams.map(({ type, level, stream, path, days }) => {
      switch (type) {
        case 'stream':
          return new LogStream({ level, stream });

        case 'daily':
          return new DailyFileStream({ level, path, days });

        default:
          throw new Error(`unexpected type "${type}"`);
      }
    });

    this.trace = object => this.log('trace', object);
    this.debug = object => this.log('debug', object);
    this.info = object => this.log('info', object);
    this.warn = object => this.log('warn', object);
    this.error = object => this.log('error', object);
    this.fatal = object => this.log('fatal', object);
  }

  log(level, object) {
    if (!(object instanceof Object)) {
      object = { message: `${object}` };
    }

    const time = (new Date(Date.now())).toISOString();
    const string = JSON.stringify({ ...this.tags, ...object, time, level });
    return Promise.all(this.streams.map(stream => stream.log(level, string)));
  }

  close() {
    return Promise.all(this.streams.map(stream => stream.close()));
  }
}

module.exports = Logger;
