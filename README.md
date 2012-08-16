redis-web
=========

Connect middleware to proxy redis commands and pub/sub to a browser.

Example
-------

```javascript
// server
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
```

```javascript
// client
var clientCmd = redis.createClient();
clientCmd.get('mykey', function(err, data) {
  alert(data);
});

var clientPubSub = redis.createClient();
clientPubSub.psubscribe('*');
clientPubSub.on('pmessage', function (pattern, channel, message) {
  alert('Message: ' + channel + ': ' + message + '\n');
});
```