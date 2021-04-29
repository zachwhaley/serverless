'use strict';

const chai = require('chai');
const sinon = require('sinon');

const path = require('path');
const overrideStdoutWrite = require('process-utils/override-stdout-write');
const handleError = require('../../../../lib/cli/handle-error');
const isStandaloneExecutable = require('../../../../lib/utils/isStandaloneExecutable');
const ServerlessError = require('../../../../lib/serverless-error');
const proxyquire = require('proxyquire');

chai.use(require('sinon-chai'));

const expect = chai.expect;

describe('test/unit/lib/cli/handle-error.test.js', () => {
  it('should log environment information', async () => {
    let stdoutData = '';
    await overrideStdoutWrite(
      (data) => (stdoutData += data),
      () => handleError(new ServerlessError('Test error'))
    );
    expect(stdoutData).to.have.string('Serverless Error');
    expect(stdoutData).to.have.string('Test error');
    expect(stdoutData).to.have.string('Your Environment Information');
    expect(stdoutData).to.have.string('Operating System:');
    expect(stdoutData).to.have.string('Node Version:');
    expect(stdoutData).to.have.string('Framework Version:');
    expect(stdoutData).to.have.string('Plugin Version:');
    expect(stdoutData).to.have.string('SDK Version:');
    expect(stdoutData).to.have.string('Components Version:');
  });

  it('should support `isUncaughtException` option', async () => {
    const processExitStub = sinon.stub(process, 'exit').returns();
    try {
      let stdoutData = '';
      await overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => handleError(new ServerlessError('Test error'), { isUncaughtException: true })
      );
      expect(processExitStub.called).to.be.true;
    } finally {
      processExitStub.restore();
    }
  });

  if (isStandaloneExecutable) {
    it('should report standalone installation', async () => {
      let stdoutData = '';
      await overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => handleError(new ServerlessError('Test error'))
      );
      expect(stdoutData).to.have.string('(standalone)');
    });
  } else {
    it('should support `isLocallyInstalled` option', async () => {
      let stdoutData = '';
      await overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => handleError(new ServerlessError('Test error'), { isLocallyInstalled: false })
      );
      expect(stdoutData).to.not.have.string('(local)');
      stdoutData = '';
      await overrideStdoutWrite(
        (data) => (stdoutData += data),
        () => handleError(new ServerlessError('Test error'), { isLocallyInstalled: true })
      );
      expect(stdoutData).to.have.string('(local)');
    });
  }

  it('should print stack trace with SLS_DEBUG', async () => {
    let stdoutData = '';
    process.env.SLS_DEBUG = '1';
    await overrideStdoutWrite(
      (data) => (stdoutData += data),
      () => handleError(new ServerlessError('Test error'))
    );
    expect(stdoutData).to.have.string(path.basename(__filename));
  });

  it('should not print stack trace without SLS_DEBUG', async () => {
    let stdoutData = '';
    delete process.env.SLS_DEBUG;
    await overrideStdoutWrite(
      (data) => (stdoutData += data),
      () => handleError(new ServerlessError('Test error'))
    );
    expect(stdoutData).to.not.have.string(path.basename(__filename));
  });

  it('should handle non-error objects', async () => {
    let stdoutData = '';
    await overrideStdoutWrite(
      (data) => (stdoutData += data),
      () => handleError('NON-ERROR')
    );
    expect(stdoutData).to.have.string('NON-ERROR');
  });

  describe('with mocked telemetry', () => {
    const generateTelemetryPayloadStub = sinon.stub().resolves({});
    const storeTelemetryLocallyStub = sinon.stub();
    const sendTelemetryStub = sinon.stub();

    const handleErrorWithMocks = proxyquire('../../../../lib/cli/handle-error', {
      '../utils/telemetry/areDisabled': false,
      '../utils/telemetry/generatePayload': generateTelemetryPayloadStub,
      '../utils/telemetry/index': {
        send: sendTelemetryStub,
        storeLocally: storeTelemetryLocallyStub,
      },
    });

    beforeEach(() => {
      generateTelemetryPayloadStub.resetHistory();
      storeTelemetryLocallyStub.resetHistory();
      sendTelemetryStub.resetHistory();
    });

    it('should record telemetry only if `hasTelemetryBeenReported` is `false`', async () => {
      // Override to avoid printing to stdout in tests
      await overrideStdoutWrite(
        () => {},
        () =>
          handleErrorWithMocks(new ServerlessError('Test error', 'ERR_CODE'), {
            hasTelemetryBeenReported: false,
          })
      );
      expect(generateTelemetryPayloadStub).to.be.calledOnce;
      expect(storeTelemetryLocallyStub).to.be.calledOnce;
      expect(sendTelemetryStub).to.be.calledOnce;
      expect(storeTelemetryLocallyStub.getCall(0).args[0]).to.deep.equal({
        outcome: 'failure',
        failureReason: {
          code: 'ERR_CODE',
          kind: 'user',
          location: null,
        },
      });
    });

    it('should not record telemetry if `hasTelemetryBeenReported` is `true`', async () => {
      // Override to avoid printing to stdout in tests
      await overrideStdoutWrite(
        () => {},
        () =>
          handleErrorWithMocks(new ServerlessError('Test error'), {
            hasTelemetryBeenReported: true,
          })
      );
      expect(generateTelemetryPayloadStub).not.to.be.called;
      expect(storeTelemetryLocallyStub).not.to.be.called;
      expect(sendTelemetryStub).not.to.be.called;
    });

    it('should not record telemetry if `hasTelemetryBeenReported` is not passed', async () => {
      // Override to avoid printing to stdout in tests
      await overrideStdoutWrite(
        () => {},
        () => handleErrorWithMocks(new ServerlessError('Test error'))
      );
      expect(generateTelemetryPayloadStub).not.to.be.called;
      expect(storeTelemetryLocallyStub).not.to.be.called;
      expect(sendTelemetryStub).not.to.be.called;
    });
  });
});
