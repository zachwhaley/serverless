'use strict';

const path = require('path');
const path2 = require('path2');

const anonymizeStacktracePaths = (stacktracePaths) => {
  let commonPathPrefix = path2.common(...stacktracePaths.filter((p) => path.isAbsolute(p)));

  let lastIndex;
  let match;
  const serverlessRegex = /[\\/]serverless[\\/]/g;
  while ((match = serverlessRegex.exec(commonPathPrefix)) != null) {
    lastIndex = match.index;
  }

  if (lastIndex) {
    commonPathPrefix = commonPathPrefix.substring(0, lastIndex);
  }
  return stacktracePaths.map((s) => s.replace(commonPathPrefix, ''));
};

module.exports = anonymizeStacktracePaths;
