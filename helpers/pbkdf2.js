/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const crypto = require('node:crypto');

const pify = require('pify');

const cryptoPbkdf2 = pify(crypto.pbkdf2);

function pbkdf2(options) {
  return cryptoPbkdf2(
    options.password,
    options.salt,
    options.iterations,
    options.keylen,
    options.digestAlgorithm
  );
}

module.exports = pbkdf2;
