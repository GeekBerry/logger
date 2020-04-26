const assert = require('assert');
const pathLib = require('path');

const LogStream = require('./LogStream');
const { openWriteStream, makeDirectory, renameFile, unlinkFile, createTime } = require('./util');

const DAY_MS = 24 * 60 * 60 * 1000;

class DailyFileStream extends LogStream {
  constructor({
    level,
    path,
    days = 30,
  }) {
    assert(Number.isInteger(days) && days > 1, `days must be integer>0, got ${days}`);
    makeDirectory(path);

    super({ level });
    this.path = path;
    this.days = days;
    this.openDay = 0;
  }

  pathOfTime(timestamp) {
    const date = new Date(timestamp);
    const { dir, name, ext } = pathLib.parse(this.path);
    return pathLib.format({ dir, name: `${name}.${date.toISOString().slice(0, 10)}`, ext });
  }

  async opened() {
    const now = Date.now();
    const today = Math.floor(now / DAY_MS);

    if (this.openDay < today) {
      await this.close();

      if (createTime(this.path) < today * DAY_MS) {
        renameFile(this.path, this.pathOfTime(now - DAY_MS));
        unlinkFile(this.pathOfTime(now - DAY_MS * this.days));
      }

      this.stream = await openWriteStream(this.path, { flags: 'a' });
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

