'use strict';

const expect = require('chai').expect;

const ServerlessError = require('../../../../lib/serverless-error');
const resolveErrorLocation = require('../../../../lib/utils/resolve-error-location');

describe('test/unit/lib/utils/resolve-error-location.test.js', () => {
  it('should be null for user error with code', () => {
    const err = new ServerlessError('test', 'ERR_CODE');
    const result = resolveErrorLocation(err);
    expect(result).to.be.null;
  });

  it('should be null when stack missing', () => {
    const err = new Error('test');
    delete err.stack;
    const result = resolveErrorLocation(err);
    expect(result).to.be.null;
  });

  it('should be null for error with code and one-line stacktrace', () => {
    const err = new Error('test');
    err.code = 'ERR_CODE';
    err.stack = 'Oneline stacktrace';
    const result = resolveErrorLocation(err);
    expect(result).to.be.null;
  });

  it('should be null if no matching lines found', () => {
    const err = new Error('test');
    err.stack = 'no matching\nlines in\nstacktrace';
    const result = resolveErrorLocation(err);
    expect(result).to.be.null;
  });

  if (process.platform !== 'win32') {
    it('should return at most 5 lines', () => {
      const err = new Error('test');
      err.stack =
        'Error:\n' +
        '    at Context.it (/home/xxx/serverless/test/unit/lib/utils/resolve-error-location.test.js:10:17)\n' +
        '    at callFn (/home/xxx/serverless/node_modules/mocha/lib/runnable.js:366:21)\n' +
        '    at Test.Runnable.run (/home/xxx/serverless/node_modules/mocha/lib/runnable.js:354:5)\n' +
        '    at Runner.runTest (/home/xxx/serverless/node_modules/mocha/lib/runner.js:677:10)\n' +
        '    at next (/home/xxx/serverless/node_modules/mocha/lib/runner.js:801:12)\n' +
        '    at next (/home/xxx/serverless/node_modules/mocha/lib/runner.js:594:14)\n';
      const result = resolveErrorLocation(err);
      expect(result).to.deep.equal([
        '/test/unit/lib/utils/resolve-error-location.test.js:10:17',
        '/node_modules/mocha/lib/runnable.js:366:21',
        '/node_modules/mocha/lib/runnable.js:354:5',
        '/node_modules/mocha/lib/runner.js:677:10',
        '/node_modules/mocha/lib/runner.js:801:12',
      ]);
    });
  }

  if (process.platform === 'win32') {
    it('should return at most 5 lines', () => {
      const err = new Error('test');
      err.stack =
        'Error:\n' +
        '    at Context.it (C:\\home\\xxx\\serverless\\test\\unit\\lib\\utils\\resolve-error-location.test.js:10:17)\n' +
        '    at callFn (C:\\home\\xxx\\serverless\\node_modules\\mocha\\lib\\runnable.js:366:21)\n' +
        '    at Test.Runnable.run (C:\\home\\xxx\\serverless\\node_modules\\mocha\\lib\\runnable.js:354:5)\n' +
        '    at Runner.runTest (C:\\home\\xxx\\serverless\\node_modules\\mocha\\lib\\runner.js:677:10)\n' +
        '    at next (C:\\home\\xxx\\serverless\\node_modules\\mocha\\lib\\runner.js:801:12)\n' +
        '    at next (C:\\home\\xxx\\serverless\\node_modules\\mocha\\lib\\runner.js:594:14)\n';
      const result = resolveErrorLocation(err);
      expect(result).to.deep.equal([
        '\\test\\unit\\lib\\utils\\resolve-error-location.test.js:10:17',
        '\\node_modules\\mocha\\lib\\runnable.js:366:21',
        '\\node_modules\\mocha\\lib\\runnable.js:354:5',
        '\\node_modules\\mocha\\lib\\runner.js:677:10',
        '\\node_modules\\mocha\\lib\\runner.js:801:12',
      ]);
    });
  }
});
