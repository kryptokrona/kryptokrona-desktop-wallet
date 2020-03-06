// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

const http = require('http');
const fs = require('fs');

const file = fs.createWriteStream(
  'node_modules/turtlecoin-wallet-backend/dist/lib/Config.js'
);
const request = http.get(
  'https://gist.githubusercontent.com/ux33-331/4f198b2fa4697cc88d12d1de1263be4f/raw/e18160c4fb2d7a231e4442b0644db1b4d6c68c8d/Config.js',
  function(response) {
  response.pipe(file);
});
