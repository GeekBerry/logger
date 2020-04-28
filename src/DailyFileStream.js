const assert = require('assert');
const LogStream = require('./LogStream');
const util = require('./util');

const DAY_MS = 24 * 60 * 60 * 1000;

function yyyymmdd(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 10);
}

class DailyFileStream extends LogStream {
  constructor({
    level,
    path,
    days = 30,
  }) {
    assert(Number.isInteger(days) && days > 1, `days must be integer>0, got ${days}`);
    util.makeDirectory(path);

    super({ level });
    this.path = path;
    this.days = days;
    this.openDay = 0;
  }

  async opened() {
    const now = Date.now();
    const today = Math.floor(now / DAY_MS);

    if (this.openDay < today) {
      await this.close();

      const createTime = util.createTime(this.path);
      if (createTime < today * DAY_MS) {
        util.renameFile(this.path, `${this.path}.${yyyymmdd(createTime)}`);
        util.unlinkFile(`${this.path}.${yyyymmdd(now - DAY_MS * this.days)}`);
      }

      this.stream = await util.openWriteStream(this.path, { flags: 'a' });
      this.openDay = today; // day start seconds
    }
  }

  async log(level, string) {
    await this.opened();
    return super.log(level, string);
  }

  async close() {
    if (this.stream) {
      await new Promise(resolve => this.stream.close(resolve));
    }
  }
}

module.exports = DailyFileStream;

