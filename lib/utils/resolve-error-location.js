'use strict';
const anonymizeStacktracePaths = require('./anonymize-stacktrace-paths');
const tokenizeException = require('./tokenize-exception');

const resolveErrorLocation = (error) => {
  const exceptionTokens = tokenizeException(error);

  if (exceptionTokens.isUserError && error.code) return null;

  if (!exceptionTokens.stack) return null;

  const splittedStack = exceptionTokens.stack.split('\n');
  if (splittedStack.length === 1 && error.code) return null;

  const stacktraceLineRegex = /\s*at.*\((.*)\).?/;
  const stacktracePaths = [];
  for (const line of splittedStack) {
    const match = stacktraceLineRegex.exec(line) || [];
    const matchedPath = match[1];
    if (matchedPath) {
      stacktracePaths.push(matchedPath);
      // Limited to maximum 5 lines in location
      if (stacktracePaths.length > 4) {
        break;
      }
    } else if (stacktracePaths.length) break;
  }

  if (!stacktracePaths.length) return null;

  return anonymizeStacktracePaths(stacktracePaths);
};

module.exports = resolveErrorLocation;
