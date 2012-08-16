'use strict';

var io = require('socket.io');
var connect = require('connect');
var http = require('http');
var redisWeb = require('../')();

var port = 3000;

var app = connect()
  .use(connect.static(__dirname))
  .use(redisWeb);

var server = http.createServer(app).listen(port);

var sio = io.listen(server);
redisWeb.setSocketIo(sio);

console.log('listening on port ' + port);
