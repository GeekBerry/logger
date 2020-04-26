const LEVEL = {
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6,
};

class LogStream {
  constructor({
    level,
    stream,
  }) {
    if (!LEVEL[level]) {
      throw new Error(`level "${level}" must be one of [${Object.keys(LEVEL).join(',')}]`);
    }

    this.level = level;
    this.stream = stream;
  }

  async log(level, string) {
    try {
      if (LEVEL[level] >= LEVEL[this.level]) {
        await this.stream.write(`${string}\n`);
      }
    } catch (e) {
      process.stderr.write(`WriteStream: ${e.message}\n`);
    }
  }

  async close() {
    try {
      await this.stream.close();
    } catch (e) {
      // pass
    }
  }
}

module.exports = LogStream;
module.exports.LEVEL = LEVEL;
