const util = require('util');
const lodash = require('lodash');
const Logger = require('./Logger');

// ----------------------------------------------------------------------------
const DEFAULT_OPTIONS = {
  level: 'info',
  args: () => undefined,
  result: () => undefined,
  error: (e) => e.stack.split('\n'),
  timeout: undefined,
};

// ----------------------------------------------------------------------------
class TraceLogger extends Logger {
  /**
   *
   * @param func {function}
   * @param [options] {object}
   * @param [options.level] {string}
   * @param [options.module] {string}
   * @param [options.method] {string}
   * @param [options.args] {function}
   * @param [options.result] {function}
   * @param [options.error] {function}
   * @param [options.timeout] {number}
   * @return {function}
   *
   * @example
   * func = traceLogger.decorate(func, {
   *   args: (...args) => args[0],
   *   result: result => typeof result,
   *   error: e => e.message,
   * })
   */
  decorate(func, options = {}) {
    options = { ...DEFAULT_OPTIONS, ...options };
    const module = options.module || func.constructor.name;
    const method = options.method || func.name;
    const timeout = options.timeout * 1000;

    const logger = this;
    return async function (...args) {
      const timestamp = Date.now();
      let timeoutHandle;
      let result;
      let error;

      try {
        if (timeout) {
          timeoutHandle = setTimeout(() => logger.warn({
            timeout, module, method,
            args: options.args(...args),
          }), timeout);
        }

        result = await func.call(this, ...args);
        return result;
      } catch (e) {
        error = e;
        throw e;
      } finally {
        clearTimeout(timeoutHandle);

        const duration = Date.now() - timestamp;

        if (error) {
          logger.error({
            duration, module, method,
            args: options.args(...args),
            error: options.error(error),
          });
        } else {
          logger[options.level]({
            duration, module, method,
            args: options.args(...args),
            result: options.result(result),
          });
        }
      }
    };
  }

  decorateMethod(object, method, options = {}) {
    const func = lodash.get(object, method);
    if (!lodash.isFunction(func)) {
      return;
    }

    options.module = options.module || object.constructor.name;

    object[method] = this.decorate(func, { module, method, ...options });
  }

  decorateObject(object, options = {}) {
    if (!lodash.isObject(object)) {
      return;
    }

    const descriptors = Object.getOwnPropertyDescriptors(object);
    lodash.forEach(descriptors, (descriptor, name) => {
      // XXX: only `public` and `async` function to be trace
      if (!name.startsWith('_') && util.types.isAsyncFunction(descriptor.value)) {
        this.decorateMethod(object, name, options);
      }
    });
  }

  decorateModule(instance, options = {}) {
    if (!lodash.isObject(instance)) {
      return;
    }

    const object = Object.getPrototypeOf(instance);
    const descriptors = Object.getOwnPropertyDescriptors(object);
    const nameArray = Object.keys({ ...descriptors, ...instance });
    for (const name of nameArray) {
      const descriptor = Object.getOwnPropertyDescriptor(object, name);
      if (!name.startsWith('_') && descriptor && util.types.isAsyncFunction(descriptor.value)) {
        this.decorateMethod(instance, name, options);
      }
    }
  }
}

module.exports = TraceLogger;
